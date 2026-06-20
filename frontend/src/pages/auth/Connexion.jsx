import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { User, Lock, Eye, EyeOff, Vote, Shield, BarChart2, Users, ArrowLeft } from 'lucide-react'
import toast from 'react-hot-toast'

const Connexion = () => {
  const [form, setForm]       = useState({ identifiant: '', mot_de_passe: '' })
  const [showPwd, setShowPwd] = useState(false)
  const [loading, setLoading] = useState(false)
  const [erreur, setErreur]   = useState('')
  const { connexion }         = useAuth()
  const navigate              = useNavigate()

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

  return (
    <div className="min-h-screen bg-slate-900 flex relative">
      <Link to="/" className="absolute top-5 left-5 z-10 w-9 h-9 flex items-center justify-center rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all border border-white/10">
        <ArrowLeft size={16} />
      </Link>

      {/* Panneau gauche — branding (desktop only) */}
      <div className="hidden lg:flex flex-col justify-between w-2/5 bg-slate-950 border-r border-white/5 p-12">
        <div>
          <Link to="/" className="flex items-center gap-3 mb-16">
            <div className="w-10 h-10 bg-amber-500 rounded-lg flex items-center justify-center">
              <Vote size={20} className="text-slate-900" />
            </div>
            <span className="text-white font-bold text-lg">VotingApp</span>
          </Link>

          <h1 className="text-3xl font-extrabold text-white leading-tight mb-4">
            Bienvenue sur la<br />
            <span className="text-amber-500">plateforme officielle</span><br />
            de vote
          </h1>
          <p className="text-slate-400 text-sm leading-relaxed">
            Connectez-vous pour accéder à votre espace et participer au processus électoral sécurisé.
          </p>
        </div>

        {/* Features list */}
        <div className="flex flex-col gap-4">
          {[
            { icon: Shield,   label: 'Sécurisé par blockchain' },
            { icon: Users,    label: 'Vote démocratique garanti' },
            { icon: BarChart2, label: 'Résultats en temps réel' },
          ].map((f, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="w-8 h-8 bg-amber-500/15 rounded-lg flex items-center justify-center">
                <f.icon size={15} className="text-amber-500" />
              </div>
              <span className="text-slate-400 text-sm">{f.label}</span>
            </div>
          ))}
        </div>

        <p className="text-slate-600 text-xs">© 2025-2026 VotingApp</p>
      </div>

      {/* Panneau droit — formulaire */}
      <div className="flex-1 flex items-center justify-center px-4 py-12"
        style={{ backgroundImage: 'radial-gradient(circle at 60% 40%, rgba(21,101,192,0.15) 0%, transparent 60%)' }}>
        <div className="w-full max-w-md">

          {/* Mobile logo */}
          <Link to="/" className="flex items-center gap-3 mb-10 lg:hidden">
            <div className="w-9 h-9 bg-amber-500 rounded-lg flex items-center justify-center">
              <Vote size={18} className="text-slate-900" />
            </div>
            <span className="text-white font-bold">VotingApp</span>
          </Link>

          <div className="mb-8">
            <h2 className="text-2xl font-extrabold text-white mb-2">Connexion</h2>
            <p className="text-slate-400 text-sm">Entrez vos identifiants pour accéder à votre espace.</p>
          </div>

          {erreur && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl p-4 mb-6 text-sm flex items-start gap-3">
              <div className="w-1 h-full min-h-4 bg-red-500 rounded-full flex-shrink-0 mt-0.5" />
              {erreur}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className="text-slate-400 text-xs font-medium mb-2 block">Matricule ou Email</label>
              <div className="relative">
                <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  placeholder="CM-UDS-24IUT0001 ou admin@email.com"
                  value={form.identifiant}
                  onChange={e => setForm({...form, identifiant: e.target.value})}
                  className="w-full pl-11 pr-4 py-3.5 rounded-xl text-sm text-white outline-none border transition-colors"
                  style={{
                    background: 'rgba(255,255,255,0.05)',
                    borderColor: 'rgba(255,255,255,0.1)',
                  }}
                  required
                />
              </div>
            </div>

            <div>
              <label className="text-slate-400 text-xs font-medium mb-2 block">Mot de passe</label>
              <div className="relative">
                <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type={showPwd ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={form.mot_de_passe}
                  onChange={e => setForm({...form, mot_de_passe: e.target.value})}
                  className="w-full pl-11 pr-12 py-3.5 rounded-xl text-sm text-white outline-none border transition-colors"
                  style={{
                    background: 'rgba(255,255,255,0.05)',
                    borderColor: 'rgba(255,255,255,0.1)',
                  }}
                  required
                />
                <button type="button" onClick={() => setShowPwd(!showPwd)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors">
                  {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading}
              className="w-full bg-amber-500 text-slate-900 py-3.5 rounded-xl font-bold text-sm hover:bg-amber-400 transition-all flex items-center justify-center gap-2 mt-2">
              {loading
                ? <div className="w-5 h-5 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
                : 'Se connecter'
              }
            </button>
          </form>

          <div className="flex flex-col items-center gap-3 mt-6">
            <p className="text-slate-500 text-sm">
              Pas encore de compte ?{' '}
              <Link to="/inscription" className="text-amber-500 font-semibold hover:text-amber-400">
                S'inscrire
              </Link>
            </p>
            <Link to="/resultats" className="text-slate-600 text-sm hover:text-slate-400 transition-colors">
              Voir les résultats sans connexion →
            </Link>
            <Link to="/mot-de-passe-oublie" className="text-slate-600 text-sm hover:text-slate-400 transition-colors">
              Mot de passe oublié ?
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Connexion
