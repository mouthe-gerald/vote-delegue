from django.urls import path
from .views import (
    InscriptionView,
    ConnexionView,
    EncodageVisageView,
    VerificationVisageView,
    ProfilView,
    DeconnexionView,
)

urlpatterns = [
    path('inscription/',        InscriptionView.as_view(),        name='inscription'),
    path('connexion/',          ConnexionView.as_view(),           name='connexion'),
    path('deconnexion/',        DeconnexionView.as_view(),         name='deconnexion'),
    path('face/encoder/',       EncodageVisageView.as_view(),      name='face-encoder'),
    path('face/verifier/',      VerificationVisageView.as_view(),  name='face-verifier'),
    path('profil/',             ProfilView.as_view(),              name='profil'),
]

from django.urls import path
from .views import (
    InscriptionView,
    ConnexionView,
    EncodageVisageView,
    VerificationVisageView,
    ProfilView,
    DeconnexionView,
    EnvoyerOTPView,
    VerifierOTPView,
)

urlpatterns = [
    path('inscription/',        InscriptionView.as_view(),        name='inscription'),
    path('connexion/',          ConnexionView.as_view(),           name='connexion'),
    path('deconnexion/',        DeconnexionView.as_view(),         name='deconnexion'),
    path('face/encoder/',       EncodageVisageView.as_view(),      name='face-encoder'),
    path('face/verifier/',      VerificationVisageView.as_view(),  name='face-verifier'),
    path('profil/',             ProfilView.as_view(),              name='profil'),
    path('otp/envoyer/',        EnvoyerOTPView.as_view(),          name='otp-envoyer'),
    path('otp/verifier/',       VerifierOTPView.as_view(),         name='otp-verifier'),
]