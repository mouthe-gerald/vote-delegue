import { createContext, useContext, useState, useEffect } from 'react'
import { authAPI } from '../services/api'

const AuthContext = createContext()

export const AuthProvider = ({ children }) => {
  const [user, setUser]       = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('access_token')
    if (token) {
      authAPI.profil()
        .then(({ data }) => setUser(data))
        .catch(() => localStorage.clear())
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [])

  const connexion = async (matricule, mot_de_passe) => {
    const { data } = await authAPI.connexion({ matricule, mot_de_passe })
    localStorage.setItem('access_token',  data.tokens.access)
    localStorage.setItem('refresh_token', data.tokens.refresh)
    setUser(data.utilisateur)
    return data
  }

  const deconnexion = async () => {
    try {
      const refresh = localStorage.getItem('refresh_token')
      await authAPI.deconnexion({ refresh })
    } catch {}
    localStorage.clear()
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, setUser, loading, connexion, deconnexion }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)