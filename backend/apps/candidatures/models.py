import uuid
from django.db import models
from apps.authentication.models import Etudiant
from apps.elections.models import Election


class StatutCandidature(models.TextChoices):
    EN_ATTENTE       = 'EN_ATTENTE',       'En attente'
    VALIDEE          = 'VALIDEE',          'Validée'
    REJETEE          = 'REJETEE',          'Rejetée'
    RETRAIT_DEMANDE  = 'RETRAIT_DEMANDE',  'Retrait demandé'
    RETIREE          = 'RETIREE',          'Retirée'


class Candidature(models.Model):
    id               = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    etudiant         = models.ForeignKey(Etudiant, on_delete=models.CASCADE,
                                         related_name='candidatures')
    election         = models.ForeignKey(Election, on_delete=models.CASCADE,
                                         related_name='candidatures')
    programme        = models.TextField()
    photo_campagne   = models.ImageField(upload_to='campagnes/', null=True, blank=True)
    numero_candidat  = models.PositiveIntegerField(null=True, blank=True)
    statut           = models.CharField(max_length=30, choices=StatutCandidature.choices,
                                        default=StatutCandidature.EN_ATTENTE)
    motif_rejet      = models.TextField(null=True, blank=True)
    motif_retrait    = models.TextField(null=True, blank=True)
    date_soumission  = models.DateTimeField(auto_now_add=True)
    date_traitement  = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table        = 'candidatures'
        verbose_name    = 'Candidature'
        unique_together = ('etudiant', 'election')
        ordering        = ['numero_candidat']

    def __str__(self):
        return (f"Candidature de {self.etudiant.utilisateur.prenom} "
                f"{self.etudiant.utilisateur.nom} — {self.election.titre}")

    def est_validee(self):
        return self.statut == StatutCandidature.VALIDEE
