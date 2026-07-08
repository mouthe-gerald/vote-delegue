from rest_framework             import status
from rest_framework.views       import APIView
from rest_framework.response    import Response
from rest_framework.permissions import IsAuthenticated
from django.shortcuts           import get_object_or_404
from django.utils               import timezone

from apps.authentication.models import Etudiant, Role
from apps.elections.models      import Election, StatutElection
from .models                    import Candidature, StatutCandidature
from .serializers               import (
    CandidatureSerializer,
    SoumettreCandidatureSerializer,
    RetraitCandidatureSerializer,
    RejeterCandidatureSerializer,
)


class CandidatureListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        election_id = request.query_params.get('election_id')
        candidatures = Candidature.objects.filter(
            statut=StatutCandidature.VALIDEE
        )
        if election_id:
            candidatures = candidatures.filter(election_id=election_id)
        serializer = CandidatureSerializer(candidatures, many=True, context={'request': request})
        return Response(serializer.data, status=status.HTTP_200_OK)


class SoumettreCandidatureView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        if not hasattr(request.user, 'profil_etudiant'):
            return Response(
                {'erreur': 'Seuls les étudiants peuvent déposer une candidature.'},
                status=status.HTTP_403_FORBIDDEN
            )
        etudiant   = request.user.profil_etudiant
        serializer = SoumettreCandidatureSerializer(data=request.data)
        if serializer.is_valid():
            election = serializer.validated_data['election']
            # Vérifier qu'il n'est pas déjà candidat
            if Candidature.objects.filter(
                etudiant=etudiant, election=election
            ).exists():
                return Response(
                    {'erreur': 'Vous avez déjà soumis une candidature pour cette élection.'},
                    status=status.HTTP_409_CONFLICT
                )
            candidature = serializer.save(etudiant=etudiant)
            return Response(
                CandidatureSerializer(candidature, context={'request': request}).data,
                status=status.HTTP_201_CREATED
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ValiderCandidatureView(APIView):
    permission_classes = [IsAuthenticated]

    def put(self, request, pk):
        if request.user.role != Role.ADMINISTRATEUR:
            return Response(
                {'erreur': 'Accès réservé aux administrateurs.'},
                status=status.HTTP_403_FORBIDDEN
            )
        candidature = get_object_or_404(Candidature, pk=pk)
        if candidature.statut != StatutCandidature.EN_ATTENTE:
            return Response(
                {'erreur': 'Seules les candidatures EN_ATTENTE peuvent être validées.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        # Attribuer un numéro de candidat
        nb = Candidature.objects.filter(
            election=candidature.election,
            statut=StatutCandidature.VALIDEE
        ).count()
        candidature.statut          = StatutCandidature.VALIDEE
        candidature.numero_candidat = nb + 1
        candidature.date_traitement = timezone.now()
        candidature.save()
        # Mettre à jour le rôle de l'étudiant en CANDIDAT
        etudiant_user = candidature.etudiant.utilisateur
        etudiant_user.role = 'CANDIDAT'
        etudiant_user.save()
        return Response(
            {'message': 'Candidature validée avec succès.',
             'numero_candidat': candidature.numero_candidat},
            status=status.HTTP_200_OK
        )


class RejeterCandidatureView(APIView):
    permission_classes = [IsAuthenticated]

    def put(self, request, pk):
        if request.user.role != Role.ADMINISTRATEUR:
            return Response(
                {'erreur': 'Accès réservé aux administrateurs.'},
                status=status.HTTP_403_FORBIDDEN
            )
        candidature = get_object_or_404(Candidature, pk=pk)
        serializer  = RejeterCandidatureSerializer(data=request.data)
        if serializer.is_valid():
            candidature.statut          = StatutCandidature.REJETEE
            candidature.motif_rejet     = serializer.validated_data['motif_rejet']
            candidature.date_traitement = timezone.now()
            candidature.save()
            return Response(
                {'message': 'Candidature rejetée.'},
                status=status.HTTP_200_OK
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class DemanderRetraitView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        candidature = get_object_or_404(Candidature, pk=pk)
        if candidature.etudiant.utilisateur != request.user:
            return Response(
                {'erreur': 'Vous ne pouvez retirer que votre propre candidature.'},
                status=status.HTTP_403_FORBIDDEN
            )
        serializer = RetraitCandidatureSerializer(data=request.data)
        if serializer.is_valid():
            candidature.statut        = StatutCandidature.RETRAIT_DEMANDE
            candidature.motif_retrait = serializer.validated_data['motif_retrait']
            candidature.save()
            return Response(
                {'message': 'Demande de retrait envoyée. En attente d\'approbation.'},
                status=status.HTTP_200_OK
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ApprouverRetraitView(APIView):
    permission_classes = [IsAuthenticated]

    def put(self, request, pk):
        if request.user.role != Role.ADMINISTRATEUR:
            return Response(
                {'erreur': 'Accès réservé aux administrateurs.'},
                status=status.HTTP_403_FORBIDDEN
            )
        candidature = get_object_or_404(Candidature, pk=pk)
        if candidature.statut != StatutCandidature.RETRAIT_DEMANDE:
            return Response(
                {'erreur': 'Aucune demande de retrait en attente.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        candidature.statut          = StatutCandidature.RETIREE
        candidature.date_traitement = timezone.now()
        candidature.save()
        return Response(
            {'message': 'Retrait de candidature approuvé.'},
            status=status.HTTP_200_OK
        )


class RefuserRetraitView(APIView):
    permission_classes = [IsAuthenticated]

    def put(self, request, pk):
        if request.user.role != Role.ADMINISTRATEUR:
            return Response(
                {'erreur': 'Accès réservé aux administrateurs.'},
                status=status.HTTP_403_FORBIDDEN
            )
        candidature = get_object_or_404(Candidature, pk=pk)
        if candidature.statut != StatutCandidature.RETRAIT_DEMANDE:
            return Response(
                {'erreur': 'Aucune demande de retrait en attente.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        candidature.statut          = StatutCandidature.VALIDEE
        candidature.date_traitement = timezone.now()
        candidature.save()
        return Response(
            {'message': 'Demande de retrait refusée. Candidature maintenue.'},
            status=status.HTTP_200_OK
        )


class CandidaturesEnAttenteView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if request.user.role != Role.ADMINISTRATEUR:
            return Response(
                {'erreur': 'Accès réservé aux administrateurs.'},
                status=status.HTTP_403_FORBIDDEN
            )
        candidatures = Candidature.objects.filter(
            statut=StatutCandidature.EN_ATTENTE
        )
        serializer = CandidatureSerializer(candidatures, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)