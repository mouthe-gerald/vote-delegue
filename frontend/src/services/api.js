import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || '/api'
const api = axios.create({
  headers: { 'ngrok-skip-browser-warning': 'true' },
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
})

// Intercepteur pour ajouter le token
api.interceptors.request.use(config => {
  const token = localStorage.getItem('access_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Intercepteur pour refresh token
api.interceptors.response.use(
  response => response,
  async error => {
    const original = error.config
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true
      try {
        const refresh = localStorage.getItem('refresh_token')
        const { data } = await axios.post(`${API_URL}/auth/token/refresh/`, { refresh })
        localStorage.setItem('access_token', data.access)
        original.headers.Authorization = `Bearer ${data.access}`
        return api(original)
      } catch {
        localStorage.removeItem('access_token')
        localStorage.removeItem('refresh_token')
        window.location.href = '/connexion'
      }
    }
    return Promise.reject(error)
  }
)

export const authAPI = {
  inscription:   (data) => api.post('/auth/inscription/', data),
  connexion:     (data) => api.post('/auth/connexion/', data),
  deconnexion:   (data) => api.post('/auth/deconnexion/', data),
  profil:        ()     => api.get('/auth/profil/'),
  envoyerOTP:    (data) => api.post('/auth/otp/envoyer/', data),
  verifierOTP:   (data) => api.post('/auth/otp/verifier/', data),
  encoderVisage: (data) => api.post('/auth/face/encoder/', data),
  verifierVisage:(data) => api.post('/auth/face/verifier/', data),
  getEtudiantsAutorises: ()     => api.get('/auth/etudiants-autorises/'),
  ajouterEtudiantAutorise: (data) => api.post('/auth/etudiants-autorises/', data),
  supprimerEtudiantAutorise: (id) => api.delete(`/auth/etudiants-autorises/${id}/`),
  importerEtudiants: (data) => api.post('/auth/etudiants-autorises/import/', data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  getUtilisateurs: (role) => api.get('/auth/utilisateurs/' + (role ? `?role=${role}` : '')),
  modifierUtilisateur: (id, data) => api.put(`/auth/utilisateurs/${id}/`, data),
  desactiverUtilisateur: (id) => api.delete(`/auth/utilisateurs/${id}/`),
  restaurerUtilisateur: (id) => api.put(`/auth/utilisateurs/${id}/restaurer/`),
  supprimerDefinitivement: (id) => api.delete(`/auth/utilisateurs/${id}/supprimer-definitivement/`),
  webauthnRegisterBegin:    ()     => api.post('/auth/webauthn/register/begin/'),
  webauthnRegisterBeginPublic: (email) => api.post('/auth/webauthn/register/begin-public/', { email }),
  webauthnRegisterComplete: (data) => api.post('/auth/webauthn/register/complete/', data),
  webauthnVerifyBegin:      ()     => api.post('/auth/webauthn/verify/begin/'),
  webauthnVerifyComplete:   (data) => api.post('/auth/webauthn/verify/complete/', data),
  preInscription:           (data) => api.post('/auth/pre-inscription/', data),
  finaliserInscription:     (data) => api.post('/auth/finaliser-inscription/', data),
  completerInscription:     (data) => api.post('/auth/completer-inscription/', data),
  motDePasseOublie:         (data) => api.post('/auth/mot-de-passe-oublie/', data),
  reinitialiserMotDePasse:  (data) => api.post('/auth/reinitialiser-mot-de-passe/', data),
}

export const electionAPI = {
  liste:    ()     => api.get('/elections/'),
  creer:    (data) => api.post('/elections/create/', data),
  detail:   (id)   => api.get(`/elections/${id}/`),
  ouvrir:   (id)   => api.put(`/elections/${id}/ouvrir/`),
  cloturer: (id)   => api.put(`/elections/${id}/cloturer/`),
  publier:  (id)   => api.put(`/elections/${id}/publier/`),
  statut:   (id)   => api.get(`/elections/${id}/statut/`),
  annuler:  (id, data) => api.put(`/elections/${id}/annuler/`, data),
}

export const candidatureAPI = {
  liste:           (electionId) => api.get(`/candidatures/?election_id=${electionId}`),
  soumettre:       (data)       => api.post('/candidatures/soumettre/', data),
  soumettreFormData: (data)     => api.post('/candidatures/soumettre/', data, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  enAttente:       ()           => api.get('/candidatures/en-attente/'),
  valider:         (id)         => api.put(`/candidatures/${id}/valider/`),
  rejeter:         (id, data)   => api.put(`/candidatures/${id}/rejeter/`, data),
  demanderRetrait: (id, data)   => api.put(`/candidatures/${id}/retrait/`, data),
}

export const voteAPI = {
  verifierDroit: (electionId) => api.get(`/votes/verifier/${electionId}/`),
  voter:         (data)       => api.post('/votes/caster/', data),
  journal:       (electionId) => api.get(`/votes/journal/${electionId}/`),
}

export const notificationAPI = {
  liste:       () => api.get('/notifications/'),
  marquerLues: () => api.post('/notifications/'),
}

export const resultatAPI = {
  consulter: (electionId) => api.get(`/resultats/${electionId}/`),
  calculer:  (electionId) => api.post(`/resultats/${electionId}/calculer/`),
  rapport:   (electionId) => api.get(`/resultats/${electionId}/rapport/`, { responseType: 'blob' }),
}

export default api