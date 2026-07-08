import uuid
from django.db import models
from apps.authentication.models import Etudiant
from apps.candidatures.models import Candidature
from apps.elections.models import Election


class Vote(models.Model):
    id                 = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    electeur           = models.OneToOneField(Etudiant, on_delete=models.PROTECT,
                                              related_name='vote')
    candidat           = models.ForeignKey(Candidature, on_delete=models.PROTECT, null=True, blank=True,
                                           related_name='votes_recus')
    election           = models.ForeignKey(Election, on_delete=models.PROTECT,
                                           related_name='votes')
    timestamp          = models.DateTimeField(auto_now_add=True)
    transaction_hash   = models.CharField(max_length=255, unique=True)
    adresse_blockchain = models.CharField(max_length=255, null=True, blank=True)
    est_confirme       = models.BooleanField(default=False)

    class Meta:
        db_table     = 'votes'
        verbose_name = 'Vote'

    def __str__(self):
        return (f"Vote de {self.electeur.utilisateur.prenom} "
                f"{self.electeur.utilisateur.nom} — {self.election.titre}")


class TransactionVote(models.Model):
    id                = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    vote              = models.OneToOneField(Vote, on_delete=models.PROTECT,
                                             related_name='transaction')
    transaction_hash  = models.CharField(max_length=255, unique=True)
    etudiant_hash     = models.CharField(max_length=255)
    candidat          = models.ForeignKey(Candidature, on_delete=models.PROTECT,
                                          related_name='transactions')
    timestamp         = models.DateTimeField(auto_now_add=True)
    bloc_numero       = models.PositiveIntegerField(null=True, blank=True)
    est_valide        = models.BooleanField(default=True)

    class Meta:
        db_table     = 'transactions_votes'
        verbose_name = 'Transaction Vote'

    def __str__(self):
        return f"Transaction {self.transaction_hash[:20]}..."
