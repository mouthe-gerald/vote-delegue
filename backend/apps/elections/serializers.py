from rest_framework import serializers
from .models import Election, StatutElection


class ElectionSerializer(serializers.ModelSerializer):
    createur_nom = serializers.SerializerMethodField()
    est_ouverte  = serializers.SerializerMethodField()

    class Meta:
        model  = Election
        fields = [
            'id', 'titre', 'description', 'date_debut',
            'date_fin', 'annee_academique', 'statut',
            'contract_address', 'createur_nom',
            'est_ouverte', 'date_creation'
        ]
        read_only_fields = ['statut', 'contract_address', 'date_creation']

    def get_createur_nom(self, obj):
        u = obj.createur.utilisateur
        return f"{u.prenom} {u.nom}"

    def get_est_ouverte(self, obj):
        return obj.est_ouverte()


class CreerElectionSerializer(serializers.ModelSerializer):
    class Meta:
        model  = Election
        fields = [
            'titre', 'description', 'date_debut',
            'date_fin', 'annee_academique'
        ]

    def validate(self, data):
        if data['date_debut'] >= data['date_fin']:
            raise serializers.ValidationError(
                'La date de début doit être avant la date de fin.'
            )
        return data