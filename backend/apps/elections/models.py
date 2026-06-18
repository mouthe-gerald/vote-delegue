import uuid
from django.db import models
from apps.authentication.models import Administrateur

class StatutElection(models.TextChoices):
    PLANIFIEE         = 'PLANIFIEE',         'Planifiée'
    EN_COURS          = 'EN_COURS',          'En cours'
    CLOTUREE          = 'CLOTUREE',          'Clôturée'
    RESULTATS_PUBLIES = 'RESULTATS_PUBLIES', 'Résultats publiés'
    ANNULEE           = 'ANNULEE',           'Annulée'

class Election(models.Model):
    id               = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    titre            = models.CharField(max_length=255)
    description      = models.TextField(blank=True)
    date_debut       = models.DateTimeField()
    date_fin         = models.DateTimeField()
    annee_academique = models.CharField(max_length=20)
    statut           = models.CharField(max_length=30, choices=StatutElection.choices,
                                        default=StatutElection.PLANIFIEE)
    motif_annulation = models.TextField(null=True, blank=True)
    contract_address = models.CharField(max_length=255, null=True, blank=True)
    createur         = models.ForeignKey(Administrateur, on_delete=models.PROTECT,
                                         related_name='elections_creees')
    date_creation    = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table     = 'elections'
        verbose_name = 'Élection'
        ordering     = ['-date_creation']

    def __str__(self):
        return f"{self.titre} ({self.statut})"

    def est_ouverte(self):
        return self.statut == StatutElection.EN_COURS

    def est_cloturee(self):
        return self.statut in [
            StatutElection.CLOTUREE,
            StatutElection.RESULTATS_PUBLIES,
            StatutElection.ANNULEE,
        ]
