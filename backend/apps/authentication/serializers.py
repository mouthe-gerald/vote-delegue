from rest_framework import serializers
from django.contrib.auth import authenticate
from .models import Utilisateur, Etudiant, Role


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
        from .models import EtudiantAutorise
        pattern = r'^CM-UDS-\d{2}IUT\d{4}$'
        if not re.match(pattern, value):
            raise serializers.ValidationError(
                'Format invalide. Exemple correct : CM-UDS-24IUT0001'
            )
        try:
            EtudiantAutorise.objects.get(matricule=value)
        except EtudiantAutorise.DoesNotExist:
            raise serializers.ValidationError(
                'Ce matricule ne figure pas dans la liste des étudiants autorisés.'
            )
        return value

    def validate(self, data):
        from .models import EtudiantAutorise
        if data['mot_de_passe'] != data['mot_de_passe_confirm']:
            raise serializers.ValidationError(
                {'mot_de_passe': 'Les mots de passe ne correspondent pas.'}
            )
        try:
            autorise = EtudiantAutorise.objects.get(matricule=data['matricule'])
            if autorise.est_inscrit:
                raise serializers.ValidationError(
                    {'matricule': 'Ce matricule est déjà inscrit sur la plateforme.'}
                )
            if autorise.nom.lower() != data['nom'].lower():
                raise serializers.ValidationError(
                    {'nom': 'Le nom ne correspond pas à celui enregistré.'}
                )
            if autorise.prenom.lower() != data['prenom'].lower():
                raise serializers.ValidationError(
                    {'prenom': 'Le prénom ne correspond pas à celui enregistré.'}
                )
            if autorise.filiere.lower() != data['filiere'].lower():
                raise serializers.ValidationError(
                    {'filiere': 'La filière ne correspond pas à celle enregistrée.'}
                )
            if autorise.niveau.lower() != data['niveau'].lower():
                raise serializers.ValidationError(
                    {'niveau': 'Le niveau ne correspond pas à celui enregistré.'}
                )
        except EtudiantAutorise.DoesNotExist:
            pass
        return data

    def create(self, validated_data):
        from .models import EtudiantAutorise
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
        EtudiantAutorise.objects.filter(matricule=utilisateur.matricule).update(est_inscrit=True)
        return utilisateur


class ConnexionSerializer(serializers.Serializer):
    identifiant  = serializers.CharField()
    mot_de_passe = serializers.CharField(write_only=True)

    def validate(self, data):
        identifiant  = data['identifiant']
        mot_de_passe = data['mot_de_passe']
        if '@' in identifiant:
            try:
                user_obj = Utilisateur.objects.get(email=identifiant)
                username = user_obj.matricule
            except Utilisateur.DoesNotExist:
                raise serializers.ValidationError('Email ou mot de passe incorrect.')
        else:
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
        fields = ['id', 'matricule', 'nom', 'prenom', 'email', 'role', 'date_inscription']


class EtudiantSerializer(serializers.ModelSerializer):
    utilisateur = UtilisateurSerializer(read_only=True)

    class Meta:
        model  = Etudiant
        fields = ['utilisateur', 'filiere', 'niveau', 'annee_academique', 'a_vote', 'vote_tx_hash']


class EncodageVisageSerializer(serializers.Serializer):
    image_base64 = serializers.CharField()


class VerificationVisageSerializer(serializers.Serializer):
    image_base64 = serializers.CharField()
