from django.urls import path
from .views import (
    VerifierDroitVoteView,
    CasterVoteView,
    JournalBlockchainView,
)

urlpatterns = [
    path('verifier/<uuid:election_id>/', VerifierDroitVoteView.as_view(), name='vote-verifier'),
    path('caster/',                      CasterVoteView.as_view(),         name='vote-caster'),
    path('journal/<uuid:election_id>/',  JournalBlockchainView.as_view(),  name='vote-journal'),
]