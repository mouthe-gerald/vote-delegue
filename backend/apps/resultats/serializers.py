from rest_framework import serializers
from .models        import Resultat, Rapport


class ResultatSerializer(serializers.ModelSerializer):
    candidat_nom    = serializers.SerializerMethodField()
    candidat_numero = serializers.SerializerMethodField()
    candidat_photo  = serializers.SerializerMethodField()

    class Meta:
        model  = Resultat
        fields = [
            'id', 'candidat_nom', 'candidat_numero',
            'candidat_photo', 'nb_voix',
            'pourcentage', 'est_elu', 'date_calcul'
        ]

    def get_candidat_nom(self, obj):
        u = obj.candidat.etudiant.utilisateur
        return f"{u.prenom} {u.nom}"

    def get_candidat_numero(self, obj):
        return obj.candidat.numero_candidat

    def get_candidat_photo(self, obj):
        if obj.candidat.photo_campagne:
            return obj.candidat.photo_campagne.url
        return None


class RapportSerializer(serializers.ModelSerializer):
    election_titre = serializers.SerializerMethodField()

    class Meta:
        model  = Rapport
        fields = [
            'id', 'election_titre', 'titre',
            'date_generation', 'nb_inscrits',
            'nb_votants', 'taux_participation', 'fichier_pdf'
        ]

    def get_election_titre(self, obj):
        return obj.election.titre