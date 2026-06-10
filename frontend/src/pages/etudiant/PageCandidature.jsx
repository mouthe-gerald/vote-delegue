import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { electionAPI, candidatureAPI } from '../../services/api'
import { FileText, ArrowLeft, CheckCircle, Send, Camera, XCircle, AlertTriangle } from 'lucide-react'
import toast from 'react-hot-toast'

const PageCandidature = () => {
  const { user }                          = useAuth()
  const [election, setElection]           = useState(null)
  const [candidature, setCandidature]     = useState(null)
  const [programme, setProgramme]         = useState('')
  const [photo, setPhoto]                 = useState(null)
  const [photoPreview, setPhotoPreview]   = useState(null)
  const [loading, setLoading]             = useState(true)
  const [submitting, setSubmitting]       = useState(false)
  const [showRetrait, setShowRetrait]     = useState(false)
  const [motifRetrait, setMotifRetrait]   = useState('')
  const navigate                          = useNavigate()

  useEffect(() => { chargerDonnees() }, [])

  const chargerDonnees = async () => {
    try {
      const { data: elections } = await electionAPI.liste()
      const active = elections.find(e =>
        ['PLANIFIEE', 'EN_COURS'].includes(e.statut)
      )
      if (active) {
        setElection(active)
        const { data: cands } = await candidatureAPI.liste(active.id)
        const maCand = cands.find(
          c => c.etudiant_nom === `${user?.prenom} ${user?.nom}`
        )
        if (maCand) {
          setCandidature(maCand)
          setProgramme(maCand.programme || '')
        }
      }
    } catch {
      toast.error('Erreur de chargement.')
    } finally {
      setLoading(false)
    }
  }

  const handlePhotoChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setPhoto(file)
      setPhotoPreview(URL.createObjectURL(file))
    }
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
    } catch (err) {
      toast.error(err.response?.data?.erreur || 'Erreur lors de la soumission.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDemanderRetrait = async () => {
    if (!motifRetrait.trim()) {
      toast.error('Veuillez indiquer un motif de retrait.')
      return
    }
    try {
      await candidatureAPI.demanderRetrait(candidature.id, { motif_retrait: motifRetrait })
      toast.success('Demande de retrait envoyée à l\'administrateur.')
      setShowRetrait(false)
      chargerDonnees()
    } catch (err) {
      toast.error(err.response?.data?.erreur || 'Erreur lors de la demande.')
    }
  }

  const statutColor = {
    EN_ATTENTE:      { bg: 'bg-yellow-50', text: 'text-yellow-700', border: 'border-yellow-200' },
    VALIDEE:         { bg: 'bg-green-50',  text: 'text-green-700',  border: 'border-green-200' },
    REJETEE:         { bg: 'bg-red-50',    text: 'text-red-700',    border: 'border-red-200' },
    RETRAIT_DEMANDE: { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200' },
    RETIREE:         { bg: 'bg-gray-50',   text: 'text-gray-700',   border: 'border-gray-200' },
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-purple-50">
      <div className="w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full animate-spin" />
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
          <h1 className="font-bold text-gray-800">Ma Candidature</h1>
          <p className="text-xs text-gray-500">
            {election ? election.titre : 'Aucune élection active'}
          </p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto p-6">
        {candidature ? (
          <div className="space-y-6">

            {/* Statut candidature */}
            <div className={`border rounded-2xl p-6 ${statutColor[candidature.statut]?.bg} ${statutColor[candidature.statut]?.border}`}>
              <div className="flex items-center gap-4 mb-4">
                {candidature.candidat_photo && (
                  <img src={candidature.candidat_photo} alt="Photo"
                    className="w-16 h-16 rounded-xl object-cover" />
                )}
                <div className="flex items-center gap-3 flex-1">
                  <CheckCircle size={24} className={statutColor[candidature.statut]?.text} />
                  <div>
                    <p className={`font-bold text-lg ${statutColor[candidature.statut]?.text}`}>
                      Candidature {candidature.statut.replace('_', ' ')}
                    </p>
                    <p className="text-gray-500 text-sm">
                      Soumise le {new Date(candidature.date_soumission).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                </div>
              </div>

              {candidature.statut === 'EN_ATTENTE' && (
                <p className="text-yellow-700 text-sm bg-yellow-100 p-3 rounded-xl">
                  ⏳ Votre candidature est en cours d'examen par l'administrateur.
                </p>
              )}
              {candidature.statut === 'VALIDEE' && (
                <p className="text-green-700 text-sm bg-green-100 p-3 rounded-xl">
                  ✅ Votre candidature a été validée ! Vous apparaissez dans la liste des candidats.
                </p>
              )}
              {candidature.statut === 'REJETEE' && (
                <div>
                  <p className="text-red-700 text-sm bg-red-100 p-3 rounded-xl">
                    ❌ Votre candidature a été rejetée.
                  </p>
                  {candidature.motif_rejet && (
                    <p className="text-red-600 text-sm mt-2">Motif : {candidature.motif_rejet}</p>
                  )}
                </div>
              )}
              {candidature.statut === 'RETRAIT_DEMANDE' && (
                <p className="text-orange-700 text-sm bg-orange-100 p-3 rounded-xl">
                  ⏳ Votre demande de retrait est en attente d'approbation.
                </p>
              )}
              {candidature.statut === 'RETIREE' && (
                <p className="text-gray-700 text-sm bg-gray-100 p-3 rounded-xl">
                  Votre candidature a été retirée.
                </p>
              )}
            </div>

            {/* Programme */}
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                <FileText size={20} className="text-purple-600" /> Mon Programme Électoral
              </h3>
              <p className="text-gray-600 leading-relaxed">
                {candidature.programme || 'Aucun programme défini.'}
              </p>
            </div>

            {/* Bouton retrait */}
            {['EN_ATTENTE', 'VALIDEE'].includes(candidature.statut) && (
              <button
                onClick={() => setShowRetrait(true)}
                className="w-full flex items-center justify-center gap-2 py-3 bg-red-50 text-red-600 rounded-xl border border-red-200 hover:bg-red-100 transition-all font-medium">
                <XCircle size={18} /> Demander le retrait de ma candidature
              </button>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <FileText size={28} className="text-purple-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-800">Déposer ma candidature</h2>
              <p className="text-gray-500 text-sm mt-1">
                {election ? `Pour : ${election.titre}` : 'Aucune élection disponible.'}
              </p>
            </div>

            {!election ? (
              <div className="text-center py-4 text-gray-400">
                <p>Aucune élection ouverte aux candidatures.</p>
              </div>
            ) : (
              <form onSubmit={handleSoumettre} className="space-y-5">
                <div className="bg-purple-50 rounded-xl p-4">
                  <p className="text-purple-700 font-medium text-sm mb-1">Candidat</p>
                  <p className="font-bold text-gray-800">{user?.prenom} {user?.nom}</p>
                  <p className="text-gray-500 text-sm">{user?.profil?.filiere} — {user?.profil?.niveau}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Camera size={16} className="inline mr-1 text-purple-600" />
                    Photo de campagne (optionnelle)
                  </label>
                  <div className="flex items-center gap-4">
                    {photoPreview && (
                      <img src={photoPreview} alt="Aperçu"
                        className="w-20 h-20 rounded-xl object-cover border-2 border-purple-200" />
                    )}
                    <input type="file" accept="image/*"
                      onChange={handlePhotoChange}
                      className="w-full text-sm text-gray-500
                                 file:mr-4 file:py-2 file:px-4
                                 file:rounded-xl file:border-0
                                 file:text-sm file:font-medium
                                 file:bg-purple-50 file:text-purple-700
                                 hover:file:bg-purple-100 cursor-pointer" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Programme électoral <span className="text-red-500">*</span>
                  </label>
                  <textarea value={programme} onChange={e => setProgramme(e.target.value)}
                    placeholder="Décrivez votre programme électoral..."
                    className="input-field resize-none h-40 text-sm" required />
                  <p className="text-gray-400 text-xs mt-1">{programme.length} caractères</p>
                </div>

                <button type="submit" disabled={submitting}
                  className="btn-primary w-full flex items-center justify-center gap-2">
                  {submitting
                    ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    : <><Send size={18} /> Soumettre ma candidature</>}
                </button>
              </form>
            )}
          </div>
        )}
      </div>

      {/* Modal retrait */}
      {showRetrait && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
                <AlertTriangle size={20} className="text-red-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-800">Demande de retrait</h3>
            </div>
            <p className="text-gray-500 text-sm mb-4">
              Votre demande sera soumise à l'administrateur pour approbation.
            </p>
            <textarea
              value={motifRetrait}
              onChange={e => setMotifRetrait(e.target.value)}
              placeholder="Expliquez votre motif de retrait..."
              className="input-field resize-none h-28 text-sm mb-4"
            />
            <div className="flex gap-3">
              <button onClick={() => setShowRetrait(false)}
                className="btn-secondary flex-1">Annuler</button>
              <button onClick={handleDemanderRetrait}
                className="flex-1 py-3 bg-red-500 text-white rounded-xl font-semibold hover:bg-red-600">
                Envoyer la demande
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default PageCandidature