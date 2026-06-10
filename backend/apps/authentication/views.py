import base64
import io
import pickle
import numpy as np
import face_recognition
from PIL import Image

from rest_framework          import status
from rest_framework.views    import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework_simplejwt.tokens import RefreshToken
from django.conf import settings
from django.utils import timezone

from .models      import Utilisateur, Etudiant, Visage, Role, OTPVerification
from .serializers import (
    InscriptionSerializer,
    ConnexionSerializer,
    UtilisateurSerializer,
    EtudiantSerializer,
    EncodageVisageSerializer,
    VerificationVisageSerializer,
)
from .email_service import envoyer_otp_email


def get_tokens(user):
    refresh = RefreshToken.for_user(user)
    refresh['role']      = user.role
    refresh['matricule'] = user.matricule
    return {
        'refresh': str(refresh),
        'access':  str(refresh.access_token),
    }


def base64_to_array(image_base64):
    img_data  = base64.b64decode(image_base64)
    img       = Image.open(io.BytesIO(img_data)).convert('RGB')
    img_array = np.array(img)
    return img_array


class InscriptionView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = InscriptionSerializer(data=request.data)
        if serializer.is_valid():
            utilisateur = serializer.save()
            code = OTPVerification.generer_code()
            OTPVerification.objects.create(utilisateur=utilisateur, code=code)
            envoyer_otp_email(
                email=utilisateur.email,
                prenom=utilisateur.prenom,
                code_otp=code
            )
            return Response({
                'message': 'Inscription réussie. Un code OTP a été envoyé à votre email.',
                'utilisateur_id': str(utilisateur.id),
                'email': utilisateur.email,
            }, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ConnexionView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = ConnexionSerializer(data=request.data)
        if serializer.is_valid():
            utilisateur = serializer.validated_data['utilisateur']
            if not utilisateur.email_verifie:
                return Response({
                    'erreur': 'Votre email n\'est pas vérifié.',
                    'email_non_verifie': True,
                    'email': utilisateur.email,
                }, status=status.HTTP_403_FORBIDDEN)
            utilisateur.derniere_connexion = timezone.now()
            utilisateur.save()
            tokens = get_tokens(utilisateur)
            return Response({
                'message':      'Connexion réussie.',
                'tokens':        tokens,
                'role':          utilisateur.role,
                'utilisateur':   UtilisateurSerializer(utilisateur).data,
                'face_verified': False,
            }, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class EncodageVisageView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            if not hasattr(request.user, 'profil_etudiant'):
                return Response(
                    {'erreur': 'Seuls les étudiants peuvent enregistrer leur visage.'},
                    status=status.HTTP_403_FORBIDDEN
                )

            etudiant  = request.user.profil_etudiant
            img_array = base64_to_array(request.data['image_base64'])

            # DEBUG
            print(f"=== IMAGE SHAPE: {img_array.shape} ===")
            print(f"=== IMAGE DTYPE: {img_array.dtype} ===")

            # Tenter détection avec différents paramètres
            locations = face_recognition.face_locations(img_array, model='hog')
            print(f"=== LOCATIONS HOG: {locations} ===")

            if not locations:
                locations = face_recognition.face_locations(
                    img_array,
                    number_of_times_to_upsample=2
                )
                print(f"=== LOCATIONS UPSAMPLE 2: {locations} ===")

            if not locations:
                return Response(
                    {'erreur': 'Aucun visage détecté. Assurez-vous d\'être bien éclairé et face à la caméra.'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            encodages = face_recognition.face_encodings(img_array, locations, num_jitters=1)
            if not encodages:
                return Response(
                    {'erreur': 'Impossible de générer l\'encodage facial.'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            embedding = encodages[0]

            # Vérifier que ce visage n'est pas déjà enregistré
            tous_les_visages = Visage.objects.exclude(etudiant=etudiant)
            for visage_existant in tous_les_visages:
                try:
                    emb_existant = pickle.loads(bytes(visage_existant.face_embedding))
                    distance = face_recognition.face_distance([emb_existant], embedding)[0]
                    if distance < 0.5:
                        return Response(
                            {'erreur': 'Ce visage est déjà enregistré pour un autre étudiant. Inscription refusée.'},
                            status=status.HTTP_400_BAD_REQUEST
                        )
                except Exception:
                    continue

            Visage.objects.update_or_create(
                etudiant=etudiant,
                defaults={
                    'face_embedding': pickle.dumps(embedding),
                    'modele_utilise': 'face_recognition',
                }
            )

            return Response({'message': 'Visage enregistré avec succès !'}, status=status.HTTP_200_OK)
        except Exception as e:
            print(f"=== ERREUR ENCODAGE: {str(e)} ===")
            return Response(
                {'erreur': f'Erreur : {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class VerificationVisageView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            if not hasattr(request.user, 'profil_etudiant'):
                return Response(
                    {'erreur': 'Aucun profil étudiant trouvé.'},
                    status=status.HTTP_403_FORBIDDEN
                )

            etudiant = request.user.profil_etudiant

            if not hasattr(etudiant, 'visage'):
                return Response(
                    {'erreur': 'Aucun visage enregistré.'},
                    status=status.HTTP_404_NOT_FOUND
                )

            img_array = base64_to_array(request.data['image_base64'])

            print(f"=== VERIFICATION IMAGE SHAPE: {img_array.shape} ===")

            locations = face_recognition.face_locations(img_array, model='hog')
            print(f"=== VERIFICATION LOCATIONS: {locations} ===")

            if not locations:
                locations = face_recognition.face_locations(
                    img_array,
                    number_of_times_to_upsample=2
                )

            if not locations:
                return Response(
                    {'erreur': 'Aucun visage détecté. Placez-vous face à la caméra.'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            encodages_live = face_recognition.face_encodings(img_array, locations, num_jitters=1)
            if not encodages_live:
                return Response(
                    {'erreur': 'Impossible d\'encoder le visage.'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            embedding_live        = encodages_live[0]
            embedding_inscription = pickle.loads(bytes(etudiant.visage.face_embedding))

            tolerance = 1 - settings.FACE_RECOGNITION_THRESHOLD
            distances = face_recognition.face_distance([embedding_inscription], embedding_live)
            score     = float(distances[0])
            match     = face_recognition.compare_faces(
                [embedding_inscription], embedding_live, tolerance=tolerance
            )[0]

            print(f"=== SCORE: {score}, MATCH: {match}, TOLERANCE: {tolerance} ===")

            if match:
                return Response({
                    'identite_confirmee': True,
                    'score':              round(1 - score, 4),
                    'message':            'Identité confirmée ✓',
                }, status=status.HTTP_200_OK)
            else:
                return Response({
                    'identite_confirmee': False,
                    'score':              round(1 - score, 4),
                    'message':            'Visage non reconnu. Accès refusé.',
                }, status=status.HTTP_403_FORBIDDEN)

        except Exception as e:
            print(f"=== ERREUR VERIFICATION: {str(e)} ===")
            return Response(
                {'erreur': f'Erreur : {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class ProfilView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        serializer = UtilisateurSerializer(request.user)
        data       = serializer.data
        if hasattr(request.user, 'profil_etudiant'):
            data['profil'] = EtudiantSerializer(request.user.profil_etudiant).data
        return Response(data, status=status.HTTP_200_OK)


class DeconnexionView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            refresh_token = request.data['refresh']
            token         = RefreshToken(refresh_token)
            token.blacklist()
            return Response({'message': 'Déconnexion réussie.'}, status=status.HTTP_200_OK)
        except Exception:
            return Response({'erreur': 'Token invalide.'}, status=status.HTTP_400_BAD_REQUEST)


class EnvoyerOTPView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get('email')
        if not email:
            return Response({'erreur': 'Email requis.'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            utilisateur = Utilisateur.objects.get(email=email)
        except Utilisateur.DoesNotExist:
            return Response({'erreur': 'Aucun compte trouvé.'}, status=status.HTTP_404_NOT_FOUND)

        OTPVerification.objects.filter(
            utilisateur=utilisateur, est_utilise=False
        ).update(est_utilise=True)

        code = OTPVerification.generer_code()
        OTPVerification.objects.create(utilisateur=utilisateur, code=code)
        succes = envoyer_otp_email(
            email=utilisateur.email,
            prenom=utilisateur.prenom,
            code_otp=code
        )

        if succes:
            return Response({'message': f'Code OTP envoyé à {email}'}, status=status.HTTP_200_OK)
        return Response(
            {'erreur': 'Erreur envoi email.'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


class VerifierOTPView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get('email')
        code  = request.data.get('code')
        if not email or not code:
            return Response({'erreur': 'Email et code requis.'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            utilisateur = Utilisateur.objects.get(email=email)
        except Utilisateur.DoesNotExist:
            return Response({'erreur': 'Utilisateur non trouvé.'}, status=status.HTTP_404_NOT_FOUND)
        try:
            otp = OTPVerification.objects.filter(
                utilisateur=utilisateur,
                code=code,
                est_utilise=False
            ).latest('date_creation')
        except OTPVerification.DoesNotExist:
            return Response({'erreur': 'Code OTP invalide.'}, status=status.HTTP_400_BAD_REQUEST)
        if not otp.est_valide():
            return Response({'erreur': 'Code OTP expiré.'}, status=status.HTTP_400_BAD_REQUEST)
        otp.est_utilise = True
        otp.save()
        utilisateur.email_verifie = True
        utilisateur.save()
        return Response({'message': 'Email vérifié avec succès !'}, status=status.HTTP_200_OK)