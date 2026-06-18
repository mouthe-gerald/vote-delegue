import random
import string
import uuid
from django.db import models
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.utils import timezone
from datetime import timedelta


class Role(models.TextChoices):
    ETUDIANT       = 'ETUDIANT',       'Étudiant'
    CANDIDAT       = 'CANDIDAT',       'Candidat'
    ADMINISTRATEUR = 'ADMINISTRATEUR', 'Administrateur'


class UtilisateurManager(BaseUserManager):

    def create_user(self, matricule, email, password=None, **extra_fields):
        if not matricule:
            raise ValueError('Le matricule est obligatoire')
        if not email:
            raise ValueError("L'email est obligatoire")
        email = self.normalize_email(email)
        user = self.model(matricule=matricule, email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, matricule, email, password=None, **extra_fields):
        extra_fields.setdefault('role', Role.ADMINISTRATEUR)
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        return self.create_user(matricule, email, password, **extra_fields)


class Utilisateur(AbstractBaseUser, PermissionsMixin):
    id                 = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    matricule          = models.CharField(max_length=20, unique=True)
    nom                = models.CharField(max_length=100)
    prenom             = models.CharField(max_length=100)
    email              = models.EmailField(unique=True)
    role               = models.CharField(max_length=20, choices=Role.choices, default=Role.ETUDIANT)
    est_actif          = models.BooleanField(default=True)
    est_supprime = models.BooleanField(default=False)
    is_staff           = models.BooleanField(default=False)
    date_inscription   = models.DateTimeField(auto_now_add=True)
    derniere_connexion = models.DateTimeField(null=True, blank=True)
    email_verifie      = models.BooleanField(default=False)

    objects = UtilisateurManager()

    USERNAME_FIELD  = 'matricule'
    REQUIRED_FIELDS = ['email', 'nom', 'prenom']

    class Meta:
        db_table     = 'utilisateurs'
        verbose_name = 'Utilisateur'

    def __str__(self):
        return f"{self.prenom} {self.nom} ({self.matricule})"

    def est_admin(self):
        return self.role == Role.ADMINISTRATEUR

    def est_etudiant(self):
        return self.role in [Role.ETUDIANT, Role.CANDIDAT]


class Etudiant(models.Model):
    utilisateur      = models.OneToOneField(Utilisateur, on_delete=models.CASCADE,
                                            primary_key=True, related_name='profil_etudiant')
    filiere          = models.CharField(max_length=100)
    niveau           = models.CharField(max_length=50)
    annee_academique = models.CharField(max_length=20)
    a_vote           = models.BooleanField(default=False)
    vote_tx_hash     = models.CharField(max_length=255, null=True, blank=True)

    class Meta:
        db_table     = 'etudiants'
        verbose_name = 'Étudiant'

    def __str__(self):
        return f"{self.utilisateur.prenom} {self.utilisateur.nom} — {self.filiere}"


class Administrateur(models.Model):
    utilisateur = models.OneToOneField(Utilisateur, on_delete=models.CASCADE,
                                       primary_key=True, related_name='profil_admin')
    grade       = models.CharField(max_length=100)
    departement = models.CharField(max_length=100)

    class Meta:
        db_table     = 'administrateurs'
        verbose_name = 'Administrateur'

    def __str__(self):
        return f"{self.utilisateur.prenom} {self.utilisateur.nom} — {self.departement}"


class Visage(models.Model):
    id             = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    etudiant       = models.OneToOneField(Etudiant, on_delete=models.CASCADE,
                                          related_name='visage')
    face_embedding = models.BinaryField()
    date_encodage  = models.DateTimeField(auto_now_add=True)
    modele_utilise = models.CharField(max_length=100, default='face_recognition')

    class Meta:
        db_table     = 'visages'
        verbose_name = 'Visage'

    def __str__(self):
        return f"Visage de {self.etudiant.utilisateur.prenom} {self.etudiant.utilisateur.nom}"


class OTPVerification(models.Model):
    utilisateur     = models.ForeignKey(Utilisateur, on_delete=models.CASCADE,
                                        related_name='otps')
    code            = models.CharField(max_length=6)
    est_utilise     = models.BooleanField(default=False)
    date_creation   = models.DateTimeField(auto_now_add=True)
    date_expiration = models.DateTimeField()

    class Meta:
        db_table     = 'otp_verifications'
        verbose_name = 'OTP Verification'

    def save(self, *args, **kwargs):
        if not self.date_expiration:
            self.date_expiration = timezone.now() + timedelta(minutes=3)
        super().save(*args, **kwargs)

    def est_valide(self):
        return (
            not self.est_utilise and
            timezone.now() < self.date_expiration
        )

    @staticmethod
    def generer_code():
        return ''.join(random.choices(string.digits, k=6))

    def __str__(self):
        return f"OTP {self.code} — {self.utilisateur.matricule}"


class EtudiantAutorise(models.Model):
    matricule        = models.CharField(max_length=20, unique=True)
    nom              = models.CharField(max_length=100)
    prenom           = models.CharField(max_length=100)
    filiere          = models.CharField(max_length=100)
    niveau           = models.CharField(max_length=50)
    annee_academique = models.CharField(max_length=20, default='2025-2026')
    est_inscrit      = models.BooleanField(default=False)
    date_ajout       = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table     = 'etudiants_autorises'
        verbose_name = 'Étudiant Autorisé'

    def __str__(self):
        return f"{self.prenom} {self.nom} ({self.matricule})"

class WebAuthnCredential(models.Model):
    id              = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    utilisateur     = models.OneToOneField(Utilisateur, on_delete=models.CASCADE,
                                           related_name='webauthn_credential')
    credential_id   = models.BinaryField(unique=True)
    public_key      = models.BinaryField()
    sign_count      = models.IntegerField(default=0)
    date_enregistrement = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table     = 'webauthn_credentials'
        verbose_name = 'WebAuthn Credential'

    def __str__(self):
        return f"WebAuthn — {self.utilisateur.matricule}"


class InscriptionTemporaire(models.Model):
    email            = models.EmailField(unique=True)
    matricule        = models.CharField(max_length=20)
    nom              = models.CharField(max_length=100)
    prenom           = models.CharField(max_length=100)
    filiere          = models.CharField(max_length=100)
    niveau           = models.CharField(max_length=50)
    annee_academique = models.CharField(max_length=20, default='2025-2026')
    mot_de_passe     = models.CharField(max_length=255)
    code_otp         = models.CharField(max_length=6)
    otp_verifie        = models.BooleanField(default=False)
    webauthn_challenge = models.CharField(max_length=500, blank=True, null=True)
    date_expiration    = models.DateTimeField()
    date_creation    = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table     = 'inscriptions_temporaires'
        verbose_name = 'Inscription Temporaire'

    def est_valide(self):
        return timezone.now() < self.date_expiration

    def __str__(self):
        return f"Inscription temporaire — {self.email}"
