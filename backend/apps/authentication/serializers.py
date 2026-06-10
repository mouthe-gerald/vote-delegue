import face_recognition
import numpy as np
from rest_framework import serializers
from django.contrib.auth import authenticate
from .models import Utilisateur, Etudiant, Administrateur, Visage, Role


class InscriptionSerializer(serializers.ModelSerializer):
    mot_de_passe         = serializers.CharField(write_only=True, min_length=8)
    mot_de_passe_confirm = serializers.CharField(write_only=True)
    filiere              = serializers.CharField()
    niveau               = serializers.CharField()
    annee_academique     = serializers.CharField()

    class Meta:
        model  = Utilisateur
        fields = [
            'matricule', 'nom', 'prenom', 'email',
            'mot_de_passe', 'mot_de_passe_confirm',
            'filiere', 'niveau', 'annee_academique'
        ]

    def validate_matricule(self, value):
        import re
        pattern = r'^CM-UDS-\d{2}IUT\d{4}$'
        if not re.match(pattern, value):
            raise serializers.ValidationError(
                'Format invalide. Exemple correct : CM-UDS-24IUT0001'
            )
        return value

    def validate(self, data):
        if data['mot_de_passe'] != data['mot_de_passe_confirm']:
            raise serializers.ValidationError(
                {'mot_de_passe': 'Les mots de passe ne correspondent pas.'}
            )
        return data

    def create(self, validated_data):
        filiere          = validated_data.pop('filiere')
        niveau           = validated_data.pop('niveau')
        annee_academique = validated_data.pop('annee_academique')
        validated_data.pop('mot_de_passe_confirm')
        mot_de_passe     = validated_data.pop('mot_de_passe')

        utilisateur = Utilisateur.objects.create_user(
            **validated_data,
            password=mot_de_passe,
            role=Role.ETUDIANT
        )
        Etudiant.objects.create(
            utilisateur=utilisateur,
            filiere=filiere,
            niveau=niveau,
            annee_academique=annee_academique
        )
        return utilisateur


class ConnexionSerializer(serializers.Serializer):
    identifiant  = serializers.CharField()
    mot_de_passe = serializers.CharField(write_only=True)

    def validate(self, data):
        identifiant  = data['identifiant']
        mot_de_passe = data['mot_de_passe']

        # Détecter si c'est un email ou un matricule
        if '@' in identifiant:
            # Connexion par email (administrateur)
            try:
                user_obj = Utilisateur.objects.get(email=identifiant)
                username = user_obj.matricule
            except Utilisateur.DoesNotExist:
                raise serializers.ValidationError('Email ou mot de passe incorrect.')
        else:
            # Connexion par matricule (étudiant)
            username = identifiant

        user = authenticate(username=username, password=mot_de_passe)
        if not user:
            raise serializers.ValidationError('Identifiant ou mot de passe incorrect.')
        if not user.est_actif:
            raise serializers.ValidationError('Ce compte est désactivé.')

        data['utilisateur'] = user
        return data


class UtilisateurSerializer(serializers.ModelSerializer):
    class Meta:
        model  = Utilisateur
        fields = [
            'id', 'matricule', 'nom', 'prenom',
            'email', 'role', 'date_inscription'
        ]


class EtudiantSerializer(serializers.ModelSerializer):
    utilisateur = UtilisateurSerializer(read_only=True)

    class Meta:
        model  = Etudiant
        fields = [
            'utilisateur', 'filiere', 'niveau',
            'annee_academique', 'a_vote', 'vote_tx_hash'
        ]


class EncodageVisageSerializer(serializers.Serializer):
    image_base64 = serializers.CharField()

    def validate_image_base64(self, value):
        import base64, io
        from PIL import Image
        try:
            img_data  = base64.b64decode(value)
            img       = Image.open(io.BytesIO(img_data))
            img_array = np.array(img)
            faces     = face_recognition.face_locations(img_array)
            if len(faces) == 0:
                raise serializers.ValidationError('Aucun visage détecté.')
            if len(faces) > 1:
                raise serializers.ValidationError(
                    'Plusieurs visages détectés. Un seul visage autorisé.'
                )
        except Exception as e:
            raise serializers.ValidationError(f'Image invalide : {str(e)}')
        return value


class VerificationVisageSerializer(serializers.Serializer):
    image_base64 = serializers.CharField()