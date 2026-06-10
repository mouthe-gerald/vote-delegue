import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import Webcam from 'react-webcam'
import { electionAPI, candidatureAPI, voteAPI, authAPI } from '../../services/api'
import { useAuth } from '../../context/AuthContext'
import {
  Vote, User, CheckCircle, ArrowLeft, Camera, Shield, AlertCircle
} from 'lucide-react'
import toast from 'react-hot-toast'

const PageVote = () => {
  const { user }                          = useAuth()
  const [election, setElection]           = useState(null)
  const [candidats, setCandidats]         = useState([])
  const [selectionne, setSelectionne]     = useState(null)
  const [etape, setEtape]                 = useState('liste')
  const [loading, setLoading]             = useState(true)
  const [submitting, setSubmitting]       = useState(false)
  const [visageCapture, setVisageCapture] = useState(null)
  const [webcamReady, setWebcamReady]     = useState(false)
  const [erreur, setErreur]               = useState('')
  const [txHash, setTxHash]               = useState('')
  const webcamRef                         = useRef(null)
  const navigate                          = useNavigate()

  useEffect(() => { chargerDonnees() }, [])

  const chargerDonnees = async () => {
    try {
      const { data: elections } = await electionAPI.liste()
      const active = elections.find(e => e.statut === 'EN_COURS')
      if (!active) {
        toast.error('Aucune élection en cours.')
        navigate('/etudiant/dashboard')
        return
      }
      setElection(active)
      const { data: droit } = await voteAPI.verifierDroit(active.id)
      if (!droit.peut_voter) {
        toast.error(droit.raison)
        navigate('/etudiant/dashboard')
        return
      }
      const { data: cands } = await candidatureAPI.liste(active.id)
      setCandidats(cands)
    } catch {
      toast.error('Erreur de chargement.')
    } finally {
      setLoading(false)
    }
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
  }, [])

  const handleVoter = async () => {
    if (!visageCapture) { setErreur('Veuillez capturer votre visage.'); return }
    setSubmitting(true)
    setErreur('')
    try {
      const base64 = visageCapture.split(',')[1]
      const { data: faceResult } = await authAPI.verifierVisage({ image_base64: base64 })
      if (!faceResult.identite_confirmee) {
        setErreur('Visage non reconnu. Veuillez reprendre la capture.')
        setVisageCapture(null)
        setSubmitting(false)
        return
      }
      const { data: voteData } = await voteAPI.voter({
        candidat_id: selectionne,
        election_id: election.id
      })
      setTxHash(voteData.transaction_hash || 'Hash généré avec succès')
      setEtape('confirmation')
      toast.success('Vote enregistré avec succès !')
    } catch (err) {
      const msg = err.response?.data?.erreur || 'Erreur lors du vote.'
      setErreur(msg)
      setVisageCapture(null)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-purple-50">
      <div className="w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  if (etape === 'confirmation') return (
    <div className="min-h-screen flex items-center justify-center bg-purple-50 p-4">
      <div className="bg-white rounded-3xl shadow-xl p-8 text-center max-w-lg w-full">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle size={40} className="text-green-500" />
        </div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Vote enregistré !</h2>
        <p className="text-gray-500 mb-6">Votre vote a été sécurisé par la blockchain.</p>

        {/* Blockchain info */}
        <div className="bg-gray-900 rounded-2xl p-5 mb-6 text-left">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
            <span className="text-green-400 text-sm font-semibold">Transaction confirmée</span>
          </div>
          <div className="space-y-2">
            <div>
              <p className="text-gray-500 text-xs mb-1">Hash de transaction</p>
              <p className="text-green-300 font-mono text-xs break-all">{txHash}</p>
            </div>
            <div className="flex justify-between pt-2 border-t border-gray-700">
              <div>
                <p className="text-gray-500 text-xs">Réseau</p>
                <p className="text-white text-xs font-medium">Ethereum Local</p>
              </div>
              <div>
                <p className="text-gray-500 text-xs">Statut</p>
                <p className="text-green-400 text-xs font-medium">✓ Confirmé</p>
              </div>
              <div>
                <p className="text-gray-500 text-xs">Anonymat</p>
                <p className="text-blue-400 text-xs font-medium">✓ Garanti</p>
              </div>
            </div>
          </div>
        </div>

        <button onClick={() => navigate('/etudiant/dashboard')} className="btn-primary w-full">
          Retour au tableau de bord
        </button>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm px-6 py-4 flex items-center gap-4">
        <button onClick={() => navigate('/etudiant/dashboard')}
          className="p-2 hover:bg-gray-100 rounded-xl">
          <ArrowLeft size={20} className="text-gray-600" />
        </button>
        <div>
          <h1 className="font-bold text-gray-800">Vote — {election?.titre}</h1>
          <p className="text-xs text-gray-500">Sélectionnez un candidat et confirmez</p>
        </div>
        <div className="ml-auto flex items-center gap-2 bg-green-50 px-3 py-1.5 rounded-xl">
          <Shield size={16} className="text-green-600" />
          <span className="text-green-600 text-sm font-medium">Sécurisé Blockchain</span>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-6">

        {/* Liste candidats */}
        {etape === 'liste' && (
          <>
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 flex gap-3">
              <AlertCircle size={20} className="text-amber-600 flex-shrink-0 mt-0.5" />
              <p className="text-amber-700 text-sm">
                Sélectionnez <strong>un seul candidat</strong>. Votre vote est définitif et enregistré sur la blockchain.
              </p>
            </div>

            <h2 className="text-lg font-bold text-gray-800 mb-4">
              Liste des candidats — {candidats.length} candidat(s)
            </h2>

            <div className="space-y-4 mb-6">
              {candidats.map((candidat) => (
                <div key={candidat.id}
                  onClick={() => setSelectionne(candidat.id)}
                  className={`bg-white rounded-2xl p-5 cursor-pointer transition-all border-2
                    ${selectionne === candidat.id
                      ? 'border-purple-500 shadow-lg shadow-purple-100'
                      : 'border-transparent shadow hover:shadow-md'}`}>
                  <div className="flex items-center gap-4">
                    <input type="radio" checked={selectionne === candidat.id}
                      onChange={() => setSelectionne(candidat.id)}
                      className="w-5 h-5 accent-purple-600" />
                    <div className="w-16 h-16 bg-purple-100 rounded-xl overflow-hidden flex-shrink-0">
                      {candidat.candidat_photo ? (
                        <img src={candidat.candidat_photo} alt={candidat.etudiant_nom}
                          className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <User size={28} className="text-purple-400" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="bg-purple-100 text-purple-600 text-xs font-bold px-2 py-0.5 rounded-full">
                          N°{candidat.candidat_numero}
                        </span>
                        <h3 className="font-bold text-gray-800">{candidat.etudiant_nom}</h3>
                      </div>
                      <p className="text-gray-500 text-sm">{candidat.etudiant_filiere}</p>
                      {candidat.programme && (
                        <p className="text-gray-600 text-sm mt-2 line-clamp-2">{candidat.programme}</p>
                      )}
                    </div>
                    {selectionne === candidat.id && (
                      <CheckCircle size={24} className="text-purple-600 flex-shrink-0" />
                    )}
                  </div>
                </div>
              ))}
            </div>

            <button disabled={!selectionne} onClick={() => setEtape('verification')}
              className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
              <Vote size={18} /> Confirmer ma sélection
            </button>
          </>
        )}

        {/* Vérification faciale */}
        {etape === 'verification' && (
          <div className="max-w-md mx-auto">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Camera size={28} className="text-purple-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-800">Vérification d'identité</h2>
              <p className="text-gray-500 text-sm mt-1">
                Positionnez votre visage pour confirmer votre identité
              </p>
            </div>

            <div className="bg-blue-50 rounded-xl p-3 mb-4 text-sm text-blue-700">
              💡 Même position qu'à l'inscription — bonne lumière, visage centré
            </div>

            <div className="bg-purple-50 rounded-xl p-4 mb-5 flex items-center gap-3">
              <CheckCircle size={20} className="text-purple-600" />
              <div>
                <p className="text-xs text-purple-600 font-medium">Votre choix</p>
                <p className="font-bold text-gray-800">
                  {candidats.find(c => c.id === selectionne)?.etudiant_nom}
                </p>
              </div>
            </div>

            {erreur && (
              <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl p-3 mb-4 text-sm">
                {erreur}
              </div>
            )}

            <div className="relative rounded-2xl overflow-hidden bg-gray-900 mb-5">
              {!visageCapture ? (
                <Webcam
                  ref={webcamRef}
                  screenshotFormat="image/jpeg"
                  screenshotQuality={0.95}
                  className="w-full"
                  onUserMedia={() => setWebcamReady(true)}
                  videoConstraints={{
                    facingMode: 'user',
                    width: { ideal: 640 },
                    height: { ideal: 480 },
                  }}
                />
              ) : (
                <img src={visageCapture} alt="capture" className="w-full" />
              )}
              <div className="absolute inset-0 border-4 border-purple-500/50 rounded-2xl pointer-events-none" />
              {!visageCapture && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-48 h-56 border-4 border-white/60 rounded-full" />
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <button onClick={() => { setEtape('liste'); setVisageCapture(null); setErreur('') }}
                className="btn-secondary flex-1 flex items-center justify-center gap-2">
                <ArrowLeft size={16} /> Retour
              </button>
              {!visageCapture ? (
                <button onClick={captureVisage} disabled={!webcamReady}
                  className="btn-primary flex-1 flex items-center justify-center gap-2 disabled:opacity-50">
                  <Camera size={16} /> {webcamReady ? 'Capturer' : 'Chargement...'}
                </button>
              ) : (
                <button onClick={handleVoter} disabled={submitting}
                  className="btn-primary flex-1 flex items-center justify-center gap-2">
                  {submitting
                    ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    : <><Vote size={16} /> Voter</>}
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default PageVote