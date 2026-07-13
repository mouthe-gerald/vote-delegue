import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { authAPI } from '../../services/api'
import { Users, ArrowLeft, Search, Trash2, Upload, Plus, CheckCircle, XCircle, X, Hash, User, BookOpen, GraduationCap, AlertTriangle } from 'lucide-react'
import toast from 'react-hot-toast'

const GestionEtudiants = () => {
  const navigate = useNavigate()
  const fileRef  = useRef(null)
  const [etudiants, setEtudiants]   = useState([])
  const [loading, setLoading]       = useState(true)
  const [recherche, setRecherche]   = useState('')
  const [showForm, setShowForm]     = useState(false)
  const [importing, setImporting]   = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(null)
  const [form, setForm] = useState({
    matricule: 'CM-UDS-', nom: '', prenom: '', filiere: '', niveau: '', annee_academique: '2025-2026'
  })

  useEffect(() => { charger() }, [])

  const charger = async () => {
    try {
      const { data } = await authAPI.getEtudiantsAutorises()
      setEtudiants(data)
    } catch { toast.error('Erreur de chargement.') }
    finally { setLoading(false) }
  }

  const ajouter = async (e) => {
    e.preventDefault()
    try {
      await authAPI.ajouterEtudiantAutorise(form)
      toast.success('Étudiant ajouté !')
      setShowForm(false)
      setForm({ matricule: 'CM-UDS-', nom: '', prenom: '', filiere: '', niveau: '', annee_academique: '2025-2026' })
      charger()
    } catch (err) { toast.error(err.response?.data?.erreur || 'Erreur.') }
  }

  const supprimer = async (id) => {
    try { await authAPI.supprimerEtudiantAutorise(id); toast.success('Supprimé.'); charger() }
    catch { toast.error('Erreur.') }
    finally { setConfirmDelete(null) }
  }

  const importerExcel = async (e) => {
    const fichier = e.target.files[0]
    if (!fichier) return
    setImporting(true)
    try {
      const formData = new FormData()
      formData.append('fichier', fichier)
      const { data } = await authAPI.importerEtudiants(formData)
      toast.success(data.message)
      charger()
    } catch (err) { toast.error(err.response?.data?.erreur || 'Erreur import.') }
    finally { setImporting(false); e.target.value = '' }
  }

  const filtres = etudiants.filter(e =>
    e.matricule.toLowerCase().includes(recherche.toLowerCase()) ||
    e.nom.toLowerCase().includes(recherche.toLowerCase()) ||
    e.prenom.toLowerCase().includes(recherche.toLowerCase())
  )

  const nbInscrits    = etudiants.filter(e => e.est_inscrit).length
  const nbNonInscrits = etudiants.filter(e => !e.est_inscrit).length

  return (
    <div className="min-h-screen bg-white shadow-sm">

      {/* Header */}
      <header className="bg-slate-800 border-b border-slate-200 px-4 sm:px-6 h-14 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/admin/dashboard')}
            className="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-800 hover:bg-slate-800 text-slate-500 hover:text-slate-700 transition-all">
            <ArrowLeft size={16} />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-1 h-5 bg-amber-500 rounded-full" />
            <h1 className="text-slate-700 font-bold text-sm">Étudiants Autorisés</h1>
          </div>
        </div>
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input type="text" placeholder="Rechercher..."
            value={recherche} onChange={e => setRecherche(e.target.value)}
            className="pl-9 pr-4 py-2 bg-slate-800 border border-slate-200 rounded-lg text-slate-700 text-sm outline-none placeholder-gray-400 w-48 sm:w-64 focus:border-amber-500/50 transition-colors" />
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          {[
            { label: 'Total',       value: etudiants.length, color: '#F0A500' },
            { label: 'Inscrits',    value: nbInscrits,       color: '#10B981' },
            { label: 'Non inscrits', value: nbNonInscrits,   color: '#3B82F6' },
          ].map((s, i) => (
            <div key={i} className="bg-white shadow-sm border border-slate-200 rounded-xl p-4 text-center">
              <div className="text-2xl font-extrabold mb-1" style={{ color: s.color }}>{s.value}</div>
              <div className="text-slate-500 text-xs">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <div>
            <h2 className="text-slate-700 font-bold text-sm">Liste des étudiants autorisés</h2>
            <p className="text-slate-400 text-xs mt-0.5">{etudiants.length} étudiant(s) enregistré(s)</p>
          </div>
          <div className="flex gap-3">
            <input type="file" accept=".xlsx,.xls" ref={fileRef} onChange={importerExcel} className="hidden" />
            <button onClick={() => fileRef.current.click()} disabled={importing}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 rounded-lg text-sm font-medium hover:bg-emerald-500/25 transition-all">
              <Upload size={14} /> {importing ? 'Import...' : 'Importer Excel'}
            </button>
            <button onClick={() => setShowForm(true)}
              className="flex items-center gap-2 px-4 py-2 bg-amber-500 text-slate-900 rounded-lg text-sm font-bold hover:bg-amber-400 transition-all">
              <Plus size={14} /> Ajouter
            </button>
          </div>
        </div>

        {/* Info format Excel */}
        <div className="bg-slate-8000/10 border border-blue-500/20 rounded-xl p-3 mb-5 text-blue-400 text-xs">
          📋 Format Excel : <strong>matricule | nom | prénom | filière | niveau | année académique</strong> (ligne 1 = en-têtes)
        </div>

        {/* Tableau */}
        <div className="bg-white shadow-sm border border-slate-200 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left px-5 py-3.5 text-slate-400 text-xs font-semibold">Matricule</th>
                  <th className="text-left px-5 py-3.5 text-slate-400 text-xs font-semibold">Nom & Prénom</th>
                  <th className="text-left px-5 py-3.5 text-slate-400 text-xs font-semibold hidden sm:table-cell">Filière</th>
                  <th className="text-left px-5 py-3.5 text-slate-400 text-xs font-semibold hidden md:table-cell">Niveau</th>
                  <th className="text-left px-5 py-3.5 text-slate-400 text-xs font-semibold">Statut</th>
                  <th className="text-left px-5 py-3.5 text-slate-400 text-xs font-semibold">Action</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={6} className="text-center py-12 text-slate-400 text-sm">Chargement...</td></tr>
                ) : filtres.length === 0 ? (
                  <tr><td colSpan={6} className="text-center py-12">
                    <Users size={32} className="text-slate-500 mx-auto mb-2" />
                    <p className="text-slate-400 text-sm">Aucun étudiant trouvé</p>
                  </td></tr>
                ) : filtres.map(e => (
                  <tr key={e.id} className="border-t border-slate-200 hover:bg-white shadow-sm transition-colors">
                    <td className="px-5 py-3.5 text-slate-600 text-xs font-mono">{e.matricule}</td>
                    <td className="px-5 py-3.5 text-slate-700 text-sm font-medium">{e.prenom} {e.nom}</td>
                    <td className="px-5 py-3.5 text-slate-500 text-xs hidden sm:table-cell">{e.filiere}</td>
                    <td className="px-5 py-3.5 text-slate-500 text-xs hidden md:table-cell">{e.niveau}</td>
                    <td className="px-5 py-3.5">
                      {e.est_inscrit
                        ? <span className="flex items-center gap-1 text-emerald-400 text-xs"><CheckCircle size={12} /> Inscrit</span>
                        : <span className="flex items-center gap-1 text-slate-400 text-xs"><XCircle size={12} /> Non inscrit</span>
                      }
                    </td>
                    <td className="px-5 py-3.5">
                      <button onClick={() => setConfirmDelete(e)}
                        className="w-7 h-7 flex items-center justify-center bg-red-500/15 text-red-400 rounded-lg hover:bg-red-500/25 border border-red-500/20">
                        <Trash2 size={12} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal ajout */}
      {showForm && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-white shadow-sm border border-slate-200 rounded-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-slate-700 font-bold">Ajouter un étudiant</h3>
              <button onClick={() => setShowForm(false)} className="text-slate-500 hover:text-slate-700"><X size={18} /></button>
            </div>
            <form onSubmit={ajouter} className="flex flex-col gap-4">
              <div>
                <label className="text-slate-500 text-xs mb-1.5 block">Matricule</label>
                <div className="relative">
                  <Hash size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input placeholder="CM-UDS-24IUT0001" value={form.matricule}
                    onChange={e => { const v = e.target.value; if (v.startsWith('CM-UDS-')) setForm({...form, matricule: v}) }}
                    className="w-full pl-9 pr-3 py-3 rounded-xl text-sm text-slate-700 bg-slate-800 border border-slate-200 outline-none placeholder-gray-400" required />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-500 text-xs mb-1.5 block">Prénom</label>
                  <div className="relative">
                    <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input placeholder="Prénom" value={form.prenom}
                      onChange={e => setForm({...form, prenom: e.target.value})}
                      className="w-full pl-9 pr-3 py-3 rounded-xl text-sm text-slate-700 bg-slate-800 border border-slate-200 outline-none placeholder-gray-400" required />
                  </div>
                </div>
                <div>
                  <label className="text-slate-500 text-xs mb-1.5 block">Nom</label>
                  <div className="relative">
                    <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input placeholder="Nom" value={form.nom}
                      onChange={e => setForm({...form, nom: e.target.value})}
                      className="w-full pl-9 pr-3 py-3 rounded-xl text-sm text-slate-700 bg-slate-800 border border-slate-200 outline-none placeholder-gray-400" required />
                  </div>
                </div>
              </div>
              <div>
                <label className="text-slate-500 text-xs mb-1.5 block">Filière</label>
                <div className="relative">
                  <BookOpen size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <select value={form.filiere} onChange={e => setForm({...form, filiere: e.target.value})}
                    className="w-full pl-9 pr-3 py-3 rounded-xl text-sm text-slate-700 bg-slate-100 border border-slate-200 outline-none appearance-none" required>
                    <option value="">Choisir une filière</option>
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
                <label className="text-slate-500 text-xs mb-1.5 block">Niveau</label>
                <div className="relative">
                  <GraduationCap size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <select value={form.niveau} onChange={e => setForm({...form, niveau: e.target.value})}
                    className="w-full pl-9 pr-3 py-3 rounded-xl text-sm text-slate-700 bg-slate-100 border border-slate-200 outline-none appearance-none" required>
                    <option value="">Choisir un niveau</option>
                      <option>Licence 1</option>
                      <option>Licence 2</option>
                      <option>Licence 3</option>
                      <option>Licence 4</option>
                      <option>Licence 5</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-3 mt-2">
                <button type="button" onClick={() => setShowForm(false)}
                  className="flex-1 py-3 rounded-xl text-slate-600 bg-slate-800 border border-slate-200 text-sm font-medium">
                  Annuler
                </button>
                <button type="submit"
                  className="flex-1 py-3 rounded-xl bg-amber-500 text-slate-900 text-sm font-bold hover:bg-amber-400">
                  Ajouter
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Confirmation Suppression */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-white shadow-sm border border-slate-200 rounded-2xl w-full max-w-sm p-6 relative">
            <button onClick={() => setConfirmDelete(null)}
              className="absolute top-4 right-4 w-7 h-7 flex items-center justify-center rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-800 transition-colors">
              <X size={16} />
            </button>

            <div className="flex flex-col items-center text-center gap-4 pt-2">
              <div className="w-14 h-14 bg-red-500/15 rounded-full flex items-center justify-center">
                <AlertTriangle size={26} className="text-red-400" />
              </div>

              <div>
                <h3 className="text-slate-700 font-bold text-base mb-2">Supprimer l'étudiant</h3>
                <p className="text-slate-500 text-sm leading-relaxed">
                  Voulez-vous supprimer <span className="text-slate-700 font-semibold">{confirmDelete.prenom} {confirmDelete.nom}</span> ({confirmDelete.matricule}) de la liste des étudiants autorisés ?
                </p>
              </div>

              <div className="flex gap-3 w-full mt-2">
                <button onClick={() => setConfirmDelete(null)}
                  className="flex-1 py-2.5 rounded-xl text-slate-600 bg-slate-800 border border-slate-200 text-sm font-medium hover:bg-slate-800 transition-colors">
                  Annuler
                </button>
                <button onClick={() => supprimer(confirmDelete.id)}
                  className="flex-1 py-2.5 rounded-xl bg-red-500 text-slate-700 text-sm font-bold hover:bg-red-600 transition-colors">
                  Supprimer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default GestionEtudiants
