import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { User, Lock, Eye, EyeOff, GraduationCap } from 'lucide-react'
import toast from 'react-hot-toast'

const Connexion = () => {
  const [form, setForm]         = useState({ matricule: '', mot_de_passe: '' })
  const [showPwd, setShowPwd]   = useState(false)
  const [loading, setLoading]   = useState(false)
  const [erreur, setErreur]     = useState('')
  const { connexion }           = useAuth()
  const navigate                = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setErreur('')
    try {
      const data = await connexion(form.matricule, form.mot_de_passe)
      toast.success('Connexion réussie !')
      if (data.role === 'ADMINISTRATEUR') navigate('/admin/dashboard')
      else if (data.role === 'CANDIDAT')  navigate('/candidat/dashboard')
      else                                navigate('/etudiant/dashboard')
    } catch (err) {
      const msg = err.response?.data?.erreur ||
                  err.response?.data?.non_field_errors?.[0] ||
                  'Identifiants incorrects.'
      setErreur(msg)
      if (err.response?.data?.email_non_verifie) {
        toast.error('Email non vérifié. Vérifiez votre boîte mail.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex" style={{
      background: 'linear-gradient(135deg, #1a1a6e 0%, #6d28d9 50%, #ec4899 100%)'
    }}>
      {/* Partie gauche */}
      <div className="hidden lg:flex flex-1 flex-col justify-center px-16 text-white">
        <div className="flex items-center gap-4 mb-12">
          <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center">
            <GraduationCap size={32} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Vote Délégué</h1>
            <p className="text-white/70 text-sm">Licence Génie Informatique</p>
          </div>
        </div>

        <h2 className="text-6xl font-bold mb-6 leading-tight">
          Élection<br />
          <span className="text-pink-300">Démocratique.</span>
        </h2>
        <p className="text-white/70 text-lg max-w-md leading-relaxed">
          Plateforme sécurisée de vote électronique avec reconnaissance faciale
          et blockchain pour l'élection des délégués de classe.
        </p>

        <div className="flex gap-3 mt-10">
          {[0,1,2,3].map(i => (
            <div key={i} className={`h-2 rounded-full ${i === 0 ? 'w-8 bg-white' : 'w-2 bg-white/40'}`} />
          ))}
        </div>
      </div>

      {/* Partie droite — Formulaire */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="bg-white rounded-3xl shadow-2xl p-10 w-full max-w-md">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <GraduationCap size={32} className="text-purple-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-800">Connexion</h3>
            <p className="text-gray-500 mt-1">Accédez à votre espace</p>
          </div>

          {erreur && (
            <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl p-3 mb-6 text-sm">
              {erreur}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Matricule */}
            <div className="relative">
              <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-purple-400" />
              <input
                type="text"
                placeholder="Matricule"
                value={form.matricule}
                onChange={e => setForm({...form, matricule: e.target.value})}
                className="input-field pl-11"
                required
              />
            </div>

            {/* Mot de passe */}
            <div className="relative">
              <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-purple-400" />
              <input
                type={showPwd ? 'text' : 'password'}
                placeholder="Mot de passe"
                value={form.mot_de_passe}
                onChange={e => setForm({...form, mot_de_passe: e.target.value})}
                className="input-field pl-11 pr-11"
                required
              />
              <button
                type="button"
                onClick={() => setShowPwd(!showPwd)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-purple-600"
              >
                {showPwd ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : 'Se connecter'}
            </button>
          </form>

          <p className="text-center text-gray-500 mt-6 text-sm">
            Pas encore de compte ?{' '}
            <Link to="/inscription" className="text-purple-600 font-semibold hover:underline">
              S'inscrire
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default Connexion