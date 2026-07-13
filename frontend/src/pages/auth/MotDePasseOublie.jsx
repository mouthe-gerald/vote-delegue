import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { authAPI } from '../../services/api'
import { Mail, Lock, Eye, EyeOff, ArrowLeft, CheckCircle, KeyRound, Vote } from 'lucide-react'
import toast from 'react-hot-toast'

const MotDePasseOublie = () => {

  const [etape, setEtape]             = useState(0)
  const [identifiant, setIdentifiant] = useState('')
  const [email, setEmail]             = useState('')
  const [otp, setOtp]                 = useState(['', '', '', '', '', ''])
  const [nouveauMdp, setNouveauMdp]   = useState('')
  const [confirmMdp, setConfirmMdp]   = useState('')
  const [showPwd, setShowPwd]         = useState(false)
  const [showPwd2, setShowPwd2]       = useState(false)
  const [loading, setLoading]         = useState(false)
  const [erreur, setErreur]           = useState('')
  const navigate                      = useNavigate()

  const handleOtpChange = (index, value) => {
    if (!/^\d*$/.test(value)) return
    const newOtp = [...otp]
    newOtp[index] = value
    setOtp(newOtp)
    if (value && index < 5) document.getElementById(`otp-mdp-${index + 1}`)?.focus()
  }

  const envoyerCode = async (e) => {
    e.preventDefault()
    setLoading(true)
    setErreur('')
    try {
      const { data } = await authAPI.motDePasseOublie({ identifiant })
      setEmail(data.email)
      toast.success(`Code envoyé à ${data.email}`)
      setEtape(1)
    } catch (err) {
      setErreur(err.response?.data?.erreur || 'Erreur.')
    } finally { setLoading(false) }
  }

  const reinitialiser = async (e) => {
    e.preventDefault()
    if (nouveauMdp !== confirmMdp) { setErreur('Les mots de passe ne correspondent pas.'); return }
    if (nouveauMdp.length < 8) { setErreur('Minimum 8 caractères.'); return }
    setLoading(true)
    setErreur('')
    try {
      await authAPI.reinitialiserMotDePasse({
        email,
        code:                      otp.join(''),
        nouveau_mot_de_passe:      nouveauMdp,
        confirmation_mot_de_passe: confirmMdp,
      })
      toast.success('Mot de passe réinitialisé !')
      setEtape(2)
    } catch (err) {
      setErreur(err.response?.data?.erreur || 'Erreur.')
    } finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4 py-12"
      style={{ backgroundImage: 'radial-gradient(circle at 60% 40%, rgba(21,101,192,0.2) 0%, transparent 50%)' }}>

      <div className="w-full max-w-md">

        {/* Logo */}
        <Link to="/" className="flex items-center gap-3 mb-8 justify-center">
          <div className="w-9 h-9 bg-amber-500 rounded-lg flex items-center justify-center">
            <Vote size={18} className="text-slate-900" />
          </div>
          <span className="text-gray-800 font-bold">VotingApp</span>
        </Link>

        <div className="bg-white border border-gray-300 rounded-2xl p-8">

          {/* Étape 0 — Identifiant */}
          {etape === 0 && (
            <>
              <div className="text-center mb-6">
                <div className="w-14 h-14 bg-amber-500/15 rounded-2xl flex items-center justify-center mx-auto mb-3">
                  <KeyRound size={26} className="text-amber-500" />
                </div>
                <h2 className="text-xl font-extrabold text-gray-800 mb-1">Mot de passe oublié</h2>
                <p className="text-gray-500 text-sm">Entrez votre matricule ou email pour recevoir un code.</p>
              </div>

              {erreur && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl p-3 mb-4 text-sm flex gap-2">
                  <div className="w-1 bg-red-500 rounded-full flex-shrink-0" /> {erreur}
                </div>
              )}

              <form onSubmit={envoyerCode} className="flex flex-col gap-4">
                <div>
                  <label className="text-gray-500 text-xs mb-1.5 block">Matricule ou Email</label>
                  <div className="relative">
                    <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input type="text" placeholder="CM-UDS-24IUT0001 ou email@..."
                      value={identifiant} onChange={e => setIdentifiant(e.target.value)}
                      className="w-full pl-9 pr-4 py-3 rounded-xl text-sm text-gray-800 bg-blue-50 border border-gray-300 outline-none placeholder-gray-400 focus:border-amber-500/50 transition-colors"
                      required />
                  </div>
                </div>
                <button type="submit" disabled={loading}
                  className="w-full bg-amber-500 text-slate-900 py-3.5 rounded-xl font-bold text-sm hover:bg-amber-400 transition-all flex items-center justify-center gap-2">
                  {loading
                    ? <div className="w-5 h-5 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
                    : 'Envoyer le code'}
                </button>
              </form>
            </>
          )}

          {/* Étape 1 — OTP + nouveau mot de passe */}
          {etape === 1 && (
            <>
              <div className="text-center mb-6">
                <div className="w-14 h-14 bg-blue-500/15 rounded-2xl flex items-center justify-center mx-auto mb-3">
                  <Mail size={26} className="text-blue-400" />
                </div>
                <h2 className="text-xl font-extrabold text-gray-800 mb-1">Réinitialiser</h2>
                <p className="text-gray-500 text-sm">
                  Code envoyé à <span className="text-amber-500 font-medium">{email}</span>
                </p>
              </div>

              {erreur && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl p-3 mb-4 text-sm flex gap-2">
                  <div className="w-1 bg-red-500 rounded-full flex-shrink-0" /> {erreur}
                </div>
              )}

              <form onSubmit={reinitialiser} className="flex flex-col gap-4">
                <div>
                  <label className="text-gray-500 text-xs mb-2 block text-center">Code de vérification</label>
                  <div className="flex justify-center gap-2">
                    {otp.map((digit, i) => (
                      <input key={i} id={`otp-mdp-${i}`} type="text" maxLength={1} value={digit}
                        onChange={e => handleOtpChange(i, e.target.value)}
                        className="w-11 h-12 text-center text-xl font-bold text-gray-800 bg-blue-50 border border-gray-300 rounded-xl outline-none focus:border-amber-500 transition-colors" />
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-gray-500 text-xs mb-1.5 block">Nouveau mot de passe</label>
                  <div className="relative">
                    <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input type={showPwd ? 'text' : 'password'} placeholder="Min. 8 caractères"
                      value={nouveauMdp} onChange={e => setNouveauMdp(e.target.value)}
                      className="w-full pl-9 pr-10 py-3 rounded-xl text-sm text-gray-800 bg-blue-50 border border-gray-300 outline-none placeholder-gray-400 focus:border-amber-500/50 transition-colors"
                      required />
                    <button type="button" onClick={() => setShowPwd(!showPwd)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                      {showPwd ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-gray-500 text-xs mb-1.5 block">Confirmer le mot de passe</label>
                  <div className="relative">
                    <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input type={showPwd2 ? 'text' : 'password'} placeholder="Répétez le mot de passe"
                      value={confirmMdp} onChange={e => setConfirmMdp(e.target.value)}
                      className="w-full pl-9 pr-10 py-3 rounded-xl text-sm text-gray-800 bg-blue-50 border border-gray-300 outline-none placeholder-gray-400 focus:border-amber-500/50 transition-colors"
                      required />
                    <button type="button" onClick={() => setShowPwd2(!showPwd2)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                      {showPwd2 ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                </div>

                <button type="submit" disabled={loading}
                  className="w-full bg-amber-500 text-slate-900 py-3.5 rounded-xl font-bold text-sm hover:bg-amber-400 transition-all flex items-center justify-center gap-2 mt-2">
                  {loading
                    ? <div className="w-5 h-5 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
                    : 'Réinitialiser le mot de passe'}
                </button>
              </form>
            </>
          )}

          {/* Étape 2 — Succès */}
          {etape === 2 && (
            <div className="text-center flex flex-col items-center gap-4">
              <div className="w-20 h-20 bg-emerald-500/15 rounded-full flex items-center justify-center">
                <CheckCircle size={40} className="text-emerald-500" />
              </div>
              <h2 className="text-xl font-extrabold text-gray-800">Mot de passe réinitialisé !</h2>
              <p className="text-gray-500 text-sm">Vous pouvez maintenant vous connecter avec votre nouveau mot de passe.</p>
              <button onClick={() => navigate('/connexion')}
                className="w-full bg-amber-500 text-slate-900 py-3.5 rounded-xl font-bold text-sm hover:bg-amber-400 transition-all">
                Se connecter
              </button>
            </div>
          )}

          {etape < 2 && (
            <div className="mt-5 text-center">
              <Link to="/connexion"
                className="flex items-center justify-center gap-2 text-gray-400 text-sm hover:text-gray-600 transition-colors">
                <ArrowLeft size={14} /> Retour à la connexion
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default MotDePasseOublie
