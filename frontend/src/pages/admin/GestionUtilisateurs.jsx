import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { authAPI } from '../../services/api'
import { Users, ArrowLeft, Search, Edit, Trash2, RotateCcw, CheckCircle, XCircle, AlertTriangle, X } from 'lucide-react'
import toast from 'react-hot-toast'

const GestionUtilisateurs = () => {
  const navigate = useNavigate()
  const [utilisateurs, setUtilisateurs] = useState([])
  const [loading, setLoading]           = useState(true)
  const [recherche, setRecherche]       = useState('')
  const [filtreRole, setFiltreRole]     = useState('')
  const [onglet, setOnglet]             = useState('actifs')
  const [showEdit, setShowEdit]         = useState(false)
  const [userEdit, setUserEdit]         = useState(null)
  const [form, setForm]                 = useState({})
  const [confirmAction, setConfirmAction] = useState(null) // { type, user }

  useEffect(() => { charger() }, [filtreRole])

  const charger = async () => {
    try {
      const { data } = await authAPI.getUtilisateurs(filtreRole)
      setUtilisateurs(data)
    } catch { toast.error('Erreur de chargement.') }
    finally { setLoading(false) }
  }

  const ouvririEdit = (u) => {
    setUserEdit(u)
    setForm({ nom: u.nom, prenom: u.prenom, email: u.email, filiere: u.filiere || '', niveau: u.niveau || '' })
    setShowEdit(true)
  }

  const sauvegarder = async (e) => {
    e.preventDefault()
    try {
      await authAPI.modifierUtilisateur(userEdit.id, form)
      toast.success('Modifié avec succès.')
      setShowEdit(false)
      charger()
    } catch (err) { toast.error(err.response?.data?.erreur || 'Erreur.') }
  }

  const mettreCorbeille = async (id) => {
    try { await authAPI.desactiverUtilisateur(id); toast.success('Compte mis à la corbeille.'); charger() }
    catch { toast.error('Erreur.') }
    finally { setConfirmAction(null) }
  }

  const restaurer = async (id) => {
    try { await authAPI.restaurerUtilisateur(id); toast.success('Compte restauré.'); charger() }
    catch { toast.error('Erreur.') }
  }

  const supprimerDefinitivement = async (id) => {
    try { await authAPI.supprimerDefinitivement(id); toast.success('Supprimé définitivement.'); charger() }
    catch { toast.error('Erreur.') }
    finally { setConfirmAction(null) }
  }

  const actifs    = utilisateurs.filter(u => !u.est_supprime)
  const corbeille = utilisateurs.filter(u => u.est_supprime)
  const filtrer   = (liste) => liste.filter(u =>
    u.matricule.toLowerCase().includes(recherche.toLowerCase()) ||
    u.nom.toLowerCase().includes(recherche.toLowerCase()) ||
    u.prenom.toLowerCase().includes(recherche.toLowerCase())
  )

  const liste = filtrer(onglet === 'actifs' ? actifs : corbeille)

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
            <h1 className="text-slate-700 font-bold text-sm">Gestion des Utilisateurs</h1>
          </div>
        </div>
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text" placeholder="Rechercher..."
            value={recherche} onChange={e => setRecherche(e.target.value)}
            className="pl-9 pr-4 py-2 bg-slate-800 border border-slate-200 rounded-lg text-slate-700 text-sm outline-none placeholder-gray-400 w-48 sm:w-64 focus:border-amber-500/50 transition-colors"
          />
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          {[
            { label: 'Étudiants', value: actifs.filter(u => u.role === 'ETUDIANT').length,  color: '#F0A500' },
            { label: 'Candidats', value: actifs.filter(u => u.role === 'CANDIDAT').length,  color: '#10B981' },
            { label: 'Corbeille', value: corbeille.length,                                  color: '#EF4444' },
          ].map((s, i) => (
            <div key={i} className="bg-white shadow-sm border border-slate-200 rounded-xl p-4 text-center">
              <div className="text-2xl font-extrabold mb-1" style={{ color: s.color }}>{s.value}</div>
              <div className="text-slate-500 text-xs">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Filtres */}
        <div className="flex flex-wrap gap-2 mb-5">
          <button onClick={() => setOnglet('actifs')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              onglet === 'actifs' ? 'bg-amber-500 text-slate-900' : 'bg-slate-800 text-slate-500 hover:bg-slate-800 border border-slate-200'
            }`}>
            Actifs ({actifs.length})
          </button>
          <button onClick={() => setOnglet('corbeille')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              onglet === 'corbeille' ? 'bg-red-500 text-slate-700' : 'bg-slate-800 text-slate-500 hover:bg-slate-800 border border-slate-200'
            }`}>
            <Trash2 size={13} /> Corbeille ({corbeille.length})
          </button>
          {['', 'ETUDIANT', 'CANDIDAT'].map((r, i) => (
            <button key={i} onClick={() => setFiltreRole(r)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                filtreRole === r ? 'bg-blue-600 text-slate-700' : 'bg-slate-800 text-slate-500 hover:bg-slate-800 border border-slate-200'
              }`}>
              {r === '' ? 'Tous' : r === 'ETUDIANT' ? 'Étudiants' : 'Candidats'}
            </button>
          ))}
        </div>

        {/* Tableau */}
        <div className="bg-white shadow-sm border border-slate-200 rounded-xl overflow-hidden">
          {onglet === 'corbeille' && corbeille.length > 0 && (
            <div className="bg-red-500/10 border-b border-red-500/20 px-5 py-3 flex items-center gap-2 text-red-400 text-xs">
              <AlertTriangle size={14} />
              Les comptes en corbeille peuvent être restaurés ou supprimés définitivement.
            </div>
          )}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left px-5 py-3.5 text-slate-400 text-xs font-semibold">Matricule</th>
                  <th className="text-left px-5 py-3.5 text-slate-400 text-xs font-semibold">Nom & Prénom</th>
                  <th className="text-left px-5 py-3.5 text-slate-400 text-xs font-semibold hidden sm:table-cell">Filière / Niveau</th>
                  <th className="text-left px-5 py-3.5 text-slate-400 text-xs font-semibold">Rôle</th>
                  <th className="text-left px-5 py-3.5 text-slate-400 text-xs font-semibold hidden md:table-cell">Statut</th>
                  <th className="text-left px-5 py-3.5 text-slate-400 text-xs font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={6} className="text-center py-12 text-slate-400 text-sm">Chargement...</td></tr>
                ) : liste.length === 0 ? (
                  <tr><td colSpan={6} className="text-center py-12">
                    <Users size={32} className="text-slate-500 mx-auto mb-2" />
                    <p className="text-slate-400 text-sm">{onglet === 'corbeille' ? 'La corbeille est vide' : 'Aucun utilisateur trouvé'}</p>
                  </td></tr>
                ) : liste.map(u => (
                  <tr key={u.id} className="border-t border-slate-200 hover:bg-white shadow-sm transition-colors">
                    <td className="px-5 py-3.5 text-slate-600 text-xs font-mono">{u.matricule}</td>
                    <td className="px-5 py-3.5">
                      <p className="text-slate-700 text-sm font-medium">{u.prenom} {u.nom}</p>
                      <p className="text-slate-400 text-xs">{u.email}</p>
                    </td>
                    <td className="px-5 py-3.5 text-slate-500 text-xs hidden sm:table-cell">
                      {u.filiere ? `${u.filiere} — ${u.niveau}` : '—'}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${
                        u.role === 'CANDIDAT'
                          ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20'
                          : 'bg-amber-500/15 text-amber-400 border-amber-500/20'
                      }`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 hidden md:table-cell">
                      {onglet === 'actifs'
                        ? <span className="flex items-center gap-1 text-emerald-400 text-xs"><CheckCircle size={12} /> Actif</span>
                        : <span className="flex items-center gap-1 text-red-400 text-xs"><XCircle size={12} /> Corbeille</span>
                      }
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex gap-2">
                        {onglet === 'actifs' ? (
                          <>
                            <button onClick={() => ouvririEdit(u)}
                              className="w-7 h-7 flex items-center justify-center bg-slate-8000/15 text-blue-400 rounded-lg hover:bg-slate-8000/25 border border-blue-500/20">
                              <Edit size={12} />
                            </button>
                            <button onClick={() => setConfirmAction({ type: 'corbeille', user: u })}
                              className="w-7 h-7 flex items-center justify-center bg-red-500/15 text-red-400 rounded-lg hover:bg-red-500/25 border border-red-500/20">
                              <Trash2 size={12} />
                            </button>
                          </>
                        ) : (
                          <>
                            <button onClick={() => restaurer(u.id)}
                              className="w-7 h-7 flex items-center justify-center bg-emerald-500/15 text-emerald-400 rounded-lg hover:bg-emerald-500/25 border border-emerald-500/20">
                              <RotateCcw size={12} />
                            </button>
                            <button onClick={() => setConfirmAction({ type: 'definitif', user: u })}
                              className="w-7 h-7 flex items-center justify-center bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 border border-red-500/20">
                              <AlertTriangle size={12} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal Edit */}
      {showEdit && userEdit && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-white shadow-sm border border-slate-200 rounded-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-slate-700 font-bold">Modifier l'utilisateur</h3>
              <button onClick={() => setShowEdit(false)} className="text-slate-500 hover:text-slate-700"><X size={18} /></button>
            </div>
            <form onSubmit={sauvegarder} className="flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-500 text-xs mb-1.5 block">Prénom</label>
                  <input placeholder="Prénom" value={form.prenom}
                    onChange={e => setForm({...form, prenom: e.target.value})}
                    className="w-full px-4 py-3 rounded-xl text-sm text-slate-700 bg-slate-800 border border-slate-200 outline-none placeholder-gray-400" required />
                </div>
                <div>
                  <label className="text-slate-500 text-xs mb-1.5 block">Nom</label>
                  <input placeholder="Nom" value={form.nom}
                    onChange={e => setForm({...form, nom: e.target.value})}
                    className="w-full px-4 py-3 rounded-xl text-sm text-slate-700 bg-slate-800 border border-slate-200 outline-none placeholder-gray-400" required />
                </div>
              </div>
              <div>
                <label className="text-slate-500 text-xs mb-1.5 block">Email</label>
                <input type="email" placeholder="Email" value={form.email}
                  onChange={e => setForm({...form, email: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl text-sm text-slate-700 bg-slate-800 border border-slate-200 outline-none placeholder-gray-400" required />
              </div>
              {userEdit.filiere !== undefined && (
                <>
                  <div>
                    <label className="text-slate-500 text-xs mb-1.5 block">Filière</label>
                    <select value={form.filiere} onChange={e => setForm({...form, filiere: e.target.value})}
                      className="w-full px-4 py-3 rounded-xl text-sm text-slate-700 bg-slate-100 border border-slate-200 outline-none">
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
                  <div>
                    <label className="text-slate-500 text-xs mb-1.5 block">Niveau</label>
                    <select value={form.niveau} onChange={e => setForm({...form, niveau: e.target.value})}
                      className="w-full px-4 py-3 rounded-xl text-sm text-slate-700 bg-slate-100 border border-slate-200 outline-none">
                      <option value="">Niveau</option>
                      <option>Licence 1</option>
                      <option>Licence 2</option>
                      <option>Licence 3</option>
                      <option>Licence 4</option>
                      <option>Licence 5</option>
                    </select>
                  </div>
                </>
              )}
              <div className="flex gap-3 mt-2">
                <button type="button" onClick={() => setShowEdit(false)}
                  className="flex-1 py-3 rounded-xl text-slate-600 bg-slate-800 border border-slate-200 text-sm font-medium">
                  Annuler
                </button>
                <button type="submit"
                  className="flex-1 py-3 rounded-xl bg-amber-500 text-slate-900 text-sm font-bold hover:bg-amber-400">
                  Sauvegarder
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Confirmation Suppression */}
      {confirmAction && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-white shadow-sm border border-slate-200 rounded-2xl w-full max-w-sm p-6 relative">
            <button onClick={() => setConfirmAction(null)}
              className="absolute top-4 right-4 w-7 h-7 flex items-center justify-center rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-800 transition-colors">
              <X size={16} />
            </button>

            <div className="flex flex-col items-center text-center gap-4 pt-2">
              <div className="w-14 h-14 bg-red-500/15 rounded-full flex items-center justify-center">
                <AlertTriangle size={26} className="text-red-400" />
              </div>

              <div>
                <h3 className="text-slate-700 font-bold text-base mb-2">
                  {confirmAction.type === 'corbeille' ? 'Mettre à la corbeille' : 'Suppression définitive'}
                </h3>
                <p className="text-slate-500 text-sm leading-relaxed">
                  {confirmAction.type === 'corbeille' ? (
                    <>Voulez-vous mettre <span className="text-slate-700 font-semibold">{confirmAction.user.prenom} {confirmAction.user.nom}</span> ({confirmAction.user.matricule}) dans la corbeille ?</>
                  ) : (
                    <>Voulez-vous supprimer définitivement <span className="text-slate-700 font-semibold">{confirmAction.user.prenom} {confirmAction.user.nom}</span> ({confirmAction.user.matricule}) ? Cette action est irréversible.</>
                  )}
                </p>
              </div>

              <div className="flex gap-3 w-full mt-2">
                <button onClick={() => setConfirmAction(null)}
                  className="flex-1 py-2.5 rounded-xl text-slate-600 bg-slate-800 border border-slate-200 text-sm font-medium hover:bg-slate-800 transition-colors">
                  Annuler
                </button>
                <button
                  onClick={() => confirmAction.type === 'corbeille'
                    ? mettreCorbeille(confirmAction.user.id)
                    : supprimerDefinitivement(confirmAction.user.id)}
                  className="flex-1 py-2.5 rounded-xl bg-red-500 text-slate-700 text-sm font-bold hover:bg-red-600 transition-colors">
                  {confirmAction.type === 'corbeille' ? 'Mettre à la corbeille' : 'Supprimer'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default GestionUtilisateurs
