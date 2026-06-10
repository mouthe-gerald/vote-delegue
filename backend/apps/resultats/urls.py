from django.urls import path
from .views import (
    ResultatsElectionView,
    CalculerResultatsView,
    GenererRapportView,
)

urlpatterns = [
    path('<uuid:election_id>/',          ResultatsElectionView.as_view(),  name='resultats'),
    path('<uuid:election_id>/calculer/', CalculerResultatsView.as_view(),  name='resultats-calculer'),
    path('<uuid:election_id>/rapport/',  GenererRapportView.as_view(),     name='rapport-generer'),
]