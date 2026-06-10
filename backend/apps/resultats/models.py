import uuid
from django.db import models
from apps.elections.models import Election
from apps.candidatures.models import Candidature
from apps.authentication.models import Administrateur


class Resultat(models.Model):
    id           = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    election     = models.ForeignKey(Election, on_delete=models.CASCADE,
                                     related_name='resultats')
    candidat     = models.ForeignKey(Candidature, on_delete=models.CASCADE,
                                     related_name='resultat')
    nb_voix      = models.PositiveIntegerField(default=0)
    pourcentage  = models.FloatField(default=0.0)
    est_elu      = models.BooleanField(default=False)
    date_calcul  = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table        = 'resultats'
        verbose_name    = 'Résultat'
        unique_together = ('election', 'candidat')
        ordering        = ['-nb_voix']

    def __str__(self):
        return (f"Résultat — {self.candidat.etudiant.utilisateur.prenom} "
                f"{self.candidat.etudiant.utilisateur.nom} : {self.nb_voix} voix")


class Rapport(models.Model):
    id                  = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    election            = models.OneToOneField(Election, on_delete=models.CASCADE,
                                               related_name='rapport')
    generateur          = models.ForeignKey(Administrateur, on_delete=models.PROTECT,
                                            related_name='rapports')
    titre               = models.CharField(max_length=255)
    date_generation     = models.DateTimeField(auto_now_add=True)
    contenu             = models.TextField(blank=True)
    fichier_pdf         = models.FileField(upload_to='rapports/', null=True, blank=True)
    nb_inscrits         = models.PositiveIntegerField(default=0)
    nb_votants          = models.PositiveIntegerField(default=0)
    taux_participation  = models.FloatField(default=0.0)

    class Meta:
        db_table     = 'rapports'
        verbose_name = 'Rapport'

    def __str__(self):
        return f"Rapport — {self.election.titre}"
