import base64
import io
import pickle
import numpy as np
import face_recognition
from PIL import Image
import json
import webauthn
from webauthn.helpers.structs import (
    AuthenticatorSelectionCriteria,
    UserVerificationRequirement,
    ResidentKeyRequirement,
)
from webauthn.helpers.cose import COSEAlgorithmIdentifier

from rest_framework          import status
from rest_framework.views    import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework_simplejwt.tokens import RefreshToken
from django.conf import settings
from django.utils import timezone

from .models      import Utilisateur, Etudiant, Visage, Role, OTPVerification, EtudiantAutorise, WebAuthnCredential, InscriptionTemporaire
from .serializers import (
    InscriptionSerializer,
    ConnexionSerializer,
    UtilisateurSerializer,
    EtudiantSerializer,
    EncodageVisageSerializer,
    VerificationVisageSerializer,
)
from .email_service import envoyer_otp_email

RP_ID   = '192.168.11.203'
RP_NAME = 'Vote Délégué IUT'
ORIGIN  = 'https://192.168.11.203:5173'


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
            locations = face_recognition.face_locations(img_array, model='hog')
            if not locations:
                locations = face_recognition.face_locations(img_array, number_of_times_to_upsample=2)
            if not locations:
                return Response({'erreur': 'Aucun visage détecté.'}, status=status.HTTP_400_BAD_REQUEST)
            encodages = face_recognition.face_encodings(img_array, locations, num_jitters=1)
            if not encodages:
                return Response({'erreur': 'Impossible de générer l\'encodage facial.'}, status=status.HTTP_400_BAD_REQUEST)
            embedding = encodages[0]
            Visage.objects.update_or_create(
                etudiant=etudiant,
                defaults={'face_embedding': pickle.dumps(embedding), 'modele_utilise': 'face_recognition'}
            )
            return Response({'message': 'Visage enregistré avec succès !'}, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({'erreur': f'Erreur : {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class VerificationVisageView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            if not hasattr(request.user, 'profil_etudiant'):
                return Response({'erreur': 'Aucun profil étudiant trouvé.'}, status=status.HTTP_403_FORBIDDEN)
            etudiant = request.user.profil_etudiant
            if not hasattr(etudiant, 'visage'):
                return Response({'erreur': 'Aucun visage enregistré.'}, status=status.HTTP_404_NOT_FOUND)
            img_array = base64_to_array(request.data['image_base64'])
            locations = face_recognition.face_locations(img_array, model='hog')
            if not locations:
                locations = face_recognition.face_locations(img_array, number_of_times_to_upsample=2)
            if not locations:
                return Response({'erreur': 'Aucun visage détecté.'}, status=status.HTTP_400_BAD_REQUEST)
            encodages_live = face_recognition.face_encodings(img_array, locations, num_jitters=1)
            if not encodages_live:
                return Response({'erreur': 'Impossible d\'encoder le visage.'}, status=status.HTTP_400_BAD_REQUEST)
            embedding_live        = encodages_live[0]
            embedding_inscription = pickle.loads(bytes(etudiant.visage.face_embedding))
            tolerance = 1 - settings.FACE_RECOGNITION_THRESHOLD
            distances = face_recognition.face_distance([embedding_inscription], embedding_live)
            score     = float(distances[0])
            match     = face_recognition.compare_faces([embedding_inscription], embedding_live, tolerance=tolerance)[0]
            if match:
                return Response({'identite_confirmee': True, 'score': round(1 - score, 4), 'message': 'Identité confirmée ✓'}, status=status.HTTP_200_OK)
            else:
                return Response({'identite_confirmee': False, 'score': round(1 - score, 4), 'message': 'Visage non reconnu.'}, status=status.HTTP_403_FORBIDDEN)
        except Exception as e:
            return Response({'erreur': f'Erreur : {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


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
        OTPVerification.objects.filter(utilisateur=utilisateur, est_utilise=False).update(est_utilise=True)
        code = OTPVerification.generer_code()
        OTPVerification.objects.create(utilisateur=utilisateur, code=code)
        succes = envoyer_otp_email(email=utilisateur.email, prenom=utilisateur.prenom, code_otp=code)
        if succes:
            return Response({'message': f'Code OTP envoyé à {email}'}, status=status.HTTP_200_OK)
        return Response({'erreur': 'Erreur envoi email.'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


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
            otp = OTPVerification.objects.filter(utilisateur=utilisateur, code=code, est_utilise=False).latest('date_creation')
        except OTPVerification.DoesNotExist:
            return Response({'erreur': 'Code OTP invalide.'}, status=status.HTTP_400_BAD_REQUEST)
        if not otp.est_valide():
            return Response({'erreur': 'Code OTP expiré.'}, status=status.HTTP_400_BAD_REQUEST)
        otp.est_utilise = True
        otp.save()
        utilisateur.email_verifie = True
        utilisateur.save()
        return Response({'message': 'Email vérifié avec succès !'}, status=status.HTTP_200_OK)

class EtudiantAutoriseListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if request.user.role != 'ADMINISTRATEUR':
            return Response({'erreur': 'Accès refusé.'}, status=status.HTTP_403_FORBIDDEN)
        etudiants = EtudiantAutorise.objects.all().order_by('-date_ajout')
        data = [{
            'id': e.id,
            'matricule': e.matricule,
            'nom': e.nom,
            'prenom': e.prenom,
            'filiere': e.filiere,
            'niveau': e.niveau,
            'annee_academique': e.annee_academique,
            'est_inscrit': e.est_inscrit,
            'date_ajout': e.date_ajout,
        } for e in etudiants]
        return Response(data, status=status.HTTP_200_OK)

    def post(self, request):
        if request.user.role != 'ADMINISTRATEUR':
            return Response({'erreur': 'Accès refusé.'}, status=status.HTTP_403_FORBIDDEN)
        required = ['matricule', 'nom', 'prenom', 'filiere', 'niveau']
        for field in required:
            if not request.data.get(field):
                return Response({'erreur': f'Champ requis : {field}'}, status=status.HTTP_400_BAD_REQUEST)
        if EtudiantAutorise.objects.filter(matricule=request.data['matricule']).exists():
            return Response({'erreur': 'Ce matricule existe déjà.'}, status=status.HTTP_400_BAD_REQUEST)
        e = EtudiantAutorise.objects.create(
            matricule=request.data['matricule'],
            nom=request.data['nom'],
            prenom=request.data['prenom'],
            filiere=request.data['filiere'],
            niveau=request.data['niveau'],
            annee_academique=request.data.get('annee_academique', '2025-2026'),
        )
        return Response({'message': 'Étudiant autorisé ajouté.', 'id': e.id}, status=status.HTTP_201_CREATED)


class EtudiantAutoriseDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request, pk):
        if request.user.role != 'ADMINISTRATEUR':
            return Response({'erreur': 'Accès refusé.'}, status=status.HTTP_403_FORBIDDEN)
        try:
            e = EtudiantAutorise.objects.get(pk=pk)
            e.delete()
            return Response({'message': 'Étudiant supprimé.'}, status=status.HTTP_200_OK)
        except EtudiantAutorise.DoesNotExist:
            return Response({'erreur': 'Étudiant non trouvé.'}, status=status.HTTP_404_NOT_FOUND)


class ImportExcelEtudiantsView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        if request.user.role != 'ADMINISTRATEUR':
            return Response({'erreur': 'Accès refusé.'}, status=status.HTTP_403_FORBIDDEN)
        fichier = request.FILES.get('fichier')
        if not fichier:
            return Response({'erreur': 'Fichier Excel requis.'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            import openpyxl
            wb = openpyxl.load_workbook(fichier)
            ws = wb.active
            ajoutes, ignores = 0, 0
            for row in ws.iter_rows(min_row=2, values_only=True):
                if not row[0]:
                    continue
                matricule = str(row[0])
                nom       = str(row[1])
                prenom    = str(row[2])
                filiere   = str(row[3])
                niveau    = str(row[4])
                annee     = str(row[5]) if len(row) > 5 and row[5] else '2025-2026'
                if EtudiantAutorise.objects.filter(matricule=matricule).exists():
                    ignores += 1
                    continue
                EtudiantAutorise.objects.create(
                    matricule=matricule, nom=nom, prenom=prenom,
                    filiere=filiere, niveau=niveau, annee_academique=annee
                )
                ajoutes += 1
            return Response({'message': f'{ajoutes} étudiant(s) ajouté(s), {ignores} ignoré(s).'}, status=status.HTTP_200_OK)
        except Exception as ex:
            return Response({'erreur': f'Erreur lecture fichier : {str(ex)}'}, status=status.HTTP_400_BAD_REQUEST)


class GestionUtilisateursView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if request.user.role != 'ADMINISTRATEUR':
            return Response({'erreur': 'Accès refusé.'}, status=status.HTTP_403_FORBIDDEN)
        role = request.query_params.get('role', None)
        users = Utilisateur.objects.exclude(role='ADMINISTRATEUR').order_by('-date_inscription')
        if role:
            users = users.filter(role=role)
        data = []
        for u in users:
            item = {
                'id':               str(u.id),
                'matricule':        u.matricule,
                'nom':              u.nom,
                'prenom':           u.prenom,
                'email':            u.email,
                'role':             u.role,
                'est_actif':        u.est_actif,
                'est_supprime':     u.est_supprime,
                'email_verifie':    u.email_verifie,
                'date_inscription': u.date_inscription,
            }
            if hasattr(u, 'profil_etudiant'):
                item['filiere'] = u.profil_etudiant.filiere
                item['niveau']  = u.profil_etudiant.niveau
            data.append(item)
        return Response(data, status=status.HTTP_200_OK)


class GestionUtilisateurDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def put(self, request, user_id):
        if request.user.role != 'ADMINISTRATEUR':
            return Response({'erreur': 'Accès refusé.'}, status=status.HTTP_403_FORBIDDEN)
        try:
            u = Utilisateur.objects.get(id=user_id)
        except Utilisateur.DoesNotExist:
            return Response({'erreur': 'Utilisateur non trouvé.'}, status=status.HTTP_404_NOT_FOUND)
        u.nom    = request.data.get('nom',    u.nom)
        u.prenom = request.data.get('prenom', u.prenom)
        u.email  = request.data.get('email',  u.email)
        u.save()
        if hasattr(u, 'profil_etudiant'):
            u.profil_etudiant.filiere = request.data.get('filiere', u.profil_etudiant.filiere)
            u.profil_etudiant.niveau  = request.data.get('niveau',  u.profil_etudiant.niveau)
            u.profil_etudiant.save()
        return Response({'message': 'Utilisateur modifié avec succès.'}, status=status.HTTP_200_OK)

    def delete(self, request, user_id):
        if request.user.role != 'ADMINISTRATEUR':
            return Response({'erreur': 'Accès refusé.'}, status=status.HTTP_403_FORBIDDEN)
        try:
            u = Utilisateur.objects.get(id=user_id)
        except Utilisateur.DoesNotExist:
            return Response({'erreur': 'Utilisateur non trouvé.'}, status=status.HTTP_404_NOT_FOUND)
        u.est_actif    = False
        u.est_supprime = True
        if hasattr(u, 'profil_etudiant'):
            from apps.candidatures.models import Candidature
            Candidature.objects.filter(etudiant=u.profil_etudiant, statut='VALIDEE').update(statut='RETIREE')
        u.save()
        return Response({'message': 'Compte mis à la corbeille.'}, status=status.HTTP_200_OK)


class RestaurerUtilisateurView(APIView):
    permission_classes = [IsAuthenticated]

    def put(self, request, user_id):
        if request.user.role != 'ADMINISTRATEUR':
            return Response({'erreur': 'Accès refusé.'}, status=status.HTTP_403_FORBIDDEN)
        try:
            u = Utilisateur.objects.get(id=user_id)
        except Utilisateur.DoesNotExist:
            return Response({'erreur': 'Utilisateur non trouvé.'}, status=status.HTTP_404_NOT_FOUND)
        u.est_actif    = True
        u.est_supprime = False
        if hasattr(u, 'profil_etudiant'):
            from apps.candidatures.models import Candidature
            Candidature.objects.filter(etudiant=u.profil_etudiant, statut='RETIREE').update(statut='VALIDEE')
        u.save()
        return Response({'message': 'Compte restauré.'}, status=status.HTTP_200_OK)


class SupprimerDefinitivementView(APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request, user_id):
        if request.user.role != 'ADMINISTRATEUR':
            return Response({'erreur': 'Accès refusé.'}, status=status.HTTP_403_FORBIDDEN)
        try:
            u = Utilisateur.objects.get(id=user_id)
        except Utilisateur.DoesNotExist:
            return Response({'erreur': 'Utilisateur non trouvé.'}, status=status.HTTP_404_NOT_FOUND)
        if hasattr(u, 'profil_etudiant'):
            from apps.candidatures.models import Candidature
            from apps.resultats.models import Resultat
            candidatures = Candidature.objects.filter(etudiant=u.profil_etudiant)
            for cand in candidatures:
                Resultat.objects.filter(candidat=cand).delete()
                cand.statut = 'RETIREE'
                cand.save()
        EtudiantAutorise.objects.filter(matricule=u.matricule).update(est_inscrit=False)
        u.delete()
        return Response({'message': 'Compte supprimé définitivement.'}, status=status.HTTP_200_OK)

class WebAuthnRegisterBeginView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user
        options = webauthn.generate_registration_options(
            rp_id=RP_ID,
            rp_name=RP_NAME,
            user_id=str(user.id).encode(),
            user_name=user.matricule,
            user_display_name=f"{user.prenom} {user.nom}",
            authenticator_selection=AuthenticatorSelectionCriteria(
                user_verification=UserVerificationRequirement.REQUIRED,
                resident_key=ResidentKeyRequirement.PREFERRED,
            ),
            supported_pub_key_algs=[COSEAlgorithmIdentifier.ECDSA_SHA_256],
        )
        request.session['webauthn_register_challenge'] = base64.b64encode(options.challenge).decode()
        return Response(json.loads(webauthn.options_to_json(options)), status=status.HTTP_200_OK)


class WebAuthnRegisterCompleteView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        challenge_b64 = request.session.get('webauthn_register_challenge')
        if not challenge_b64:
            return Response({'erreur': 'Challenge expiré.'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            challenge = base64.b64decode(challenge_b64)
            credential = webauthn.verify_registration_response(
                credential=request.data,
                expected_challenge=challenge,
                expected_rp_id=RP_ID,
                expected_origin=ORIGIN,
            )
            WebAuthnCredential.objects.update_or_create(
                utilisateur=request.user,
                defaults={
                    'credential_id': credential.credential_id,
                    'public_key':    credential.credential_public_key,
                    'sign_count':    credential.sign_count,
                }
            )
            del request.session['webauthn_register_challenge']
            return Response({'message': 'Empreinte enregistrée avec succès !'}, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({'erreur': f'Erreur : {str(e)}'}, status=status.HTTP_400_BAD_REQUEST)


class WebAuthnVerifyBeginView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            cred = WebAuthnCredential.objects.get(utilisateur=request.user)
        except WebAuthnCredential.DoesNotExist:
            return Response({'erreur': 'Aucune empreinte enregistrée.'}, status=status.HTTP_404_NOT_FOUND)
        options = webauthn.generate_authentication_options(
            rp_id=RP_ID,
            user_verification=UserVerificationRequirement.REQUIRED,
        )
        request.session['webauthn_verify_challenge'] = base64.b64encode(options.challenge).decode()
        request.session['webauthn_credential_id']    = base64.b64encode(bytes(cred.credential_id)).decode()
        return Response(json.loads(webauthn.options_to_json(options)), status=status.HTTP_200_OK)


class WebAuthnVerifyCompleteView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        challenge_b64 = request.session.get('webauthn_verify_challenge')
        if not challenge_b64:
            return Response({'erreur': 'Challenge expiré.'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            cred      = WebAuthnCredential.objects.get(utilisateur=request.user)
            challenge = base64.b64decode(challenge_b64)
            verification = webauthn.verify_authentication_response(
                credential=request.data,
                expected_challenge=challenge,
                expected_rp_id=RP_ID,
                expected_origin=ORIGIN,
                credential_public_key=bytes(cred.public_key),
                credential_current_sign_count=cred.sign_count,
            )
            cred.sign_count = verification.new_sign_count
            cred.save()
            del request.session['webauthn_verify_challenge']
            del request.session['webauthn_credential_id']
            return Response({'identite_confirmee': True, 'message': 'Identité confirmée ✓'}, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({'identite_confirmee': False, 'erreur': f'Erreur : {str(e)}'}, status=status.HTTP_400_BAD_REQUEST)


class MotDePasseOublieView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        identifiant = request.data.get('identifiant', '').strip()
        if not identifiant:
            return Response({'erreur': 'Matricule ou email requis.'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            if '@' in identifiant:
                utilisateur = Utilisateur.objects.get(email=identifiant)
            else:
                utilisateur = Utilisateur.objects.get(matricule=identifiant)
        except Utilisateur.DoesNotExist:
            return Response({'erreur': 'Aucun compte trouvé.'}, status=status.HTTP_404_NOT_FOUND)
        OTPVerification.objects.filter(utilisateur=utilisateur, est_utilise=False).update(est_utilise=True)
        code = OTPVerification.generer_code()
        OTPVerification.objects.create(utilisateur=utilisateur, code=code)
        succes = envoyer_otp_email(email=utilisateur.email, prenom=utilisateur.prenom, code_otp=code)
        if succes:
            return Response({'message': f'Code envoyé à {utilisateur.email}', 'email': utilisateur.email}, status=status.HTTP_200_OK)
        return Response({'erreur': 'Erreur envoi email.'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class ReinitialisierMotDePasseView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        email            = request.data.get('email', '').strip()
        code             = request.data.get('code', '').strip()
        nouveau_mdp      = request.data.get('nouveau_mot_de_passe', '').strip()
        confirmation_mdp = request.data.get('confirmation_mot_de_passe', '').strip()
        if not all([email, code, nouveau_mdp, confirmation_mdp]):
            return Response({'erreur': 'Tous les champs sont requis.'}, status=status.HTTP_400_BAD_REQUEST)
        if nouveau_mdp != confirmation_mdp:
            return Response({'erreur': 'Les mots de passe ne correspondent pas.'}, status=status.HTTP_400_BAD_REQUEST)
        if len(nouveau_mdp) < 8:
            return Response({'erreur': 'Le mot de passe doit contenir au moins 8 caractères.'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            utilisateur = Utilisateur.objects.get(email=email)
        except Utilisateur.DoesNotExist:
            return Response({'erreur': 'Utilisateur non trouvé.'}, status=status.HTTP_404_NOT_FOUND)
        try:
            otp = OTPVerification.objects.filter(utilisateur=utilisateur, code=code, est_utilise=False).latest('date_creation')
        except OTPVerification.DoesNotExist:
            return Response({'erreur': 'Code OTP invalide.'}, status=status.HTTP_400_BAD_REQUEST)
        if not otp.est_valide():
            return Response({'erreur': 'Code OTP expiré.'}, status=status.HTTP_400_BAD_REQUEST)
        otp.est_utilise = True
        otp.save()
        utilisateur.set_password(nouveau_mdp)
        utilisateur.save()
        return Response({'message': 'Mot de passe réinitialisé avec succès !'}, status=status.HTTP_200_OK)


class PreInscriptionView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        import re, random, string
        from django.contrib.auth.hashers import make_password
        data = request.data

        pattern   = r'^CM-UDS-\d{2}IUT\d{4}$'
        matricule = data.get('matricule', '')
        if not re.match(pattern, matricule):
            return Response({'erreur': 'Format matricule invalide.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            autorise = EtudiantAutorise.objects.get(matricule=matricule)
        except EtudiantAutorise.DoesNotExist:
            return Response({'erreur': 'Ce matricule ne figure pas dans la liste des étudiants autorisés.'}, status=status.HTTP_400_BAD_REQUEST)

        if autorise.est_inscrit:
            return Response({'erreur': 'Ce matricule est déjà inscrit.'}, status=status.HTTP_400_BAD_REQUEST)

        if autorise.nom.lower() != data.get('nom', '').lower():
            return Response({'erreur': 'Le nom ne correspond pas.'}, status=status.HTTP_400_BAD_REQUEST)
        if autorise.prenom.lower() != data.get('prenom', '').lower():
            return Response({'erreur': 'Le prénom ne correspond pas.'}, status=status.HTTP_400_BAD_REQUEST)
        if autorise.filiere.lower() != data.get('filiere', '').lower():
            return Response({'erreur': 'La filière ne correspond pas.'}, status=status.HTTP_400_BAD_REQUEST)
        if autorise.niveau.lower() != data.get('niveau', '').lower():
            return Response({'erreur': 'Le niveau ne correspond pas.'}, status=status.HTTP_400_BAD_REQUEST)

        email = data.get('email', '')
        if Utilisateur.objects.filter(email=email).exists():
            return Response({'erreur': 'Cet email est déjà utilisé.'}, status=status.HTTP_400_BAD_REQUEST)

        if data.get('mot_de_passe') != data.get('mot_de_passe_confirm'):
            return Response({'erreur': 'Les mots de passe ne correspondent pas.'}, status=status.HTTP_400_BAD_REQUEST)
        if len(data.get('mot_de_passe', '')) < 8:
            return Response({'erreur': 'Le mot de passe doit contenir au moins 8 caractères.'}, status=status.HTTP_400_BAD_REQUEST)

        InscriptionTemporaire.objects.filter(email=email).delete()

        code = ''.join(random.choices(string.digits, k=6))
        InscriptionTemporaire.objects.create(
            email=email,
            matricule=data.get('matricule'),
            nom=data.get('nom'),
            prenom=data.get('prenom'),
            filiere=data.get('filiere'),
            niveau=data.get('niveau'),
            annee_academique=data.get('annee_academique', '2025-2026'),
            mot_de_passe=make_password(data.get('mot_de_passe')),
            code_otp=code,
            date_expiration=timezone.now() + timezone.timedelta(minutes=3),
        )

        succes = envoyer_otp_email(email=email, prenom=data.get('prenom'), code_otp=code)
        if succes:
            return Response({'message': f'Code OTP envoyé à {email}', 'email': email}, status=status.HTTP_200_OK)
        return Response({'erreur': 'Erreur envoi email.'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class FinaliserInscriptionView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get('email', '')
        code  = request.data.get('code', '')

        if not email or not code:
            return Response({'erreur': 'Email et code requis.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            inscription = InscriptionTemporaire.objects.get(email=email)
        except InscriptionTemporaire.DoesNotExist:
            return Response({'erreur': 'Aucune inscription en cours pour cet email.'}, status=status.HTTP_400_BAD_REQUEST)

        if not inscription.est_valide():
            inscription.delete()
            return Response({'erreur': 'Code OTP expiré. Recommencez l\'inscription.'}, status=status.HTTP_400_BAD_REQUEST)

        if code != inscription.code_otp:
            return Response({'erreur': 'Code OTP invalide.'}, status=status.HTTP_400_BAD_REQUEST)

        # Marquer OTP comme vérifié sans créer le compte
        inscription.otp_verifie = True
        inscription.save()

        return Response({
            'message': 'Code OTP vérifié. Enregistrez votre empreinte pour finaliser.',
            'email':   inscription.email,
        }, status=status.HTTP_200_OK)
class CompleterInscriptionView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        from .models import InscriptionTemporaire
        import json, base64 as b64
        email = request.data.get('email', '')
        credential_data = request.data.get('credential')

        if not email or not credential_data:
            return Response({'erreur': 'Email et empreinte requis.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            inscription = InscriptionTemporaire.objects.get(email=email)
        except InscriptionTemporaire.DoesNotExist:
            return Response({'erreur': 'Aucune inscription en cours.'}, status=status.HTTP_400_BAD_REQUEST)

        if not inscription.otp_verifie:
            return Response({'erreur': 'OTP non vérifié.'}, status=status.HTTP_400_BAD_REQUEST)

        # Challenge WebAuthn stocké en BD
        challenge_b64 = inscription.webauthn_challenge
        if not challenge_b64:
            return Response({'erreur': 'Challenge expiré. Recommencez l\'étape empreinte.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            # Créer le compte
            utilisateur = Utilisateur(
                matricule=inscription.matricule,
                email=inscription.email,
                nom=inscription.nom,
                prenom=inscription.prenom,
                role=Role.ETUDIANT,
                email_verifie=True,
            )
            utilisateur.password = inscription.mot_de_passe
            utilisateur.save()

            Etudiant.objects.create(
                utilisateur=utilisateur,
                filiere=inscription.filiere,
                niveau=inscription.niveau,
                annee_academique=inscription.annee_academique,
            )

            # Enregistrer l'empreinte WebAuthn
            challenge = b64.b64decode(challenge_b64)
            credential = webauthn.verify_registration_response(
                credential=credential_data,
                expected_challenge=challenge,
                expected_rp_id=RP_ID,
                expected_origin=ORIGIN,
            )
            WebAuthnCredential.objects.create(
                utilisateur=utilisateur,
                credential_id=credential.credential_id,
                public_key=credential.credential_public_key,
                sign_count=credential.sign_count,
            )

            # Tout est ok — marquer comme inscrit et nettoyer
            EtudiantAutorise.objects.filter(matricule=inscription.matricule).update(est_inscrit=True)
            inscription.delete()
            if 'webauthn_register_challenge' in request.session:
                del request.session['webauthn_register_challenge']

            return Response({'message': 'Inscription complète !'}, status=status.HTTP_201_CREATED)

        except Exception as e:
            # Si erreur, supprimer le compte créé pour ne pas laisser un compte sans empreinte
            try:
                Utilisateur.objects.filter(email=email).delete()
            except:
                pass
            return Response({'erreur': f'Erreur : {str(e)}'}, status=status.HTTP_400_BAD_REQUEST)


class WebAuthnRegisterBeginPublicView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        from .models import InscriptionTemporaire
        email = request.data.get('email', '')
        try:
            inscription = InscriptionTemporaire.objects.get(email=email, otp_verifie=True)
        except InscriptionTemporaire.DoesNotExist:
            return Response({'erreur': 'Inscription non trouvée ou OTP non vérifié.'}, status=status.HTTP_400_BAD_REQUEST)

        options = webauthn.generate_registration_options(
            rp_id=RP_ID,
            rp_name=RP_NAME,
            user_id=email.encode(),
            user_name=inscription.matricule,
            user_display_name=f"{inscription.prenom} {inscription.nom}",
            authenticator_selection=AuthenticatorSelectionCriteria(
                user_verification=UserVerificationRequirement.REQUIRED,
                resident_key=ResidentKeyRequirement.PREFERRED,
            ),
            supported_pub_key_algs=[
                COSEAlgorithmIdentifier.ECDSA_SHA_256,
                COSEAlgorithmIdentifier.RSASSA_PKCS1_v1_5_SHA_256,
            ],
        )
        # Stocker le challenge en BD (pas en session)
        challenge_b64 = base64.b64encode(options.challenge).decode()
        inscription.webauthn_challenge = challenge_b64
        inscription.save()
        # Convertir les options en dict et s'assurer que pubKeyCredParams est correct
        options_dict = json.loads(webauthn.options_to_json(options))
        return Response(options_dict, status=status.HTTP_200_OK)
