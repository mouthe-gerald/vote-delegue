import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { electionAPI, candidatureAPI, voteAPI, authAPI } from '../../services/api'
import { useAuth } from '../../context/AuthContext'
import { Vote, User, CheckCircle, ArrowLeft, Fingerprint, Shield, AlertCircle } from 'lucide-react'
import toast from 'react-hot-toast'

const PageVote = () => {

  const { user }                      = useAuth()
  const [election, setElection]       = useState(null)
  const [candidats, setCandidats]     = useState([])
  const [selectionne, setSelectionne] = useState(null)
  const [etape, setEtape]             = useState('liste')
  const [loading, setLoading]         = useState(true)
  const [submitting, setSubmitting]   = useState(false)
  const [erreur, setErreur]           = useState('')
  const [txHash, setTxHash]           = useState('')
  const navigate                      = useNavigate()

  useEffect(() => { chargerDonnees() }, [])

  const chargerDonnees = async () => {
    try {
      const { data: elections } = await electionAPI.liste()
      const active = elections.find(e => e.statut === 'EN_COURS')
      if (!active) { toast.error('Aucune élection en cours.'); navigate('/etudiant/dashboard'); return }
      setElection(active)
      const { data: droit } = await voteAPI.verifierDroit(active.id)
      if (!droit.peut_voter) { toast.error(droit.raison); navigate('/etudiant/dashboard'); return }
      const { data: cands } = await candidatureAPI.liste(active.id)
      setCandidats(cands)
    } catch { toast.error('Erreur de chargement.') }
    finally { setLoading(false) }
  }

  const verifierEmpreinte = async () => {
    setSubmitting(true)
    setErreur('')
    try {
      const { data: options } = await authAPI.webauthnVerifyBegin()
      const publicKeyOptions = {
        ...options,
        challenge: Uint8Array.from(atob(options.challenge.replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0)),
        allowCredentials: (options.allowCredentials || []).map(c => ({
          ...c,
          id: Uint8Array.from(atob(c.id.replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0)),
        })),
      }
      const credential = await navigator.credentials.get({ publicKey: publicKeyOptions })
      const credentialResponse = {
        id:    credential.id,
        rawId: btoa(String.fromCharCode(...new Uint8Array(credential.rawId))),
        type:  credential.type,
        response: {
          authenticatorData: btoa(String.fromCharCode(...new Uint8Array(credential.response.authenticatorData))),
          clientDataJSON:    btoa(String.fromCharCode(...new Uint8Array(credential.response.clientDataJSON))),
          signature:         btoa(String.fromCharCode(...new Uint8Array(credential.response.signature))),
          userHandle:        credential.response.userHandle
            ? btoa(String.fromCharCode(...new Uint8Array(credential.response.userHandle))) : null,
        },
      }
      const { data: verifyResult } = await authAPI.webauthnVerifyComplete(credentialResponse)
      if (!verifyResult.identite_confirmee) { setErreur('Identité non confirmée.'); setSubmitting(false); return }
      const { data: voteData } = await voteAPI.voter({ candidat_id: selectionne, election_id: election.id })
      setTxHash(voteData.transaction_hash || 'Hash généré')
      setEtape('confirmation')
      toast.success('Vote enregistré !')
    } catch (err) {
      if (err.name === 'NotAllowedError') setErreur('Vérification annulée.')
      else if (err.name === 'NotSupportedError') setErreur('Appareil non supporté.')
      else setErreur(err.response?.data?.erreur || 'Erreur lors de la vérification.')
    } finally { setSubmitting(false) }
  }

  if (loading) return (
    <div className="min-h-screen bg-white shadow-sm flex items-center justify-center">
      <div className="w-10 h-10 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  if (etape === 'confirmation') return (
    <div className="min-h-screen bg-white shadow-sm flex items-center justify-center p-4">
      <div className="bg-white shadow-sm border border-slate-200 rounded-2xl p-8 text-center max-w-lg w-full">
        <div className="w-20 h-20 bg-emerald-500/15 rounded-full flex items-center justify-center mx-auto mb-5">
          <CheckCircle size={40} className="text-emerald-500" />
        </div>
        <h2 className="text-2xl font-bold text-slate-700 mb-2">Vote enregistré !</h2>
        <p className="text-slate-500 text-sm mb-6">Votre vote a été sécurisé par la blockchain.</p>

        <div className="bg-white shadow-sm border border-slate-200 rounded-xl p-5 mb-6 text-left">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
            <span className="text-emerald-400 text-sm font-semibold">Transaction confirmée</span>
          </div>
          <div className="flex flex-col gap-3">
            <div>
              <p className="text-slate-400 text-xs mb-1">Hash de transaction</p>
              <p className="text-amber-400 font-mono text-xs break-all">{txHash}</p>
            </div>
            <div className="flex justify-between pt-3 border-t border-slate-200">
              {[
                { label: 'Réseau',   value: 'Ethereum Local', color: 'text-slate-700' },
                { label: 'Statut',   value: '✓ Confirmé',     color: 'text-emerald-400' },
                { label: 'Anonymat', value: '✓ Garanti',      color: 'text-blue-400' },
              ].map((item, i) => (
                <div key={i}>
                  <p className="text-slate-400 text-xs">{item.label}</p>
                  <p className={`text-xs font-medium ${item.color}`}>{item.value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <button onClick={() => navigate('/etudiant/dashboard')}
          className="w-full bg-amber-500 text-slate-900 py-3 rounded-xl font-bold text-sm hover:bg-amber-400 transition-all">
          Retour au tableau de bord
        </button>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-white shadow-sm">

      {/* Header */}
      <header className="bg-slate-800 border-b border-slate-200 px-4 sm:px-6 h-14 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/etudiant/dashboard')}
            className="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-800 hover:bg-slate-800 text-slate-500 hover:text-slate-700 transition-all">
            <ArrowLeft size={16} />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-1 h-5 bg-amber-500 rounded-full" />
            <div>
              <h1 className="text-slate-700 font-bold text-sm">Vote — {election?.titre}</h1>
              <p className="text-slate-400 text-xs">Sélectionnez un candidat et confirmez</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-lg">
          <Shield size={13} className="text-emerald-400" />
          <span className="text-emerald-400 text-xs font-medium hidden sm:block">Blockchain</span>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6">

        {/* Liste candidats */}
        {etape === 'liste' && (
          <>
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 mb-6 flex gap-3">
              <AlertCircle size={16} className="text-amber-500 flex-shrink-0 mt-0.5" />
              <p className="text-amber-400 text-sm">
                Sélectionnez <strong>un seul candidat</strong>. Votre vote est définitif et enregistré sur la blockchain.
              </p>
            </div>

            <div className="flex items-center gap-2 mb-4">
              <div className="w-1 h-5 bg-amber-500 rounded-full" />
              <h2 className="text-slate-700 font-bold text-sm">
                {candidats.length} candidat(s) — {election?.titre}
              </h2>
            </div>

            <div className="flex flex-col gap-3 mb-6">
              {candidats.map(candidat => (
                <div key={candidat.id} onClick={() => setSelectionne(candidat.id)}
                  className={`bg-white shadow-sm border rounded-xl p-4 cursor-pointer transition-all ${
                    selectionne === candidat.id
                      ? 'border-amber-500/50 bg-amber-500/5'
                      : 'border-slate-200 hover:border-slate-200'
                  }`}>
                  <div className="flex items-center gap-4">
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                      selectionne === candidat.id ? 'border-amber-500 bg-amber-500' : 'border-slate-500'
                    }`}>
                      {selectionne === candidat.id && <div className="w-2 h-2 bg-white shadow-sm rounded-full" />}
                    </div>

                    <div className="w-14 h-14 bg-slate-800 rounded-xl overflow-hidden flex-shrink-0 flex items-center justify-center">
                      {candidat.candidat_photo
                        ? <img src={candidat.candidat_photo} alt={candidat.etudiant_nom} className="w-full h-full object-cover" />
                        : <User size={24} className="text-slate-400" />
                      }
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="bg-amber-500/15 text-amber-400 border border-amber-500/20 text-xs font-bold px-2 py-0.5 rounded-full">
                          N°{candidat.candidat_numero}
                        </span>
                        <h3 className="text-slate-700 font-bold text-sm">{candidat.etudiant_nom}</h3>
                      </div>
                      <p className="text-slate-500 text-xs">{candidat.etudiant_filiere}</p>
                      {candidat.programme && (
                        <p className="text-slate-400 text-xs mt-1.5 line-clamp-2 leading-relaxed">{candidat.programme}</p>
                      )}
                    </div>

                    {selectionne === candidat.id && (
                      <CheckCircle size={20} className="text-amber-500 flex-shrink-0" />
                    )}
                  </div>
                </div>
              ))}
            </div>
            <button disabled={!selectionne} onClick={() => setEtape('verification')}
              className="w-full bg-amber-500 text-slate-900 py-3.5 rounded-xl font-bold text-sm hover:bg-amber-400 transition-all flex items-center justify-center gap-2 disabled:opacity-30 disabled:cursor-not-allowed">
              <Vote size={16} /> Confirmer ma sélection
            </button>
          </>
        )}

        {/* ÉTAPE VÉRIFICATION */}
        {etape === 'verification' && (
          <div className="flex flex-col items-center gap-6 py-6">
            <div className="w-20 h-20 bg-amber-500/15 rounded-full flex items-center justify-center">
              <span className="text-4xl">👆</span>
            </div>
            <div className="text-center">
              <h2 className="text-slate-700 font-bold text-lg mb-2">Vérification biométrique</h2>
              <p className="text-slate-500 text-sm">Placez votre doigt sur le capteur pour confirmer votre vote</p>
            </div>
            {erreur && (
              <div className="w-full bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl p-4 text-sm">
                {erreur}
              </div>
            )}
            <button onClick={verifierEmpreinte}
              className="w-full bg-amber-500 text-slate-900 py-3.5 rounded-xl font-bold text-sm hover:bg-amber-400 transition-all flex items-center justify-center gap-2">
              <span>👆</span> Confirmer avec mon empreinte
            </button>
            <button onClick={() => setEtape('selection')}
              className="text-slate-500 text-sm hover:text-slate-700 transition-colors">
              ← Revenir à la sélection
            </button>
          </div>
        )}

        {/* ÉTAPE SUCCÈS */}
        {etape === 'succes' && (
          <div className="flex flex-col items-center gap-6 py-6 text-center">
            <div className="w-20 h-20 bg-emerald-500/15 rounded-full flex items-center justify-center">
              <CheckCircle size={40} className="text-emerald-500" />
            </div>
            <div>
              <h2 className="text-slate-700 font-bold text-xl mb-2">Vote enregistré !</h2>
              <p className="text-slate-500 text-sm">Votre vote a été enregistré avec succès sur la blockchain.</p>
              {txHash && (
                <div className="mt-4 bg-slate-800 rounded-xl p-3">
                  <p className="text-slate-400 text-xs mb-1">Hash de transaction</p>
                  <p className="text-amber-400 text-xs font-mono break-all">{txHash}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default PageVote
