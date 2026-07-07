import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import usePageTitle from '../../hooks/usePageTitle'
import { authAPI } from '../../services/api'
import {
  User, Mail, Lock, Eye, EyeOff, CheckCircle,
  GraduationCap, BookOpen, Hash, ArrowRight, ArrowLeft, Fingerprint, Vote
} from 'lucide-react'
import toast from 'react-hot-toast'

const ETAPES = ['Informations', 'Vérification Email', 'Empreinte Digitale']

const getPasswordStrength = (pwd) => {
  if (!pwd) return { score: 0, label: '', color: '' }
  let score = 0
  if (pwd.length >= 8) score++
  if (pwd.length >= 12) score++
  if (/[A-Z]/.test(pwd)) score++
  if (/[0-9]/.test(pwd)) score++
  if (/[^A-Za-z0-9]/.test(pwd)) score++
  if (score <= 1) return { score, label: 'Très faible', color: '#EF4444' }
  if (score === 2) return { score, label: 'Faible', color: '#F97316' }
  if (score === 3) return { score, label: 'Moyen', color: '#F59E0B' }
  if (score === 4) return { score, label: 'Fort', color: '#10B981' }
  return { score, label: 'Très fort', color: '#3B82F6' }
}

const Inscription = () => {

  const [etape, setEtape]       = useState(0)
  const [loading, setLoading]   = useState(false)
  const [showPwd, setShowPwd]   = useState(false)
  const [showPwd2, setShowPwd2] = useState(false)
  const [erreur, setErreur]     = useState('')
  const [email, setEmail]       = useState('')
  const [otp, setOtp]           = useState(['', '', '', '', '', ''])
  const [empreinteOk, setEmpreinteOk] = useState(false)
  const navigate                      = useNavigate()
  usePageTitle('Inscription')

  const [form, setForm] = useState({
    nom: '', prenom: '', matricule: 'CM-UDS-', email: '',
    filiere: '', niveau: '', annee_academique: '2025-2026',
    mot_de_passe: '', mot_de_passe_confirm: '',
  })

  // Étape 1 — Validation + envoi OTP
  const handlePreInscription = async (e) => {
    e.preventDefault()
    setLoading(true)
    setErreur('')
    try {
      const { data } = await authAPI.preInscription(form)
      setEmail(data.email)
      toast.success('Code OTP envoyé à votre email !')
      setEtape(1)
    } catch (err) {
      const errors = err.response?.data
      if (errors?.erreur) setErreur(errors.erreur)
      else if (errors) setErreur(Object.values(errors).flat().join(' '))
    } finally { setLoading(false) }
  }

  // Étape 2 — Vérification OTP (pas de création compte)
  const handleFinaliserInscription = async () => {
    const code = otp.join('')
    if (code.length !== 6) { setErreur('Entrez le code à 6 chiffres.'); return }
    setLoading(true)
    setErreur('')
    try {
      await authAPI.finaliserInscription({ code, email })
      toast.success('Code vérifié ! Enregistrez votre empreinte.')
      setEtape(2)
    } catch (err) {
      setErreur(err.response?.data?.erreur || 'Code invalide.')
    } finally { setLoading(false) }
  }

  const handleOtpChange = (index, value) => {
    if (!/^\d*$/.test(value)) return
    const newOtp = [...otp]
    newOtp[index] = value
    setOtp(newOtp)
    if (value && index < 5) document.getElementById(`otp-${index + 1}`)?.focus()
  }

  // Étape 3 — Empreinte + création compte (tout en même temps)
  const base64urlToUint8Array = (base64url) => {
    const base64 = base64url.replace(/-/g, '+').replace(/_/g, '/')
    const padded = base64.padEnd(base64.length + (4 - base64.length % 4) % 4, '=')
    const binary = atob(padded)
    return Uint8Array.from(binary, c => c.charCodeAt(0))
  }

  const uint8ArrayToBase64 = (uint8Array) => {
    return btoa(String.fromCharCode(...new Uint8Array(uint8Array)))
  }

  const enregistrerEmpreinte = async () => {
    setLoading(true)
    setErreur('')
    try {
      // 1. Obtenir le challenge WebAuthn
      const { data: options } = await authAPI.webauthnRegisterBeginPublic(email)

      const publicKeyOptions = {
        ...options,
        challenge: base64urlToUint8Array(options.challenge),
        user: {
          ...options.user,
          id: base64urlToUint8Array(options.user.id),
        },
        excludeCredentials: (options.excludeCredentials || []).map(c => ({
          ...c,
          id: base64urlToUint8Array(c.id),
        })),
      }

      // 2. Demander l'empreinte
      setErreur('Étape 2: demande empreinte...')
      const credential = await navigator.credentials.create({ publicKey: publicKeyOptions })
      setErreur('Étape 2: empreinte obtenue, envoi...')

      if (!credential) {
        setErreur('Aucune empreinte obtenue. Réessayez.')
        setLoading(false)
        return
      }

      const credentialResponse = {
        id:       credential.id,
        rawId:    uint8ArrayToBase64(credential.rawId),
        type:     credential.type,
        response: {
          attestationObject: uint8ArrayToBase64(credential.response.attestationObject),
          clientDataJSON:    uint8ArrayToBase64(credential.response.clientDataJSON),
        },
      }

      // 3. Créer le compte + empreinte en même temps
      setErreur('Étape 3: création compte...')
      await authAPI.completerInscription({ email, credential: credentialResponse })

      setEmpreinteOk(true)
      toast.success('Inscription complète !')
    } catch (err) {
      console.error('WebAuthn error:', err)
      const msg = err.name === 'NotAllowedError' ? 'Accès refusé. Réessayez.'
        : err.name === 'NotSupportedError' ? 'Appareil non supporté.'
        : err.name === 'InvalidStateError' ? 'Empreinte déjà enregistrée.'
        : err.name === 'AbortError' ? 'Opération annulée.'
        : err.response?.data?.erreur || `Erreur: ${err.name} - ${err.message}`
      setErreur(msg)
    } finally { setLoading(false) }
  }

  const terminerInscription = () => {
    toast.success('Vous pouvez maintenant vous connecter !')
    navigate('/connexion')
  }

  const renvoierOTP = async () => {
    try { await authAPI.preInscription(form); toast.success('Nouveau code envoyé !') }
    catch { toast.error('Erreur lors de l\'envoi.') }
  }

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center px-4 py-12 relative">
      <style>{`
        @keyframes fadeUp { from { opacity:0; transform:translateY(24px); } to { opacity:1; transform:translateY(0); } }
        .fade1 { animation: fadeUp 0.6s ease 0.1s both; }
        .fade2 { animation: fadeUp 0.6s ease 0.25s both; }
        .fade3 { animation: fadeUp 0.6s ease 0.4s both; }
        .fade4 { animation: fadeUp 0.6s ease 0.55s both; }
        @keyframes logo-pulse { 0%,100% { transform:scale(1); } 50% { transform:scale(1.12); } }
        .logo-pulse { animation: logo-pulse 2s ease-in-out infinite; }
        @keyframes shimmer { 0% { background-position:-200% center; } 100% { background-position:200% center; } }
        .btn-submit { background: linear-gradient(90deg,#F0A500 0%,#FFD55A 40%,#F0A500 60%,#F0A500 100%); background-size:200% auto; animation: shimmer 3s linear infinite; }
        @keyframes stepPulse { 0%,100% { transform:scale(1); box-shadow:0 0 0 0 rgba(240,165,0,0.4); } 50% { transform:scale(1.08); box-shadow:0 0 0 6px rgba(240,165,0,0); } }
        .step-active { animation: stepPulse 2s ease-in-out infinite; }
      `}</style>

      <Link to="/" className="absolute top-5 left-5 z-10 w-9 h-9 flex items-center justify-center rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all border border-white/10">
        <ArrowLeft size={16} />
      </Link>

      <div className="w-full max-w-lg">

        <Link to="/" className="flex items-center gap-3 mb-8 justify-center">
          <div className="w-9 h-9 bg-amber-500 rounded-lg flex items-center justify-center logo-pulse">
            <Vote size={18} className="text-slate-900" />
          </div>
          <span className="text-white font-bold text-base">VotingApp</span>
        </Link>

        <div className="bg-slate-800 border border-white/10 rounded-2xl p-8">

          <div className="text-center mb-8">
            <h2 className="text-2xl font-extrabold text-white mb-1 fade1">Créer un compte</h2>
            <p className="text-slate-400 text-sm">Plateforme de Vote en Ligne</p>
          </div>

          {/* Stepper */}
          <div className="flex items-center justify-center mb-8">
            {ETAPES.map((e, i) => (
              <div key={i} className="flex items-center">
                <div className={`flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold transition-all ${
                  i < etape ? 'bg-amber-500 text-slate-900' :
                  i === etape ? 'bg-amber-500 text-slate-900' :
                  'bg-white/10 text-slate-500'
                }`}>
                  {i < etape ? <CheckCircle size={14} /> : i + 1}
                </div>
                {i < ETAPES.length - 1 && (
                  <div className={`w-12 h-0.5 mx-1 transition-all ${i < etape ? 'bg-amber-500' : 'bg-white/10'}`} />
                )}
              </div>
            ))}
          </div>

          {erreur && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl p-3 mb-5 text-sm flex gap-2">
              <div className="w-1 bg-red-500 rounded-full flex-shrink-0" /> {erreur}
            </div>
          )}

          {/* Étape 1 */}
          {etape === 0 && (
            <form onSubmit={handlePreInscription} className="flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 text-xs mb-1.5 block">Prénom</label>
                  <div className="relative">
                    <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input placeholder="Prénom" value={form.prenom}
                      onChange={e => setForm({...form, prenom: e.target.value})}
                      className="w-full pl-9 pr-3 py-3 rounded-xl text-sm text-white outline-none border border-white/10 bg-white/5 placeholder-slate-600" required />
                  </div>
                </div>
                <div>
                  <label className="text-slate-400 text-xs mb-1.5 block">Nom</label>
                  <div className="relative">
                    <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input placeholder="Nom" value={form.nom}
                      onChange={e => setForm({...form, nom: e.target.value})}
                      className="w-full pl-9 pr-3 py-3 rounded-xl text-sm text-white outline-none border border-white/10 bg-white/5 placeholder-slate-600" required />
                  </div>
                </div>
              </div>

              <div>
                <label className="text-slate-400 text-xs mb-1.5 block">Matricule</label>
                <div className="relative">
                  <Hash size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input placeholder="CM-UDS-24IUT0001" value={form.matricule}
                    onChange={e => { const v = e.target.value; if (v.startsWith('CM-UDS-')) setForm({...form, matricule: v}) }}
                    className="w-full pl-9 pr-3 py-3 rounded-xl text-sm text-white outline-none border border-white/10 bg-white/5 placeholder-slate-600" required />
                </div>
              </div>

              <div>
                <label className="text-slate-400 text-xs mb-1.5 block">Email</label>
                <div className="relative">
                  <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input type="email" placeholder="votre@email.com" value={form.email}
                    onChange={e => setForm({...form, email: e.target.value})}
                    className="w-full pl-9 pr-3 py-3 rounded-xl text-sm text-white outline-none border border-white/10 bg-white/5 placeholder-slate-600" required />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 text-xs mb-1.5 block">Filière</label>
                  <div className="relative">
                    <BookOpen size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                    <select value={form.filiere} onChange={e => setForm({...form, filiere: e.target.value})}
                      className="w-full pl-9 pr-3 py-3 rounded-xl text-sm text-white outline-none border border-white/10 bg-slate-700 appearance-none" required>
                      <option value="">Filière</option>
                      <option>Génie Informatique GI</option>
                      <option>Batiment BAT</option>
                      <option>Mecatronique MKA</option>
                      <option>Genie Electrique GE</option>
                      <option>AII</option>
                      <option>GTR</option>
                      <option>MIP</option>
                      <option>GTEE</option>
                      <option>IBM</option>
                      <option>ESO</option>
                      <option>EEO</option>
                      <option>EHY</option>
                      <option>ITE</option>
                      <option>BIO</option>
                      <option>GEA</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="text-slate-400 text-xs mb-1.5 block">Niveau</label>
                  <div className="relative">
                    <GraduationCap size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                    <select value={form.niveau} onChange={e => setForm({...form, niveau: e.target.value})}
                      className="w-full pl-9 pr-3 py-3 rounded-xl text-sm text-white outline-none border border-white/10 bg-slate-700 appearance-none" required>
                      <option value="">Niveau</option>
                      <option>Licence 1</option>
                      <option>Licence 2</option>
                      <option>Licence 3</option>
                      <option>Licence 4</option>
                      <option>Licence 5</option>
                    </select>
                  </div>
                </div>
              </div>

              <div>
                <label className="text-slate-400 text-xs mb-1.5 block">Mot de passe</label>
                <div className="relative">
                  <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input type={showPwd ? 'text' : 'password'} placeholder="Min. 8 caractères"
                    value={form.mot_de_passe} onChange={e => setForm({...form, mot_de_passe: e.target.value})}
                    className="w-full pl-9 pr-10 py-3 rounded-xl text-sm text-white outline-none border border-white/10 bg-white/5 placeholder-slate-600" required />
                  <button type="button" onClick={() => setShowPwd(!showPwd)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
                    {showPwd ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
                {form.mot_de_passe && (() => {
                  const s = getPasswordStrength(form.mot_de_passe)
                  return (
                    <div className="mt-2">
                      <div className="flex gap-1 mb-1">
                        {[1,2,3,4,5].map(i => (
                          <div key={i} className="flex-1 h-1 rounded-full transition-all duration-300"
                            style={{ background: i <= s.score ? s.color : '#334155' }} />
                        ))}
                      </div>
                      <p className="text-xs" style={{ color: s.color }}>{s.label}</p>
                    </div>
                  )
                })()}
              </div>

              <div>
                <label className="text-slate-400 text-xs mb-1.5 block">Confirmer le mot de passe</label>
                <div className="relative">
                  <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input type={showPwd2 ? 'text' : 'password'} placeholder="Répétez le mot de passe"
                    value={form.mot_de_passe_confirm} onChange={e => setForm({...form, mot_de_passe_confirm: e.target.value})}
                    className="w-full pl-9 pr-10 py-3 rounded-xl text-sm text-white outline-none border border-white/10 bg-white/5 placeholder-slate-600" required />
                  <button type="button" onClick={() => setShowPwd2(!showPwd2)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
                    {showPwd2 ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>

              <button type="submit" disabled={loading}
                className="w-full bg-amber-500 text-slate-900 py-3.5 rounded-xl font-bold text-sm hover:bg-amber-400 transition-all flex items-center justify-center gap-2 mt-2">
                {loading
                  ? <div className="w-5 h-5 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
                  : <><span>Continuer</span><ArrowRight size={16} /></>}
              </button>
            </form>
          )}

          {/* Étape 2 — OTP */}
          {etape === 1 && (
            <div className="text-center flex flex-col items-center gap-5">
              <div className="w-16 h-16 bg-amber-500/15 rounded-full flex items-center justify-center">
                <Mail size={28} className="text-amber-500" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white mb-1">Vérifiez votre email</h3>
                <p className="text-slate-400 text-sm">
                  Code envoyé à <span className="text-amber-500 font-medium">{email}</span>
                </p>
              </div>
              <div className="flex justify-center gap-2">
                {otp.map((digit, i) => (
                  <input key={i} id={`otp-${i}`} type="text" maxLength={1} value={digit}
                    onChange={e => handleOtpChange(i, e.target.value)}
                    className="w-11 h-12 text-center text-xl font-bold text-white bg-white/5 border border-white/10 rounded-xl outline-none focus:border-amber-500 transition-colors" />
                ))}
              </div>
              <button onClick={handleFinaliserInscription} disabled={loading}
                className="w-full bg-amber-500 text-slate-900 py-3.5 rounded-xl font-bold text-sm hover:bg-amber-400 transition-all flex items-center justify-center gap-2">
                {loading
                  ? <div className="w-5 h-5 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
                  : 'Vérifier le code'}
              </button>
              <div className="flex gap-4">
                <button onClick={renvoierOTP} className="text-slate-500 text-sm hover:text-amber-500 transition-colors">
                  Renvoyer le code
                </button>
                <button onClick={() => { setEtape(0); setErreur('') }}
                  className="text-slate-500 text-sm hover:text-white transition-colors flex items-center gap-1">
                  <ArrowLeft size={14} /> Retour
                </button>
              </div>
            </div>
          )}

          {/* Étape 3 — Empreinte + création compte */}
          {etape === 2 && (
            <div className="flex flex-col items-center gap-5">
              <div className={`w-24 h-24 rounded-full flex items-center justify-center transition-all ${
                empreinteOk ? 'bg-emerald-500/15' : 'bg-amber-500/15'
              }`}>
                {empreinteOk
                  ? <CheckCircle size={48} className="text-emerald-500" />
                  : <Fingerprint size={48} className="text-amber-500" />
                }
              </div>
              <div className="text-center">
                <h3 className="text-lg font-bold text-white mb-1">
                  {empreinteOk ? 'Inscription complète !' : 'Dernière étape'}
                </h3>
                <p className="text-slate-400 text-sm">
                  {empreinteOk
                    ? 'Votre compte a été créé avec succès.'
                    : 'Enregistrez votre empreinte pour finaliser votre inscription. Votre compte sera créé à ce moment.'}
                </p>
              </div>

              <div className="w-full bg-blue-500/10 border border-blue-500/20 rounded-xl p-3 text-blue-400 text-xs text-center">
                💡 Votre compte ne sera créé qu'après l'enregistrement de l'empreinte
              </div>

              {!empreinteOk ? (
                <button type="button" onClick={enregistrerEmpreinte} disabled={loading}
                  className="w-full bg-amber-500 text-slate-900 py-3.5 rounded-xl font-bold text-sm hover:bg-amber-400 transition-all flex items-center justify-center gap-3">
                  {loading
                    ? <div className="w-5 h-5 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
                    : <><Fingerprint size={18} /> Enregistrer mon empreinte</>}
                </button>
              ) : (
                <button onClick={terminerInscription}
                  className="w-full bg-emerald-600 text-white py-3.5 rounded-xl font-bold text-sm hover:bg-emerald-500 transition-all flex items-center justify-center gap-2">
                  <CheckCircle size={18} /> Se connecter
                </button>
              )}
            </div>
          )}

          <p className="text-center text-slate-500 text-sm mt-6">
            Déjà un compte ?{' '}
            <Link to="/connexion" className="text-amber-500 font-semibold hover:text-amber-400">
              Se connecter
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default Inscription
