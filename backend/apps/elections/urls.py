from django.urls import path
from .views import (
    ElectionListView,
    ElectionCreateView,
    ElectionDetailView,
    ElectionOuvrirView,
    ElectionCloturerView,
    ElectionPublierResultatsView,
    ElectionStatutView,
)

urlpatterns = [
    path('',                    ElectionListView.as_view(),             name='election-list'),
    path('create/',             ElectionCreateView.as_view(),           name='election-create'),
    path('<uuid:pk>/',          ElectionDetailView.as_view(),           name='election-detail'),
    path('<uuid:pk>/ouvrir/',   ElectionOuvrirView.as_view(),           name='election-ouvrir'),
    path('<uuid:pk>/cloturer/', ElectionCloturerView.as_view(),         name='election-cloturer'),
    path('<uuid:pk>/publier/',  ElectionPublierResultatsView.as_view(), name='election-publier'),
    path('<uuid:pk>/statut/',   ElectionStatutView.as_view(),           name='election-statut'),
]