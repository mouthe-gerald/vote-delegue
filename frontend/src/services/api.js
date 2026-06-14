import axios from 'axios'

const API_URL = 'http://192.168.185.203:8000/api'
const api = axios.create({
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
}

export const electionAPI = {
  liste:    ()     => api.get('/elections/'),
  creer:    (data) => api.post('/elections/create/', data),
  detail:   (id)   => api.get(`/elections/${id}/`),
  ouvrir:   (id)   => api.put(`/elections/${id}/ouvrir/`),
  cloturer: (id)   => api.put(`/elections/${id}/cloturer/`),
  publier:  (id)   => api.put(`/elections/${id}/publier/`),
  statut:   (id)   => api.get(`/elections/${id}/statut/`),
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
  voter:         (data)       => api.post('/votes/voter/', data),
  journal:       (electionId) => api.get(`/votes/journal/${electionId}/`),
}

export const resultatAPI = {
  consulter: (electionId) => api.get(`/resultats/${electionId}/`),
  calculer:  (electionId) => api.post(`/resultats/${electionId}/calculer/`),
  rapport:   (electionId) => api.get(`/resultats/${electionId}/rapport/`),
}

export default api