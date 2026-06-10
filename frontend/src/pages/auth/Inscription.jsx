import { useState, useRef, useCallback } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import Webcam from 'react-webcam'
import { authAPI } from '../../services/api'
import {
  User, Mail, Lock, Eye, EyeOff, Camera, CheckCircle,
  GraduationCap, BookOpen, Hash, ArrowRight, ArrowLeft
} from 'lucide-react'
import toast from 'react-hot-toast'

const ETAPES = ['Informations', 'Vérification Email', 'Capture Visage']

const Inscription = () => {
  const [etape, setEtape]       = useState(0)
  const [loading, setLoading]   = useState(false)
  const [showPwd, setShowPwd]   = useState(false)
  const [showPwd2, setShowPwd2] = useState(false)
  const [erreur, setErreur]     = useState('')
  const [email, setEmail]       = useState('')
  const [otp, setOtp]           = useState(['', '', '', '', '', ''])
  const [visageCapture, setVisageCapture] = useState(null)
  const [webcamReady, setWebcamReady]     = useState(false)
  const webcamRef               = useRef(null)
  const navigate                = useNavigate()

  const [form, setForm] = useState({
    nom: '', prenom: '', matricule: '', email: '',
    filiere: '', niveau: '',annee_academique: '2025-2026',
    mot_de_passe: '', mot_de_passe_confirm: '',
  })

  const handleInscription = async (e) => {
    e.preventDefault()
    setLoading(true)
    setErreur('')
    try {
      await authAPI.inscription(form)
      setEmail(form.email)
      toast.success('Inscription réussie ! Vérifiez votre email.')
      setEtape(1)
    } catch (err) {
      const errors = err.response?.data
      if (errors) {
        const msg = Object.values(errors).flat().join(' ')
        setErreur(msg)
      }
    } finally {
      setLoading(false)
    }
  }

  const handleOTP = async () => {
    const code = otp.join('')
    if (code.length !== 6) { setErreur('Entrez le code à 6 chiffres.'); return }
    setLoading(true)
    setErreur('')
    try {
      await authAPI.verifierOTP({ email, code })
      toast.success('Email vérifié ! Enregistrez votre visage.')
      setEtape(2)
    } catch (err) {
      setErreur(err.response?.data?.erreur || 'Code invalide.')
    } finally {
      setLoading(false)
    }
  }

  const handleOtpChange = (index, value) => {
    if (!/^\d*$/.test(value)) return
    const newOtp = [...otp]
    newOtp[index] = value
    setOtp(newOtp)
    if (value && index < 5) document.getElementById(`otp-${index + 1}`)?.focus()
  }

  const captureVisage = useCallback(() => {
    if (!webcamRef.current) {
      toast.error('Caméra non disponible.')
      return
    }
    const img = webcamRef.current.getScreenshot()
    if (img) {
      setVisageCapture(img)
      setErreur('')
    } else {
      toast.error('Impossible de capturer. Vérifiez votre caméra.')
    }
  }, [webcamRef])

  const handleVisage = async () => {
    if (!visageCapture) return
    setLoading(true)
    setErreur('')
    try {
      const { data: loginData } = await authAPI.connexion({
        matricule: form.matricule,
        mot_de_passe: form.mot_de_passe,
      })
      localStorage.setItem('access_token', loginData.tokens.access)
      localStorage.setItem('refresh_token', loginData.tokens.refresh)
      const base64 = visageCapture.split(',')[1]
      const response = await authAPI.encoderVisage({ image_base64: base64 })
      toast.success('Inscription complète ! Vous pouvez vous connecter.')
      navigate('/connexion')
    } catch (err) {
      const msg = err.response?.data?.erreur || 'Erreur lors de la capture.'
      setErreur(msg)
      setVisageCapture(null)
    } finally {
      setLoading(false)
    }
  }

  const renvoierOTP = async () => {
    try {
      await authAPI.envoyerOTP({ email })
      toast.success('Nouveau code envoyé !')
    } catch { toast.error('Erreur lors de l\'envoi.') }
  }

  return (
    <div className="min-h-screen flex items-center justify-center py-10 px-4"
      style={{ background: 'linear-gradient(135deg, #6d28d9 0%, #7c3aed 50%, #8b5cf6 100%)' }}>
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg p-8">

        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <GraduationCap size={28} className="text-purple-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800">Créer un compte</h2>
          <p className="text-gray-500 text-sm mt-1">Plateforme Vote Délégué — Licence GI</p>
        </div>

        {/* Stepper */}
        <div className="flex items-center justify-center mb-8">
          {ETAPES.map((e, i) => (
            <div key={i} className="flex items-center">
              <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold
                ${i <= etape ? 'bg-purple-600 text-white' : 'bg-gray-200 text-gray-500'}`}>
                {i < etape ? <CheckCircle size={16} /> : i + 1}
              </div>
              {i < ETAPES.length - 1 && (
                <div className={`w-16 h-1 mx-1 rounded ${i < etape ? 'bg-purple-600' : 'bg-gray-200'}`} />
              )}
            </div>
          ))}
        </div>

        {erreur && (
          <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl p-3 mb-5 text-sm">
            {erreur}
          </div>
        )}

        {/* Étape 1 — Formulaire */}
        {etape === 0 && (
          <form onSubmit={handleInscription} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="relative">
                <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-purple-400" />
                <input placeholder="Prénom" value={form.prenom}
                  onChange={e => setForm({...form, prenom: e.target.value})}
                  className="input-field pl-9 text-sm" required />
              </div>
              <div className="relative">
                <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-purple-400" />
                <input placeholder="Nom" value={form.nom}
                  onChange={e => setForm({...form, nom: e.target.value})}
                  className="input-field pl-9 text-sm" required />
              </div>
            </div>
            <div className="relative">
              <Hash size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-purple-400" />
              <input placeholder="CM-UDS-24IUT0001" value={form.matricule}
                onChange={e => setForm({...form, matricule: e.target.value})}
                className="input-field pl-9 text-sm" required />
            </div>
            <div className="relative">
              <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-purple-400" />
              <input type="email" placeholder="Email" value={form.email}
                onChange={e => setForm({...form, email: e.target.value})}
                className="input-field pl-9 text-sm" required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="relative">
                <BookOpen size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-purple-400" />
                <select value={form.filiere}
                  onChange={e => setForm({...form, filiere: e.target.value})}
                  className="input-field pl-9 text-sm" required>
                  <option value="">Filière</option>
                  <option>Génie Informatique</option>
                  <option>Génie Logiciel</option>
                  <option>Réseaux & Télécoms</option>
                </select>
              </div>
              <div className="relative">
                <GraduationCap size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-purple-400" />
                <select value={form.niveau}
                  onChange={e => setForm({...form, niveau: e.target.value})}
                  className="input-field pl-9 text-sm" required>
                  <option value="">Niveau</option>
                  <option>Licence 1</option>
                  <option>Licence 2</option>
                  <option>Licence 3</option>
                </select>
              </div>
            </div>
            <div className="relative">
              <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-purple-400" />
              <input type={showPwd ? 'text' : 'password'} placeholder="Mot de passe"
                value={form.mot_de_passe}
                onChange={e => setForm({...form, mot_de_passe: e.target.value})}
                className="input-field pl-9 pr-9 text-sm" required />
              <button type="button" onClick={() => setShowPwd(!showPwd)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            <div className="relative">
              <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-purple-400" />
              <input type={showPwd2 ? 'text' : 'password'} placeholder="Confirmer le mot de passe"
                value={form.mot_de_passe_confirm}
                onChange={e => setForm({...form, mot_de_passe_confirm: e.target.value})}
                className="input-field pl-9 pr-9 text-sm" required />
              <button type="button" onClick={() => setShowPwd2(!showPwd2)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                {showPwd2 ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            <button type="submit" disabled={loading}
              className="btn-primary w-full flex items-center justify-center gap-2">
              {loading
                ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                : <><span>Continuer</span><ArrowRight size={18} /></>}
            </button>
          </form>
        )}

        {/* Étape 2 — OTP */}
        {etape === 1 && (
          <div className="text-center space-y-6">
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto">
              <Mail size={28} className="text-purple-600" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-800">Vérifiez votre email</h3>
              <p className="text-gray-500 text-sm mt-1">
                Un code à 6 chiffres a été envoyé à<br />
                <span className="font-semibold text-purple-600">{email}</span>
              </p>
            </div>
            <div className="flex justify-center gap-3">
              {otp.map((digit, i) => (
                <input key={i} id={`otp-${i}`} type="text" maxLength={1} value={digit}
                  onChange={e => handleOtpChange(i, e.target.value)}
                  className="w-12 h-12 text-center text-xl font-bold border-2 border-gray-200
                             rounded-xl focus:outline-none focus:border-purple-500 transition-colors" />
              ))}
            </div>
            <button onClick={handleOTP} disabled={loading}
              className="btn-primary w-full flex items-center justify-center gap-2">
              {loading
                ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                : 'Vérifier le code'}
            </button>
            <button onClick={renvoierOTP} className="text-purple-600 text-sm hover:underline">
              Renvoyer le code
            </button>
          </div>
        )}

        {/* Étape 3 — Capture Visage */}
        {etape === 2 && (
          <div className="space-y-5">
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Camera size={28} className="text-purple-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-800">Enregistrer votre visage</h3>
              <p className="text-gray-500 text-sm mt-1">
                Positionnez votre visage dans le cadre, assurez-vous d'être bien éclairé
              </p>
            </div>

            {/* Instructions */}
            <div className="bg-blue-50 rounded-xl p-3 text-sm text-blue-700">
              💡 Conseils : Bonne lumière frontale, visage centré, regardez la caméra
            </div>

            <div className="relative rounded-2xl overflow-hidden bg-gray-900">
              {!visageCapture ? (
                <Webcam
                  ref={webcamRef}
                 screenshotFormat="image/jpeg"
screenshotQuality={0.95}
                  className="w-full rounded-2xl"
                  onUserMedia={() => setWebcamReady(true)}
                  onUserMediaError={() => toast.error('Impossible d\'accéder à la caméra.')}
                  videoConstraints={{
                    facingMode: 'user',
                    width: { ideal: 640 },
                    height: { ideal: 480 },
                  }}
                />
              ) : (
                <img src={visageCapture} alt="capture" className="w-full rounded-2xl" />
              )}
              <div className="absolute inset-0 border-4 border-purple-500/50 rounded-2xl pointer-events-none" />
              {/* Guide visage */}
              {!visageCapture && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-48 h-56 border-4 border-white/60 rounded-full" />
                </div>
              )}
            </div>

            <div className="flex gap-3">
              {visageCapture ? (
                <>
                  <button onClick={() => { setVisageCapture(null); setErreur('') }}
                    className="btn-secondary flex-1 flex items-center justify-center gap-2">
                    <ArrowLeft size={16} /> Reprendre
                  </button>
                  <button onClick={handleVisage} disabled={loading}
                    className="btn-primary flex-1 flex items-center justify-center gap-2">
                    {loading
                      ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      : <><CheckCircle size={16} /> Valider</>}
                  </button>
                </>
              ) : (
                <button onClick={captureVisage} disabled={!webcamReady}
                  className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50">
                  <Camera size={18} /> {webcamReady ? 'Capturer mon visage' : 'Chargement caméra...'}
                </button>
              )}
            </div>
          </div>
        )}

        <p className="text-center text-gray-500 mt-6 text-sm">
          Déjà un compte ?{' '}
          <Link to="/connexion" className="text-purple-600 font-semibold hover:underline">
            Se connecter
          </Link>
        </p>
      </div>
    </div>
  )
}

export default Inscription