from rest_framework import serializers
from .models        import Vote, TransactionVote


class VoteSerializer(serializers.ModelSerializer):
    electeur_nom  = serializers.SerializerMethodField()
    candidat_nom  = serializers.SerializerMethodField()
    election_titre = serializers.SerializerMethodField()

    class Meta:
        model  = Vote
        fields = [
            'id', 'electeur_nom', 'candidat_nom',
            'election_titre', 'timestamp',
            'transaction_hash', 'est_confirme'
        ]

    def get_electeur_nom(self, obj):
        u = obj.electeur.utilisateur
        return f"{u.prenom} {u.nom}"

    def get_candidat_nom(self, obj):
        u = obj.candidat.etudiant.utilisateur
        return f"{u.prenom} {u.nom}"

    def get_election_titre(self, obj):
        return obj.election.titre


class CasterVoteSerializer(serializers.Serializer):
    candidat_id = serializers.UUIDField()
    election_id = serializers.UUIDField()


class TransactionVoteSerializer(serializers.ModelSerializer):
    class Meta:
        model  = TransactionVote
        fields = [
            'id', 'transaction_hash', 'etudiant_hash',
            'timestamp', 'bloc_numero', 'est_valide'
        ]