from rest_framework import serializers
from .models        import Candidature, StatutCandidature
from apps.authentication.serializers import UtilisateurSerializer


class CandidatureSerializer(serializers.ModelSerializer):
    etudiant_nom    = serializers.SerializerMethodField()
    etudiant_filiere = serializers.SerializerMethodField()

    class Meta:
        model  = Candidature
        fields = [
            'id', 'etudiant_nom', 'etudiant_filiere',
            'election', 'programme', 'photo_campagne',
            'numero_candidat', 'statut', 'motif_rejet',
            'motif_retrait', 'date_soumission', 'date_traitement'
        ]
        read_only_fields = [
            'statut', 'numero_candidat', 'date_soumission', 'date_traitement'
        ]

    def get_etudiant_nom(self, obj):
        u = obj.etudiant.utilisateur
        return f"{u.prenom} {u.nom}"

    def get_etudiant_filiere(self, obj):
        return obj.etudiant.filiere


class SoumettreCandidatureSerializer(serializers.ModelSerializer):
    class Meta:
        model  = Candidature
        fields = ['election', 'programme', 'photo_campagne']


class RetraitCandidatureSerializer(serializers.Serializer):
    motif_retrait = serializers.CharField()


class RejeterCandidatureSerializer(serializers.Serializer):
    motif_rejet = serializers.CharField()