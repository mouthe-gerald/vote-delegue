from django.db.models.signals import post_save
from django.dispatch import receiver
from apps.authentication.models import Utilisateur
from apps.candidatures.models import Candidature
from apps.votes.models import Vote
from .models import Notification

@receiver(post_save, sender=Utilisateur)
def notif_inscription(sender, instance, created, **kwargs):
    if created and instance.role == 'ETUDIANT':
        Notification.objects.create(
            type='INSCRIPTION',
            message=f"Nouvel étudiant inscrit : {instance.prenom} {instance.nom} ({instance.matricule})"
        )

@receiver(post_save, sender=Candidature)
def notif_candidature(sender, instance, created, **kwargs):
    if created:
        Notification.objects.create(
            type='CANDIDATURE',
            message=f"Nouvelle candidature déposée par {instance.candidat.prenom} {instance.candidat.nom}"
        )

@receiver(post_save, sender=Vote)
def notif_vote(sender, instance, created, **kwargs):
    if created:
        Notification.objects.create(
            type='VOTE',
            message=f"Nouveau vote enregistré dans l'élection {instance.election.titre}"
        )
