import axios from 'axios'

const API_URL = 'http://127.0.0.1:8000/api'

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
})

// Intercepteur — ajoute le token automatiquement
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Intercepteur — gère l'expiration du token
api.interceptors.response.use(
  (response) => response,
  async (error) => {
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
        localStorage.clear()
        window.location.href = '/connexion'
      }
    }
    return Promise.reject(error)
  }
)

// ================================================================
// AUTH
// ================================================================
export const authAPI = {
  inscription:     (data) => api.post('/auth/inscription/', data),
  connexion:       (data) => api.post('/auth/connexion/', data),
  deconnexion:     (data) => api.post('/auth/deconnexion/', data),
  profil:          ()     => api.get('/auth/profil/'),
  envoyerOTP:      (data) => api.post('/auth/otp/envoyer/', data),
  verifierOTP:     (data) => api.post('/auth/otp/verifier/', data),
  encoderVisage:   (data) => api.post('/auth/face/encoder/', data),
  verifierVisage:  (data) => api.post('/auth/face/verifier/', data),
}

// ================================================================
// ELECTIONS
// ================================================================
export const electionAPI = {
  liste:           ()     => api.get('/elections/'),
  detail:          (id)   => api.get(`/elections/${id}/`),
  creer:           (data) => api.post('/elections/create/', data),
  ouvrir:          (id)   => api.put(`/elections/${id}/ouvrir/`),
  cloturer:        (id)   => api.put(`/elections/${id}/cloturer/`),
  publier:         (id)   => api.put(`/elections/${id}/publier/`),
  statut:          (id)   => api.get(`/elections/${id}/statut/`),
}

// ================================================================
// CANDIDATURES
// ================================================================
export const candidatureAPI = {
  liste:           (electionId) => api.get(`/candidatures/?election_id=${electionId}`),
  soumettre:       (data)       => api.post('/candidatures/soumettre/', data),
  enAttente:       ()           => api.get('/candidatures/en-attente/'),
  valider:         (id)         => api.put(`/candidatures/${id}/valider/`),
  rejeter:         (id, data)   => api.put(`/candidatures/${id}/rejeter/`, data),
  demanderRetrait: (id, data)   => api.post(`/candidatures/${id}/retrait-demande/`, data),
  approuverRetrait:(id)         => api.put(`/candidatures/${id}/retrait-approuver/`),
  refuserRetrait:  (id)         => api.put(`/candidatures/${id}/retrait-refuser/`),
}

// ================================================================
// VOTES
// ================================================================
export const voteAPI = {
  verifierDroit:   (electionId) => api.get(`/votes/verifier/${electionId}/`),
  voter:           (data)       => api.post('/votes/caster/', data),
  journal:         (electionId) => api.get(`/votes/journal/${electionId}/`),
}

// ================================================================
// RESULTATS
// ================================================================
export const resultatAPI = {
  consulter:       (electionId) => api.get(`/resultats/${electionId}/`),
  calculer:        (electionId) => api.post(`/resultats/${electionId}/calculer/`),
  rapport:         (electionId) => api.post(`/resultats/${electionId}/rapport/`),
}

export default api