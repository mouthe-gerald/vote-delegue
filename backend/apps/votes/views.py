import hashlib
from rest_framework             import status
from rest_framework.views       import APIView
from rest_framework.response    import Response
from rest_framework.permissions import IsAuthenticated
from django.shortcuts           import get_object_or_404
from django.conf                import settings

from apps.authentication.models import Etudiant, Role
from apps.elections.models      import Election, StatutElection
from apps.candidatures.models   import Candidature, StatutCandidature
from .models                    import Vote, TransactionVote
from .serializers               import (
    VoteSerializer,
    CasterVoteSerializer,
    TransactionVoteSerializer,
)


class VerifierDroitVoteView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, election_id):
        if not hasattr(request.user, 'profil_etudiant'):
            return Response(
                {'erreur': 'Seuls les étudiants peuvent voter.'},
                status=status.HTTP_403_FORBIDDEN
            )
        etudiant = request.user.profil_etudiant
        election = get_object_or_404(Election, pk=election_id)

        # Vérifier que l'élection est ouverte
        if not election.est_ouverte():
            return Response({
                'peut_voter': False,
                'raison':     f'Élection {election.statut}.',
            }, status=status.HTTP_200_OK)

        # Vérifier que l'étudiant n'a pas déjà voté
        if Vote.objects.filter(
            electeur=etudiant, election=election
        ).exists():
            return Response({
                'peut_voter': False,
                'raison':     'Vous avez déjà voté pour cette élection.',
            }, status=status.HTTP_200_OK)

        # Vérifier que l'empreinte WebAuthn est enregistrée
        from apps.authentication.models import WebAuthnCredential
        if not WebAuthnCredential.objects.filter(utilisateur=etudiant.utilisateur).exists():
            return Response({
                'peut_voter': False,
                'raison':     'Aucune empreinte enregistrée. Impossible de voter.',
            }, status=status.HTTP_200_OK)

        return Response({
            'peut_voter': True,
            'raison':     'Vous pouvez voter.',
        }, status=status.HTTP_200_OK)


class CasterVoteView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        if not hasattr(request.user, 'profil_etudiant'):
            return Response(
                {'erreur': 'Seuls les étudiants peuvent voter.'},
                status=status.HTTP_403_FORBIDDEN
            )

        etudiant   = request.user.profil_etudiant
        serializer = CasterVoteSerializer(data=request.data)

        if not serializer.is_valid():
            return Response(serializer.errors,
                            status=status.HTTP_400_BAD_REQUEST)

        election_id = serializer.validated_data['election_id']
        candidat_id = serializer.validated_data['candidat_id']

        election   = get_object_or_404(Election,    pk=election_id)
        candidature = get_object_or_404(Candidature, pk=candidat_id)

        # Vérifications
        if not election.est_ouverte():
            return Response(
                {'erreur': 'L\'élection n\'est pas ouverte.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if candidature.election != election:
            return Response(
                {'erreur': 'Ce candidat ne participe pas à cette élection.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if candidature and candidature.statut != StatutCandidature.VALIDEE:
            return Response(
                {'erreur': 'Ce candidat n\'est pas validé.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if Vote.objects.filter(
            electeur=etudiant, election=election
        ).exists():
            return Response(
                {'erreur': 'Vous avez déjà voté pour cette élection.'},
                status=status.HTTP_409_CONFLICT
            )

        # Générer un hash unique pour le vote
        cand_id = candidature.id if candidature else "NUL"
        hash_data        = f"{etudiant.utilisateur.id}{election.id}{cand_id}"
        transaction_hash = hashlib.sha256(hash_data.encode()).hexdigest()
        etudiant_hash    = hashlib.sha256(
            str(etudiant.utilisateur.id).encode()
        ).hexdigest()

        # Enregistrer le vote
        vote = Vote.objects.create(
            electeur           = etudiant,
            candidat           = candidature,
            election           = election,
            transaction_hash   = transaction_hash,
            adresse_blockchain = election.contract_address,
            est_confirme       = True,
        )

        # Enregistrer la transaction
        TransactionVote.objects.create(
            vote             = vote,
            transaction_hash = transaction_hash,
            etudiant_hash    = etudiant_hash,
            candidat         = candidature,
        )

        # Marquer l'étudiant comme ayant voté
        etudiant.a_vote       = True
        etudiant.vote_tx_hash = transaction_hash
        etudiant.save()

        return Response({
            'message':          'Vote enregistré avec succès !',
            'transaction_hash': transaction_hash,
            'timestamp':        vote.timestamp,
        }, status=status.HTTP_201_CREATED)


class JournalBlockchainView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, election_id):
        if request.user.role != Role.ADMINISTRATEUR:
            return Response(
                {'erreur': 'Accès réservé aux administrateurs.'},
                status=status.HTTP_403_FORBIDDEN
            )
        transactions = TransactionVote.objects.filter(
            candidat__election_id=election_id
        )
        serializer = TransactionVoteSerializer(transactions, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)