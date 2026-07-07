import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { electionAPI, candidatureAPI } from '../../services/api'
import { FileText, ArrowLeft, CheckCircle, Send, Camera, XCircle, AlertTriangle, Vote, Clock, User } from 'lucide-react'
import toast from 'react-hot-toast'

const PageCandidature = () => {
  useEffect(() => { document.title = 'VotingApp - Candidature'; }, []);

  const { user }                        = useAuth()
  const [election, setElection]         = useState(null)
  const [candidature, setCandidature]   = useState(null)
  const [programme, setProgramme]       = useState('')
  const [photo, setPhoto]               = useState(null)
  const [photoPreview, setPhotoPreview] = useState(null)
  const [loading, setLoading]           = useState(true)
  const [submitting, setSubmitting]     = useState(false)
  const [showRetrait, setShowRetrait]   = useState(false)
  const [motifRetrait, setMotifRetrait] = useState('')
  const navigate                        = useNavigate()

  useEffect(() => { chargerDonnees() }, [])

  const chargerDonnees = async () => {
    try {
      const { data: elections } = await electionAPI.liste()
      const active = elections.find(e => ['PLANIFIEE', 'EN_COURS'].includes(e.statut))
      if (active) {
        setElection(active)
        const { data: cands } = await candidatureAPI.liste(active.id)
        const maCand = cands.find(c => c.etudiant_nom === `${user?.prenom} ${user?.nom}`)
        if (maCand) { setCandidature(maCand); setProgramme(maCand.programme || '') }
      }
    } catch { toast.error('Erreur de chargement.') }
    finally { setLoading(false) }
  }

  const handlePhotoChange = (e) => {
    const file = e.target.files[0]
    if (file) { setPhoto(file); setPhotoPreview(URL.createObjectURL(file)) }
  }

  const handleSoumettre = async (e) => {
    e.preventDefault()
    if (!election) { toast.error('Aucune élection active.'); return }
    setSubmitting(true)
    try {
      const formData = new FormData()
      formData.append('election', election.id)
      formData.append('programme', programme)
      if (photo) formData.append('photo_campagne', photo)
      await candidatureAPI.soumettreFormData(formData)
      toast.success('Candidature soumise avec succès !')
      chargerDonnees()
    } catch (err) { toast.error(err.response?.data?.erreur || 'Erreur lors de la soumission.') }
    finally { setSubmitting(false) }
  }

  const handleDemanderRetrait = async () => {
    if (!motifRetrait.trim()) { toast.error('Veuillez indiquer un motif.'); return }
    try {
      await candidatureAPI.demanderRetrait(candidature.id, { motif_retrait: motifRetrait })
      toast.success('Demande de retrait envoyée.')
      setShowRetrait(false)
      chargerDonnees()
    } catch (err) { toast.error(err.response?.data?.erreur || 'Erreur.') }
  }

  const statutConfig = {
    EN_ATTENTE:      { color: 'bg-amber-500/15 text-amber-400 border-amber-500/20',   msg: '⏳ Votre candidature est en cours d\'examen.' },
    VALIDEE:         { color: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20', msg: '✅ Candidature validée ! Vous apparaissez dans la liste.' },
    REJETEE:         { color: 'bg-red-500/15 text-red-400 border-red-500/20',         msg: '❌ Candidature rejetée.' },
    RETRAIT_DEMANDE: { color: 'bg-orange-500/15 text-orange-400 border-orange-500/20', msg: '⏳ Demande de retrait en attente.' },
    RETIREE:         { color: 'bg-slate-500/15 text-slate-400 border-slate-500/20',   msg: 'Candidature retirée.' },
  }

  if (loading) return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center">
      <div className="w-10 h-10 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="min-h-screen bg-slate-900">

      {/* Header */}
      <header className="bg-slate-950 border-b border-white/5 px-4 sm:px-6 h-14 flex items-center gap-3">
        <button onClick={() => navigate('/etudiant/dashboard')}
          className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all">
          <ArrowLeft size={16} />
        </button>
        <div className="flex items-center gap-2">
          <div className="w-1 h-5 bg-amber-500 rounded-full" />
          <div>
            <h1 className="text-white font-bold text-sm">Ma Candidature</h1>
            <p className="text-slate-500 text-xs">{election?.titre || 'Aucune élection active'}</p>
          </div>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6">

        {candidature ? (
          <div className="flex flex-col gap-5">

            {/* Statut */}
            <div className={`border rounded-xl p-5 ${statutConfig[candidature.statut]?.color}`}>
              <div className="flex items-center gap-3 mb-3">
                <CheckCircle size={20} />
                <p className="font-bold">Candidature {candidature.statut.replace('_', ' ')}</p>
              </div>
              <p className="text-sm opacity-80">{statutConfig[candidature.statut]?.msg}</p>
              {candidature.statut === 'REJETEE' && candidature.motif_rejet && (
                <p className="text-sm mt-2 opacity-70">Motif : {candidature.motif_rejet}</p>
              )}
              <p className="text-xs mt-2 opacity-50">
                Soumise le {new Date(candidature.date_soumission).toLocaleDateString('fr-FR')}
              </p>
            </div>

            {/* Photo + Programme */}
            <div className="bg-slate-800 border border-white/5 rounded-xl overflow-hidden">
              {candidature.candidat_photo && (
                <img src={candidature.candidat_photo} alt="Photo campagne"
                  className="w-full h-48 object-cover" />
              )}
              <div className="p-5">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-1 h-5 bg-amber-500 rounded-full" />
                  <h3 className="text-white font-bold text-sm">Programme Électoral</h3>
                </div>
                <p className="text-slate-300 text-sm leading-relaxed">
                  {candidature.programme || 'Aucun programme défini.'}
                </p>
              </div>
            </div>

            {/* Bouton retrait */}
            {['EN_ATTENTE', 'VALIDEE'].includes(candidature.statut) && (
              <button onClick={() => setShowRetrait(true)}
                className="w-full flex items-center justify-center gap-2 py-3 bg-red-500/10 text-red-400 rounded-xl border border-red-500/20 hover:bg-red-500/20 transition-all text-sm font-medium">
                <XCircle size={16} /> Demander le retrait
              </button>
            )}
          </div>

        ) : (
          <div className="bg-slate-800 border border-white/5 rounded-xl p-6">

            {/* Titre */}
            <div className="text-center mb-6">
              <div className="w-14 h-14 bg-amber-500/15 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <FileText size={26} className="text-amber-500" />
              </div>
              <h2 className="text-xl font-bold text-white mb-1">Déposer ma candidature</h2>
              <p className="text-slate-400 text-sm">
                {election ? `Pour : ${election.titre}` : 'Aucune élection disponible.'}
              </p>
            </div>

            {!election ? (
              <div className="text-center py-6">
                <Clock size={32} className="text-slate-600 mx-auto mb-3" />
                <p className="text-slate-400 text-sm">Aucune élection ouverte aux candidatures.</p>
              </div>
            ) : (
              <form onSubmit={handleSoumettre} className="flex flex-col gap-5">

                {/* Identité candidat */}
                <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 flex items-center gap-3">
                  <div className="w-10 h-10 bg-amber-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <User size={18} className="text-amber-500" />
                  </div>
                  <div>
                    <p className="text-amber-400 text-xs font-semibold mb-0.5">Candidat</p>
                    <p className="text-white font-bold text-sm">{user?.prenom} {user?.nom}</p>
                    <p className="text-slate-400 text-xs">{user?.profil?.filiere} — {user?.profil?.niveau}</p>
                  </div>
                </div>

                {/* Photo */}
                <div>
                  <label className="text-slate-400 text-xs font-medium mb-2 flex items-center gap-1.5">
                    <Camera size={13} /> Photo de campagne (optionnelle)
                  </label>
                  {photoPreview && (
                    <img src={photoPreview} alt="Aperçu"
                      className="w-24 h-24 rounded-xl object-cover border border-white/10 mb-3" />
                  )}
                  <input type="file" accept="image/*" onChange={handlePhotoChange}
                    className="w-full text-xs text-slate-400
                               file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0
                               file:text-xs file:font-medium file:bg-amber-500/15
                               file:text-amber-400 hover:file:bg-amber-500/25 cursor-pointer" />
                </div>

                {/* Programme */}
                <div>
                  <label className="text-slate-400 text-xs font-medium mb-2 block">
                    Programme électoral <span className="text-red-400">*</span>
                  </label>
                  <textarea value={programme} onChange={e => setProgramme(e.target.value)}
                    placeholder="Décrivez votre programme électoral..."
                    className="w-full px-4 py-3 rounded-xl text-sm text-white bg-white/5 border border-white/10 outline-none resize-none h-40 placeholder-slate-600 focus:border-amber-500/50 transition-colors"
                    required />
                  <p className="text-slate-600 text-xs mt-1">{programme.length} caractères</p>
                </div>

                <button type="submit" disabled={submitting}
                  className="w-full bg-amber-500 text-slate-900 py-3.5 rounded-xl font-bold text-sm hover:bg-amber-400 transition-all flex items-center justify-center gap-2">
                  {submitting
                    ? <div className="w-5 h-5 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
                    : <><Send size={16} /> Soumettre ma candidature</>}
                </button>
              </form>
            )}
          </div>
        )}
      </div>

      {/* Modal retrait */}
      {showRetrait && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 border border-white/10 rounded-2xl w-full max-w-md p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-red-500/15 rounded-xl flex items-center justify-center">
                <AlertTriangle size={18} className="text-red-400" />
              </div>
              <div>
                <h3 className="text-white font-bold">Demande de retrait</h3>
                <p className="text-slate-400 text-xs">Soumise à l'administrateur pour approbation.</p>
              </div>
            </div>
            <textarea value={motifRetrait} onChange={e => setMotifRetrait(e.target.value)}
              placeholder="Expliquez votre motif..."
              className="w-full px-4 py-3 rounded-xl text-sm text-white bg-white/5 border border-white/10 outline-none resize-none h-28 mb-4 placeholder-slate-600" />
            <div className="flex gap-3">
              <button onClick={() => setShowRetrait(false)}
                className="flex-1 py-3 rounded-xl text-slate-300 bg-white/5 border border-white/10 text-sm font-medium">
                Annuler
              </button>
              <button onClick={handleDemanderRetrait}
                className="flex-1 py-3 rounded-xl bg-red-600 text-white text-sm font-bold hover:bg-red-500">
                Envoyer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default PageCandidature
