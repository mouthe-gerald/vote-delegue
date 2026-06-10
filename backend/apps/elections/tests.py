from django.test import TestCase
from rest_framework.test import APITestCase
from rest_framework import status
from apps.authentication.models import Utilisateur, Etudiant, Administrateur, Role
from apps.elections.models import Election
from django.utils import timezone
from datetime import timedelta


class TestElections(APITestCase):
    """Tests pour la gestion des élections"""

    def setUp(self):
        # Créer un admin
        self.admin_user = Utilisateur.objects.create_user(
            matricule='ADMIN-TEST',
            email='admin@test.cm',
            password='admin1234',
            nom='Admin',
            prenom='Test',
            role=Role.ADMINISTRATEUR,
            email_verifie=True,
            est_actif=True
        )
        self.admin = Administrateur.objects.create(
            utilisateur=self.admin_user
        )
        # Créer un étudiant
        self.etudiant_user = Utilisateur.objects.create_user(
            matricule='CM-UDS-24IUT0001',
            email='etudiant@test.cm',
            password='motdepasse123',
            nom='Etudiant',
            prenom='Test',
            role=Role.ETUDIANT,
            email_verifie=True,
            est_actif=True
        )
        Etudiant.objects.create(
            utilisateur=self.etudiant_user,
            filiere='Génie Informatique',
            niveau='Licence 3',
            annee_academique='2025-2026'
        )
        # Connecter l'admin
        response = self.client.post('/api/auth/connexion/', {
            'identifiant': 'admin@test.cm',
            'mot_de_passe': 'admin1234'
        }, format='json')
        self.admin_token = response.data['tokens']['access']

        # Connecter l'étudiant
        response = self.client.post('/api/auth/connexion/', {
            'identifiant': 'CM-UDS-24IUT0001',
            'mot_de_passe': 'motdepasse123'
        }, format='json')
        self.etudiant_token = response.data['tokens']['access']

    def test_creer_election(self):
        """Test création d'une élection par l'admin"""
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.admin_token}')
        data = {
            'titre':            'Élection Test 2025-2026',
            'description':      'Test élection',
            'date_debut':       (timezone.now() + timedelta(hours=1)).isoformat(),
            'date_fin':         (timezone.now() + timedelta(days=1)).isoformat(),
            'annee_academique': '2025-2026',
        }
        response = self.client.post('/api/elections/create/', data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        print('✅ Test création élection — PASSÉ')

    def test_liste_elections(self):
        """Test liste des élections"""
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.etudiant_token}')
        response = self.client.get('/api/elections/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        print('✅ Test liste élections — PASSÉ')

    def test_creer_election_sans_auth(self):
        """Test création élection sans authentification"""
        data = {
            'titre':            'Élection Non Autorisée',
            'date_debut':       timezone.now().isoformat(),
            'date_fin':         (timezone.now() + timedelta(days=1)).isoformat(),
            'annee_academique': '2025-2026',
        }
        response = self.client.post('/api/elections/create/', data, format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        print('✅ Test création sans auth — PASSÉ')

    def test_ouvrir_election(self):
        """Test ouverture d'une élection"""
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.admin_token}')
        election = Election.objects.create(
            titre='Élection à Ouvrir',
            date_debut=timezone.now(),
            date_fin=timezone.now() + timedelta(days=1),
            annee_academique='2025-2026',
            createur=self.admin
        )
        response = self.client.put(f'/api/elections/{election.id}/ouvrir/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        election.refresh_from_db()
        self.assertEqual(election.statut, 'EN_COURS')
        print('✅ Test ouverture élection — PASSÉ')

    def test_cloturer_election(self):
        """Test clôture d'une élection"""
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.admin_token}')
        election = Election.objects.create(
            titre='Élection à Clôturer',
            date_debut=timezone.now(),
            date_fin=timezone.now() + timedelta(days=1),
            annee_academique='2025-2026',
            statut='EN_COURS',
            createur=self.admin
        )
        response = self.client.put(f'/api/elections/{election.id}/cloturer/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        election.refresh_from_db()
        self.assertEqual(election.statut, 'CLOTUREE')
        print('✅ Test clôture élection — PASSÉ')