from django.urls import path
from .views import (
    CandidatureListView,
    SoumettreCandidatureView,
    ValiderCandidatureView,
    RejeterCandidatureView,
    DemanderRetraitView,
    ApprouverRetraitView,
    RefuserRetraitView,
    CandidaturesEnAttenteView,
)

urlpatterns = [
    path('',                              CandidatureListView.as_view(),       name='candidature-list'),
    path('soumettre/',                    SoumettreCandidatureView.as_view(),  name='candidature-soumettre'),
    path('en-attente/',                   CandidaturesEnAttenteView.as_view(), name='candidature-en-attente'),
    path('<uuid:pk>/valider/',            ValiderCandidatureView.as_view(),    name='candidature-valider'),
    path('<uuid:pk>/rejeter/',            RejeterCandidatureView.as_view(),    name='candidature-rejeter'),
    path('<uuid:pk>/retrait-demande/',    DemanderRetraitView.as_view(),       name='candidature-retrait-demande'),
    path('<uuid:pk>/retrait-approuver/',  ApprouverRetraitView.as_view(),      name='candidature-retrait-approuver'),
    path('<uuid:pk>/retrait-refuser/',    RefuserRetraitView.as_view(),        name='candidature-retrait-refuser'),
]