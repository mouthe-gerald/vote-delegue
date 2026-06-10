import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { User, Lock, Eye, EyeOff, GraduationCap, Mail, Trophy, BarChart2, Award } from 'lucide-react'
import toast from 'react-hot-toast'

const Connexion = () => {
  const [typeConnexion, setTypeConnexion] = useState(null)
  const [form, setForm]                   = useState({ identifiant: '', mot_de_passe: '' })
  const [showPwd, setShowPwd]             = useState(false)
  const [loading, setLoading]             = useState(false)
  const [erreur, setErreur]               = useState('')
  const { connexion }                     = useAuth()
  const navigate                          = useNavigate()

  const types = [
    {
      id:          'admin',
      label:       'Administrateur',
      icon:        Mail,
      color:       'from-blue-600 to-blue-800',
      bgLight:     'bg-blue-50',
      textColor:   'text-blue-700',
      borderColor: 'border-blue-200',
      placeholder: 'Email administrateur',
      description: 'Gestion de la plateforme',
      emoji:       '👨‍💼'
    },
    {
      id:          'etudiant',
      label:       'Étudiant',
      icon:        GraduationCap,
      color:       'from-purple-600 to-purple-800',
      bgLight:     'bg-purple-50',
      textColor:   'text-purple-700',
      borderColor: 'border-purple-200',
      placeholder: 'Matricule (Ex: CM-UDS-24IUT0001)',
      description: 'Voter pour un délégué',
      emoji:       '🎓'
    },
    {
      id:          'candidat',
      label:       'Candidat',
      icon:        Award,
      color:       'from-green-600 to-green-800',
      bgLight:     'bg-green-50',
      textColor:   'text-green-700',
      borderColor: 'border-green-200',
      placeholder: 'Matricule (Ex: CM-UDS-24IUT0001)',
      description: 'Gérer ma candidature',
      emoji:       '🏆'
    },
    {
      id:          'resultats',
      label:       'Résultats',
      icon:        BarChart2,
      color:       'from-orange-500 to-orange-700',
      bgLight:     'bg-orange-50',
      textColor:   'text-orange-700',
      borderColor: 'border-orange-200',
      placeholder: null,
      description: 'Voir les résultats en direct',
      emoji:       '📊'
    },
  ]

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setErreur('')
    try {
      const data = await connexion(form.identifiant, form.mot_de_passe)
      toast.success('Connexion réussie !')
      if (data.role === 'ADMINISTRATEUR')  navigate('/admin/dashboard')
      else if (data.role === 'CANDIDAT')   navigate('/candidat/dashboard')
      else                                 navigate('/etudiant/dashboard')
    } catch (err) {
      const msg = err.response?.data?.erreur ||
                  err.response?.data?.non_field_errors?.[0] ||
                  'Identifiants incorrects.'
      setErreur(msg)
    } finally {
      setLoading(false)
    }
  }

  const typeActif = types.find(t => t.id === typeConnexion)

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10"
      style={{ background: 'linear-gradient(135deg, #1a1a6e 0%, #6d28d9 50%, #ec4899 100%)' }}>

      <div className="w-full max-w-2xl">

        {/* Header */}
        <div className="text-center mb-10">
          <div className="w-20 h-20 bg-white/20 rounded-3xl flex items-center justify-center mx-auto mb-4">
            <GraduationCap size={40} className="text-white" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">Vote Délégué</h1>
          <p className="text-white/70">Licence Génie Informatique — 2025-2026</p>
        </div>

        {/* Sélection du type */}
        {!typeConnexion && (
          <div>
            <p className="text-white/80 text-center mb-6 font-medium">
              Choisissez votre type de connexion
            </p>
            <div className="grid grid-cols-2 gap-4">
              {types.map(type => (
                <button key={type.id}
                  onClick={() => {
                    if (type.id === 'resultats') {
                      navigate('/resultats')
                    } else {
                      setTypeConnexion(type.id)
                    }
                  }}
                  className="bg-white rounded-2xl p-6 text-center hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl">
                  <div className={`w-14 h-14 bg-gradient-to-br ${type.color} rounded-2xl flex items-center justify-center mx-auto mb-3`}>
                    <type.icon size={28} className="text-white" />
                  </div>
                  <p className="text-2xl mb-1">{type.emoji}</p>
                  <h3 className="font-bold text-gray-800 text-lg">{type.label}</h3>
                  <p className="text-gray-500 text-sm mt-1">{type.description}</p>
                </button>
              ))}
            </div>
            <p className="text-center text-white/60 mt-6 text-sm">
              Pas encore de compte ?{' '}
              <Link to="/inscription" className="text-pink-300 font-semibold hover:underline">
                S'inscrire
              </Link>
            </p>
          </div>
        )}

        {/* Formulaire de connexion */}
        {typeConnexion && typeActif && (
          <div className="bg-white rounded-3xl shadow-2xl p-8">
            <div className="flex items-center gap-4 mb-6">
              <button onClick={() => { setTypeConnexion(null); setErreur(''); setForm({ identifiant: '', mot_de_passe: '' }) }}
                className="p-2 hover:bg-gray-100 rounded-xl text-gray-500">
                ← Retour
              </button>
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 bg-gradient-to-br ${typeActif.color} rounded-xl flex items-center justify-center`}>
                  <typeActif.icon size={20} className="text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-800">{typeActif.emoji} {typeActif.label}</h3>
                  <p className="text-gray-500 text-xs">{typeActif.description}</p>
                </div>
              </div>
            </div>

            {erreur && (
              <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl p-3 mb-5 text-sm">
                {erreur}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="relative">
                <typeActif.icon size={18} className={`absolute left-4 top-1/2 -translate-y-1/2 ${typeActif.textColor}`} />
                <input
                  type={typeConnexion === 'admin' ? 'email' : 'text'}
                  placeholder={typeActif.placeholder}
                  value={form.identifiant}
                  onChange={e => setForm({...form, identifiant: e.target.value})}
                  className="input-field pl-11"
                  required
                />
              </div>

              <div className="relative">
                <Lock size={18} className={`absolute left-4 top-1/2 -translate-y-1/2 ${typeActif.textColor}`} />
                <input
                  type={showPwd ? 'text' : 'password'}
                  placeholder="Mot de passe"
                  value={form.mot_de_passe}
                  onChange={e => setForm({...form, mot_de_passe: e.target.value})}
                  className="input-field pl-11 pr-11"
                  required
                />
                <button type="button" onClick={() => setShowPwd(!showPwd)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">
                  {showPwd ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>

              <button type="submit" disabled={loading}
                className={`w-full py-3 rounded-xl text-white font-semibold bg-gradient-to-r ${typeActif.color} hover:opacity-90 transition-all flex items-center justify-center gap-2`}>
                {loading
                  ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  : `Se connecter comme ${typeActif.label}`}
              </button>
            </form>

            <p className="text-center text-gray-500 mt-5 text-sm">
              Pas encore de compte ?{' '}
              <Link to="/inscription" className="text-purple-600 font-semibold hover:underline">
                S'inscrire
              </Link>
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export default Connexion