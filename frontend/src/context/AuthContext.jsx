import { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react'
import { authAPI } from '../services/api'
import toast from 'react-hot-toast'

const AuthContext = createContext()

const TIMEOUT_DUREE = 2 * 60 * 1000 // 2 minutes en millisecondes

export const AuthProvider = ({ children }) => {
  const [user, setUser]       = useState(null)
  const [loading, setLoading] = useState(true)
  const timerRef              = useRef(null)

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

  const deconnexion = useCallback(async (silencieux = false) => {
    try {
      const refresh = localStorage.getItem('refresh_token')
      await authAPI.deconnexion({ refresh })
    } catch {}
    localStorage.clear()
    setUser(null)
    if (!silencieux) {
      toast('Session expirée. Veuillez vous reconnecter.', { icon: '⏱️' })
    }
  }, [])

  const resetTimer = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current)
    if (user) {
      timerRef.current = setTimeout(() => {
        deconnexion(false)
      }, TIMEOUT_DUREE)
    }
  }, [user, deconnexion])

  // Démarrer/réinitialiser le timer à chaque activité utilisateur
  useEffect(() => {
    if (!user) {
      if (timerRef.current) clearTimeout(timerRef.current)
      return
    }

    const evenements = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll', 'click']
    evenements.forEach(e => window.addEventListener(e, resetTimer))
    resetTimer() // Démarrer le timer dès la connexion

    return () => {
      evenements.forEach(e => window.removeEventListener(e, resetTimer))
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [user, resetTimer])

  const connexion = async (identifiant, mot_de_passe) => {
    const { data } = await authAPI.connexion({ identifiant, mot_de_passe })
    localStorage.setItem('access_token',  data.tokens.access)
    localStorage.setItem('refresh_token', data.tokens.refresh)
    setUser(data.utilisateur)
    return data
  }

  const deconnexionManuelle = async () => {
    if (timerRef.current) clearTimeout(timerRef.current)
    try {
      const refresh = localStorage.getItem('refresh_token')
      await authAPI.deconnexion({ refresh })
    } catch {}
    localStorage.clear()
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, setUser, loading, connexion, deconnexion: deconnexionManuelle }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
