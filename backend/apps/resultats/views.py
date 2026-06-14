from rest_framework             import status
from rest_framework.views       import APIView
from rest_framework.response    import Response
from rest_framework.permissions import IsAuthenticated
from django.shortcuts           import get_object_or_404

from apps.authentication.models import Administrateur, Etudiant, Role
from apps.elections.models      import Election, StatutElection
from apps.candidatures.models   import Candidature, StatutCandidature
from apps.votes.models          import Vote
from .models                    import Resultat, Rapport
from .serializers               import ResultatSerializer, RapportSerializer


class ResultatsElectionView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, election_id):
        election = get_object_or_404(Election, pk=election_id)

        if election.statut != StatutElection.RESULTATS_PUBLIES:
            return Response(
                {'erreur': 'Les résultats ne sont pas encore publiés.'},
                status=status.HTTP_403_FORBIDDEN
            )

        resultats = Resultat.objects.filter(
            election=election
        ).order_by('-nb_voix')

        serializer = ResultatSerializer(resultats, many=True, context={'request': request})
        return Response({
            'election':         str(election.id),
            'titre':            election.titre,
            'total_votants':    Vote.objects.filter(election=election).count(),
            'resultats':        serializer.data,
        }, status=status.HTTP_200_OK)


class CalculerResultatsView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, election_id):
        if request.user.role != Role.ADMINISTRATEUR:
            return Response(
                {'erreur': 'Accès réservé aux administrateurs.'},
                status=status.HTTP_403_FORBIDDEN
            )

        election = get_object_or_404(Election, pk=election_id)

        if election.statut not in [
            StatutElection.CLOTUREE,
            StatutElection.RESULTATS_PUBLIES
        ]:
            return Response(
                {'erreur': 'L\'élection doit être clôturée pour calculer les résultats.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Supprimer les anciens résultats
        Resultat.objects.filter(election=election).delete()

        # Récupérer tous les candidats validés
        candidatures = Candidature.objects.filter(
            election=election,
            statut=StatutCandidature.VALIDEE
        )

        total_votes = Vote.objects.filter(election=election).count()
        resultats   = []

        for candidature in candidatures:
            nb_voix = Vote.objects.filter(
                election=election,
                candidat=candidature
            ).count()

            pourcentage = round(
                (nb_voix / total_votes * 100) if total_votes > 0 else 0,
                2
            )

            resultat = Resultat.objects.create(
                election    = election,
                candidat    = candidature,
                nb_voix     = nb_voix,
                pourcentage = pourcentage,
                est_elu     = False,
            )
            resultats.append(resultat)

        # Déterminer l'élu (celui avec le plus de voix)
        if resultats:
            elu = max(resultats, key=lambda r: r.nb_voix)
            elu.est_elu = True
            elu.save()

        serializer = ResultatSerializer(
            Resultat.objects.filter(election=election).order_by('-nb_voix'),
            many=True, context={'request': request}
        )

        return Response({
            'message':       'Résultats calculés avec succès.',
            'total_votants': total_votes,
            'resultats':     serializer.data,
        }, status=status.HTTP_200_OK)


class GenererRapportView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, election_id):
        if request.user.role != Role.ADMINISTRATEUR:
            return Response(
                {'erreur': 'Accès réservé aux administrateurs.'},
                status=status.HTTP_403_FORBIDDEN
            )

        election = get_object_or_404(Election, pk=election_id)
        admin    = get_object_or_404(Administrateur, utilisateur=request.user)

        nb_inscrits  = Etudiant.objects.count()
        nb_votants   = Vote.objects.filter(election=election).count()
        taux         = round(
            (nb_votants / nb_inscrits * 100) if nb_inscrits > 0 else 0,
            2
        )

        rapport, _ = Rapport.objects.update_or_create(
            election=election,
            defaults={
                'generateur':         admin,
                'titre':              f"Rapport — {election.titre}",
                'nb_inscrits':        nb_inscrits,
                'nb_votants':         nb_votants,
                'taux_participation': taux,
            }
        )

        serializer = RapportSerializer(rapport)
        return Response({
            'message': 'Rapport généré avec succès.',
            'rapport': serializer.data,
        }, status=status.HTTP_201_CREATED)