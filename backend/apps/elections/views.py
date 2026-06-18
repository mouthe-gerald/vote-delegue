from rest_framework             import status
from rest_framework.views       import APIView
from rest_framework.response    import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.shortcuts           import get_object_or_404

from apps.authentication.models import Administrateur, Role
from .models                    import Election, StatutElection
from .serializers               import ElectionSerializer, CreerElectionSerializer


class IsAdmin(IsAuthenticated):
    def has_permission(self, request, view):
        return (super().has_permission(request, view)
                and request.user.role == Role.ADMINISTRATEUR)


class ElectionListView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        elections  = Election.objects.all()
        serializer = ElectionSerializer(elections, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class ElectionCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        if request.user.role != Role.ADMINISTRATEUR:
            return Response(
                {'erreur': 'Accès réservé aux administrateurs.'},
                status=status.HTTP_403_FORBIDDEN
            )
        serializer = CreerElectionSerializer(data=request.data)
        if serializer.is_valid():
            admin    = get_object_or_404(Administrateur,
                                         utilisateur=request.user)
            election = serializer.save(createur=admin)
            return Response(
                ElectionSerializer(election).data,
                status=status.HTTP_201_CREATED
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ElectionDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        election   = get_object_or_404(Election, pk=pk)
        serializer = ElectionSerializer(election)
        return Response(serializer.data, status=status.HTTP_200_OK)


class ElectionOuvrirView(APIView):
    permission_classes = [IsAuthenticated]

    def put(self, request, pk):
        if request.user.role != Role.ADMINISTRATEUR:
            return Response(
                {'erreur': 'Accès réservé aux administrateurs.'},
                status=status.HTTP_403_FORBIDDEN
            )
        election = get_object_or_404(Election, pk=pk)
        if election.statut != StatutElection.PLANIFIEE:
            return Response(
                {'erreur': 'L\'élection doit être en statut PLANIFIEE pour être ouverte.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        election.statut = StatutElection.EN_COURS
        election.save()
        return Response(
            {'message': 'Élection ouverte avec succès.',
             'statut':  election.statut},
            status=status.HTTP_200_OK
        )


class ElectionCloturerView(APIView):
    permission_classes = [IsAuthenticated]

    def put(self, request, pk):
        if request.user.role != Role.ADMINISTRATEUR:
            return Response(
                {'erreur': 'Accès réservé aux administrateurs.'},
                status=status.HTTP_403_FORBIDDEN
            )
        election = get_object_or_404(Election, pk=pk)
        if election.statut != StatutElection.EN_COURS:
            return Response(
                {'erreur': 'L\'élection doit être EN_COURS pour être clôturée.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        election.statut = StatutElection.CLOTUREE
        election.save()
        return Response(
            {'message': 'Élection clôturée avec succès.',
             'statut':  election.statut},
            status=status.HTTP_200_OK
        )


class ElectionPublierResultatsView(APIView):
    permission_classes = [IsAuthenticated]

    def put(self, request, pk):
        if request.user.role != Role.ADMINISTRATEUR:
            return Response(
                {'erreur': 'Accès réservé aux administrateurs.'},
                status=status.HTTP_403_FORBIDDEN
            )
        election = get_object_or_404(Election, pk=pk)
        if election.statut != StatutElection.CLOTUREE:
            return Response(
                {'erreur': 'L\'élection doit être CLOTUREE pour publier les résultats.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        election.statut = StatutElection.RESULTATS_PUBLIES
        election.save()
        return Response(
            {'message': 'Résultats publiés avec succès.',
             'statut':  election.statut},
            status=status.HTTP_200_OK
        )


class ElectionStatutView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        election = get_object_or_404(Election, pk=pk)
        return Response({
            'id':          str(election.id),
            'titre':       election.titre,
            'statut':      election.statut,
            'est_ouverte': election.est_ouverte(),
            'date_debut':  election.date_debut,
            'date_fin':    election.date_fin,
        }, status=status.HTTP_200_OK)

class ElectionAnnulerView(APIView):
    permission_classes = [IsAuthenticated]

    def put(self, request, election_id):
        if request.user.role != 'ADMINISTRATEUR':
            return Response({'erreur': 'Accès refusé.'}, status=status.HTTP_403_FORBIDDEN)
        election = get_object_or_404(Election, pk=election_id)
        if election.statut == 'ANNULEE':
            return Response({'erreur': 'Cette élection est déjà annulée.'}, status=status.HTTP_400_BAD_REQUEST)
        if election.statut == 'RESULTATS_PUBLIES':
            return Response({'erreur': 'Impossible d\'annuler une élection dont les résultats sont publiés.'}, status=status.HTTP_400_BAD_REQUEST)
        motif = request.data.get('motif_annulation', '').strip()
        if not motif:
            return Response({'erreur': 'Un motif d\'annulation est obligatoire.'}, status=status.HTTP_400_BAD_REQUEST)
        election.statut           = 'ANNULEE'
        election.motif_annulation = motif
        election.save()
        return Response({
            'message':          'Élection annulée avec succès.',
            'motif_annulation': motif,
        }, status=status.HTTP_200_OK)
