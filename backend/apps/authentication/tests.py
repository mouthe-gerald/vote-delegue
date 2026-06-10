from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APITestCase
from rest_framework import status
from apps.authentication.models import Utilisateur, Etudiant, Role


class TestInscription(APITestCase):
    """Tests pour l'inscription des étudiants"""

    def test_inscription_valide(self):
        """Test inscription avec données valides"""
        data = {
            'matricule':          'CM-UDS-24IUT0001',
            'nom':                'Kameni',
            'prenom':             'Leslie',
            'email':              'leslie@test.cm',
            'filiere':            'Génie Informatique',
            'niveau':             'Licence 3',
            'annee_academique':   '2025-2026',
            'mot_de_passe':       'motdepasse123',
            'mot_de_passe_confirm': 'motdepasse123',
        }
        response = self.client.post('/api/auth/inscription/', data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn('message', response.data)
        print('✅ Test inscription valide — PASSÉ')

    def test_inscription_matricule_invalide(self):
        """Test inscription avec matricule invalide"""
        data = {
            'matricule':          'INVALID123',
            'nom':                'Test',
            'prenom':             'Test',
            'email':              'test@test.cm',
            'filiere':            'Génie Informatique',
            'niveau':             'Licence 3',
            'annee_academique':   '2025-2026',
            'mot_de_passe':       'motdepasse123',
            'mot_de_passe_confirm': 'motdepasse123',
        }
        response = self.client.post('/api/auth/inscription/', data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        print('✅ Test matricule invalide — PASSÉ')

    def test_inscription_mots_de_passe_differents(self):
        """Test inscription avec mots de passe différents"""
        data = {
            'matricule':          'CM-UDS-24IUT0002',
            'nom':                'Test',
            'prenom':             'Test',
            'email':              'test2@test.cm',
            'filiere':            'Génie Informatique',
            'niveau':             'Licence 3',
            'annee_academique':   '2025-2026',
            'mot_de_passe':       'motdepasse123',
            'mot_de_passe_confirm': 'autremotdepasse',
        }
        response = self.client.post('/api/auth/inscription/', data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        print('✅ Test mots de passe différents — PASSÉ')

    def test_inscription_email_duplique(self):
        """Test inscription avec email déjà utilisé"""
        Utilisateur.objects.create_user(
            matricule='CM-UDS-24IUT0003',
            email='existant@test.cm',
            password='motdepasse123',
            nom='Existant',
            prenom='User',
            role=Role.ETUDIANT
        )
        data = {
            'matricule':          'CM-UDS-24IUT0004',
            'nom':                'Test',
            'prenom':             'Test',
            'email':              'existant@test.cm',
            'filiere':            'Génie Informatique',
            'niveau':             'Licence 3',
            'annee_academique':   '2025-2026',
            'mot_de_passe':       'motdepasse123',
            'mot_de_passe_confirm': 'motdepasse123',
        }
        response = self.client.post('/api/auth/inscription/', data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        print('✅ Test email dupliqué — PASSÉ')


class TestConnexion(APITestCase):
    """Tests pour la connexion"""

    def setUp(self):
        self.utilisateur = Utilisateur.objects.create_user(
            matricule='CM-UDS-24IUT0010',
            email='connexion@test.cm',
            password='motdepasse123',
            nom='Test',
            prenom='User',
            role=Role.ETUDIANT,
            email_verifie=True,
            est_actif=True
        )
        Etudiant.objects.create(
            utilisateur=self.utilisateur,
            filiere='Génie Informatique',
            niveau='Licence 3',
            annee_academique='2025-2026'
        )

    def test_connexion_valide(self):
        """Test connexion avec identifiants valides"""
        data = {
            'identifiant':  'CM-UDS-24IUT0010',
            'mot_de_passe': 'motdepasse123',
        }
        response = self.client.post('/api/auth/connexion/', data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('tokens', response.data)
        print('✅ Test connexion valide — PASSÉ')

    def test_connexion_mauvais_mot_de_passe(self):
        """Test connexion avec mauvais mot de passe"""
        data = {
            'identifiant':  'CM-UDS-24IUT0010',
            'mot_de_passe': 'mauvaismdp',
        }
        response = self.client.post('/api/auth/connexion/', data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        print('✅ Test mauvais mot de passe — PASSÉ')

    def test_connexion_matricule_inexistant(self):
        """Test connexion avec matricule inexistant"""
        data = {
            'identifiant':  'CM-UDS-99IUT9999',
            'mot_de_passe': 'motdepasse123',
        }
        response = self.client.post('/api/auth/connexion/', data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        print('✅ Test matricule inexistant — PASSÉ')

    def test_connexion_admin_par_email(self):
        """Test connexion admin par email"""
        admin = Utilisateur.objects.create_user(
            matricule='ADMIN-TEST',
            email='admin@test.cm',
            password='admin1234',
            nom='Admin',
            prenom='Test',
            role=Role.ADMINISTRATEUR,
            email_verifie=True,
            est_actif=True
        )
        data = {
            'identifiant':  'admin@test.cm',
            'mot_de_passe': 'admin1234',
        }
        response = self.client.post('/api/auth/connexion/', data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['role'], 'ADMINISTRATEUR')
        print('✅ Test connexion admin par email — PASSÉ')


class TestModeles(TestCase):
    """Tests pour les modèles"""

    def test_creation_utilisateur(self):
        """Test création d'un utilisateur"""
        user = Utilisateur.objects.create_user(
            matricule='CM-UDS-24IUT0020',
            email='modele@test.cm',
            password='motdepasse123',
            nom='Modele',
            prenom='Test',
            role=Role.ETUDIANT
        )
        self.assertEqual(user.matricule, 'CM-UDS-24IUT0020')
        self.assertEqual(user.role, Role.ETUDIANT)
        self.assertTrue(user.check_password('motdepasse123'))
        print('✅ Test création utilisateur — PASSÉ')

    def test_creation_etudiant(self):
        """Test création d'un profil étudiant"""
        user = Utilisateur.objects.create_user(
            matricule='CM-UDS-24IUT0021',
            email='etudiant@test.cm',
            password='motdepasse123',
            nom='Etudiant',
            prenom='Test',
            role=Role.ETUDIANT
        )
        etudiant = Etudiant.objects.create(
            utilisateur=user,
            filiere='Génie Informatique',
            niveau='Licence 3',
            annee_academique='2025-2026'
        )
        self.assertEqual(etudiant.filiere, 'Génie Informatique')
        self.assertEqual(etudiant.a_vote, False)
        print('✅ Test création étudiant — PASSÉ')