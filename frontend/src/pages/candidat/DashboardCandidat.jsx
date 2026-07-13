import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { electionAPI, candidatureAPI, resultatAPI } from '../../services/api'
import {
  User, Award, BarChart2, FileText, LogOut, ArrowLeft,
  CheckCircle, Clock, XCircle, Trophy, Vote,
  Mail, GraduationCap, Hash, Percent, Edit, Save, X
} from 'lucide-react'
import toast from 'react-hot-toast'
import usePageTitle from '../../hooks/usePageTitle'

const DashboardCandidat = () => {
  const { user, deconnexion }             = useAuth()
  const [activeMenu, setActiveMenu]       = useState('dashboard')
  const [candidature, setCandidature]     = useState(null)
  const [election, setElection]           = useState(null)
  const [resultat, setResultat]           = useState(null)
  const [programme, setProgramme]         = useState('')
  const [editProgramme, setEditProgramme] = useState(false)
  const [loading, setLoading]             = useState(true)
  const navigate                          = useNavigate()
  usePageTitle('Espace Candidat')

  useEffect(() => { chargerDonnees() }, [])

  const chargerDonnees = async () => {
    try {
      const { data: elections } = await electionAPI.liste()
      const elecActive = elections.find(e =>
        ['EN_COURS', 'PLANIFIEE', 'CLOTUREE', 'RESULTATS_PUBLIES'].includes(e.statut)
      )
      if (elecActive) {
        setElection(elecActive)
        const { data: cands } = await candidatureAPI.liste(elecActive.id)
        const maCandidature = cands.find(c =>
          c.etudiant_nom === `${user?.prenom} ${user?.nom}` ||
          c.etudiant_matricule === user?.matricule
        )
        if (maCandidature) {
          setCandidature(maCandidature)
          setProgramme(maCandidature.programme || '')
        }
        if (['CLOTUREE', 'RESULTATS_PUBLIES', 'EN_COURS'].includes(elecActive.statut)) {
          try {
            await resultatAPI.calculer(elecActive.id).catch(() => {})
            const { data: res } = await resultatAPI.consulter(elecActive.id)
            const monResultat = res.resultats?.find(r =>
              r.candidat_nom === `${user?.prenom} ${user?.nom}`
            )
            setResultat(monResultat)
          } catch {}
        }
      }
    } catch { toast.error('Erreur de chargement.') }
    finally { setLoading(false) }
  }

  const sauvegarderProgramme = async () => {
    toast.success('Programme mis à jour !')
    setEditProgramme(false)
  }

  const handleDeconnexion = async () => { await deconnexion(); navigate('/connexion') }

  const getStatutBadge = (statut) => {
    switch (statut) {
      case 'VALIDEE':    return { label: 'Validée',    icon: CheckCircle, color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' }
      case 'EN_ATTENTE': return { label: 'En attente', icon: Clock,        color: 'text-amber-400',   bg: 'bg-amber-500/10 border-amber-500/20' }
      case 'REJETEE':    return { label: 'Rejetée',    icon: XCircle,      color: 'text-red-400',     bg: 'bg-red-500/10 border-red-500/20' }
      default:           return { label: statut,       icon: Clock,        color: 'text-gray-500',   bg: 'bg-slate-500/10 border-slate-500/20' }
    }
  }

  const menuItems = [
    { id: 'dashboard',   label: 'Tableau de bord', icon: BarChart2 },
    { id: 'profil',      label: 'Mon Profil',       icon: User },
    { id: 'programme',   label: 'Mon Programme',    icon: FileText },
    { id: 'resultats',   label: 'Mes Résultats',    icon: Trophy },
  ]

  if (loading) return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="w-10 h-10 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  const statutInfo = candidature ? getStatutBadge(candidature.statut) : null

  return (
    <div className="min-h-screen bg-white flex">
      {/* SIDEBAR */}
      <aside className="w-64 bg-blue-50 border-r border-gray-200 flex flex-col fixed h-full z-10">
        {/* Logo */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 bg-amber-500 rounded-lg flex items-center justify-center">
              <Vote size={18} className="text-slate-900" />
            </div>
            <span className="text-gray-800 font-bold">VotingApp</span>
          </div>
          {/* Infos candidat */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-500/20 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-amber-500 font-bold text-sm">
                {user?.prenom?.[0]}{user?.nom?.[0]}
              </span>
            </div>
            <div className="min-w-0">
              <p className="text-gray-800 text-sm font-semibold truncate">{user?.prenom} {user?.nom}</p>
              <p className="text-amber-500 text-xs font-medium">Candidat</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 flex flex-col gap-1">
          {menuItems.map(item => (
            <button key={item.id} onClick={() => setActiveMenu(item.id)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                activeMenu === item.id
                  ? 'bg-amber-500/15 text-amber-400 border border-amber-500/20'
                  : 'text-gray-500 hover:text-gray-800 hover:bg-blue-50'
              }`}>
              <item.icon size={16} />
              {item.label}
            </button>
          ))}
        </nav>

        {/* Retour + Déconnexion */}
        <div className="p-4 border-t border-gray-200 flex flex-col gap-2">
          <button onClick={() => navigate('/etudiant/dashboard')}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-gray-500 hover:text-gray-800 hover:bg-blue-50 transition-all w-full">
            <ArrowLeft size={16} />
            Dashboard étudiant
          </button>
          <button onClick={handleDeconnexion}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-gray-500 hover:text-red-400 hover:bg-red-500/5 transition-all w-full">
            <LogOut size={16} />
            Déconnexion
          </button>
        </div>
      </aside>

      {/* CONTENU PRINCIPAL */}
      <main className="ml-64 flex-1 p-8">

        {/* ── TABLEAU DE BORD ── */}
        {activeMenu === 'dashboard' && (
          <div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">Tableau de bord</h1>
            <p className="text-gray-500 text-sm mb-8">Bienvenue dans votre espace candidat</p>

            {/* Statut candidature */}
            {candidature && statutInfo && (
              <div className={`flex items-center gap-3 px-5 py-4 rounded-xl border mb-6 ${statutInfo.bg}`}>
                <statutInfo.icon size={20} className={statutInfo.color} />
                <div>
                  <p className="text-gray-800 text-sm font-semibold">Candidature {statutInfo.label}</p>
                  <p className="text-gray-500 text-xs">{election?.titre}</p>
                </div>
                <span className={`ml-auto text-xs font-bold px-3 py-1 rounded-full border ${statutInfo.bg} ${statutInfo.color}`}>
                  {statutInfo.label}
                </span>
              </div>
            )}

            {/* Cartes résumé */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
              <div className="bg-white/50 border border-gray-200 rounded-xl p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-9 h-9 bg-amber-500/15 rounded-lg flex items-center justify-center">
                    <Hash size={16} className="text-amber-500" />
                  </div>
                  <span className="text-gray-500 text-sm">Numéro</span>
                </div>
                <p className="text-3xl font-bold text-gray-800">{candidature?.candidat_numero || '—'}</p>
                <p className="text-gray-400 text-xs mt-1">Ordre de candidature</p>
              </div>

              <div className="bg-white/50 border border-gray-200 rounded-xl p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-9 h-9 bg-emerald-500/15 rounded-lg flex items-center justify-center">
                    <Vote size={16} className="text-emerald-500" />
                  </div>
                  <span className="text-gray-500 text-sm">Votes reçus</span>
                </div>
                <p className="text-3xl font-bold text-gray-800">{resultat?.nb_voix ?? '—'}</p>
                <p className="text-gray-400 text-xs mt-1">Total des votes</p>
              </div>

              <div className="bg-white/50 border border-gray-200 rounded-xl p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-9 h-9 bg-blue-500/15 rounded-lg flex items-center justify-center">
                    <Percent size={16} className="text-blue-400" />
                  </div>
                  <span className="text-gray-500 text-sm">Pourcentage</span>
                </div>
                <p className="text-3xl font-bold text-gray-800">
                  {resultat ? `${resultat.pourcentage}%` : '—'}
                </p>
                <p className="text-gray-400 text-xs mt-1">Part des votes</p>
              </div>
            </div>

            {/* Élu ou non */}
            {resultat && (
              <div className={`rounded-xl border p-5 ${
                resultat.est_elu
                  ? 'bg-amber-500/10 border-amber-500/30'
                  : 'bg-white/50 border-gray-200'
              }`}>
                <div className="flex items-center gap-3">
                  <Trophy size={22} className={resultat.est_elu ? 'text-amber-500' : 'text-gray-400'} />
                  <div>
                    <p className="text-gray-800 font-bold">
                      {resultat.est_elu ? '🎉 Vous êtes élu(e) délégué(e) !' : 'Résultats disponibles'}
                    </p>
                    <p className="text-gray-500 text-sm">
                      {resultat.est_elu
                        ? 'Félicitations pour votre élection !'
                        : `Vous avez obtenu ${resultat.nb_voix} voix (${resultat.pourcentage}%)`}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── MON PROFIL ── */}
        {activeMenu === 'profil' && (
          <div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">Mon Profil</h1>
            <p className="text-gray-500 text-sm mb-8">Vos informations personnelles</p>

            <div className="bg-white/50 border border-gray-200 rounded-xl p-6">
              {/* Avatar */}
              <div className="flex items-center gap-5 mb-8 pb-6 border-b border-gray-200">
                {candidature?.candidat_photo
                  ? <img src={candidature.candidat_photo} className="w-20 h-20 rounded-full object-cover border-2 border-amber-500/30" />
                  : (
                    <div className="w-20 h-20 bg-amber-500/20 rounded-full flex items-center justify-center">
                      <span className="text-amber-500 font-bold text-2xl">
                        {user?.prenom?.[0]}{user?.nom?.[0]}
                      </span>
                    </div>
                  )
                }
                <div>
                  <h2 className="text-gray-800 font-bold text-xl">{user?.prenom} {user?.nom}</h2>
                  <p className="text-amber-500 text-sm font-medium">Candidat</p>
                  {candidature?.candidat_numero && (
                    <span className="inline-block mt-1 text-xs bg-amber-500/15 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded-full">
                      N°{candidature.candidat_numero}
                    </span>
                  )}
                </div>
              </div>

              {/* Infos */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { icon: Hash,          label: 'Matricule',  value: user?.matricule },
                  { icon: Mail,          label: 'Email',      value: user?.email },
                  { icon: GraduationCap, label: 'Filière',    value: candidature?.etudiant_filiere || user?.profil?.filiere },
                  { icon: Award,         label: 'Niveau',     value: user?.profil?.niveau },
                ].map((info, i) => (
                  <div key={i} className="bg-blue-500 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-1">
                      <info.icon size={14} className="text-gray-400" />
                      <span className="text-gray-400 text-xs">{info.label}</span>
                    </div>
                    <p className="text-gray-800 text-sm font-medium">{info.value || '—'}</p>
                  </div>
                ))}
              </div>

              {/* Statut candidature */}
              {candidature && statutInfo && (
                <div className={`mt-4 flex items-center gap-3 px-4 py-3 rounded-lg border ${statutInfo.bg}`}>
                  <statutInfo.icon size={16} className={statutInfo.color} />
                  <span className={`text-sm font-medium ${statutInfo.color}`}>
                    Candidature {statutInfo.label}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── MON PROGRAMME ── */}
        {activeMenu === 'programme' && (
          <div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">Mon Programme</h1>
            <p className="text-gray-500 text-sm mb-8">Votre programme électoral</p>

            <div className="bg-white/50 border border-gray-200 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-gray-800 font-semibold">Programme électoral</h2>
                {!editProgramme
                  ? <button onClick={() => setEditProgramme(true)}
                      className="flex items-center gap-2 text-amber-500 text-sm hover:text-amber-400 transition-colors">
                      <Edit size={14} /> Modifier
                    </button>
                  : <div className="flex gap-2">
                      <button onClick={sauvegarderProgramme}
                        className="flex items-center gap-1 bg-amber-500 text-slate-900 text-xs font-bold px-3 py-1.5 rounded-lg hover:bg-amber-400 transition-colors">
                        <Save size={12} /> Sauvegarder
                      </button>
                      <button onClick={() => setEditProgramme(false)}
                        className="flex items-center gap-1 text-gray-500 text-xs px-3 py-1.5 rounded-lg hover:text-gray-800 transition-colors">
                        <X size={12} /> Annuler
                      </button>
                    </div>
                }
              </div>

              {editProgramme
                ? <textarea value={programme} onChange={e => setProgramme(e.target.value)} rows={10}
                    className="w-full bg-blue-500 border border-gray-300 rounded-lg px-4 py-3 text-gray-800 text-sm outline-none focus:border-amber-500/50 resize-none"
                    placeholder="Rédigez votre programme électoral..." />
                : <div className="bg-blue-500 rounded-lg px-4 py-3 min-h-32">
                    {programme
                      ? <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-wrap">{programme}</p>
                      : <p className="text-gray-400 text-sm italic">Aucun programme rédigé. Cliquez sur Modifier pour en ajouter un.</p>
                    }
                  </div>
              }
            </div>
          </div>
        )}

        {/* ── MES RÉSULTATS ── */}
        {activeMenu === 'resultats' && (
          <div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">Mes Résultats</h1>
            <p className="text-gray-500 text-sm mb-8">Vos résultats dans l'élection</p>

            {resultat ? (
              <div className="flex flex-col gap-4">
                {/* Carte principale */}
                <div className={`rounded-xl border p-6 ${
                  resultat.est_elu ? 'bg-amber-500/10 border-amber-500/30' : 'bg-white/50 border-gray-200'
                }`}>
                  <div className="flex items-center gap-4 mb-6">
                    <div className={`w-14 h-14 rounded-full flex items-center justify-center ${
                      resultat.est_elu ? 'bg-amber-500' : 'bg-blue-100'
                    }`}>
                      <Trophy size={24} className={resultat.est_elu ? 'text-slate-900' : 'text-gray-500'} />
                    </div>
                    <div>
                      <h2 className="text-gray-800 font-bold text-lg">
                        {resultat.est_elu ? '🎉 Élu(e) délégué(e) !' : 'Résultats de l\'élection'}
                      </h2>
                      <p className="text-gray-500 text-sm">{election?.titre}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-blue-500 rounded-lg p-4 text-center">
                      <p className="text-3xl font-bold text-gray-800">{resultat.nb_voix}</p>
                      <p className="text-gray-500 text-xs mt-1">Votes reçus</p>
                    </div>
                    <div className="bg-blue-500 rounded-lg p-4 text-center">
                      <p className="text-3xl font-bold text-amber-500">{resultat.pourcentage}%</p>
                      <p className="text-gray-500 text-xs mt-1">Pourcentage</p>
                    </div>
                    <div className="bg-blue-500 rounded-lg p-4 text-center">
                      <p className="text-3xl font-bold text-gray-800">N°{candidature?.candidat_numero}</p>
                      <p className="text-gray-500 text-xs mt-1">Numéro ordre</p>
                    </div>
                  </div>
                </div>

                {/* Barre de progression */}
                <div className="bg-white/50 border border-gray-200 rounded-xl p-5">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-gray-500 text-sm">Part des votes</span>
                    <span className="text-gray-800 font-bold">{resultat.pourcentage}%</span>
                  </div>
                  <div className="w-full bg-blue-100 rounded-full h-3">
                    <div className="bg-amber-500 h-3 rounded-full transition-all duration-500"
                      style={{ width: `${resultat.pourcentage}%` }} />
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white/50 border border-gray-200 rounded-xl p-8 text-center">
                <BarChart2 size={40} className="text-gray-500 mx-auto mb-3" />
                <p className="text-gray-500 text-sm">
                  {election?.statut === 'EN_COURS'
                    ? "L'élection est en cours. Les résultats seront disponibles après la clôture."
                    : "Aucun résultat disponible pour le moment."}
                </p>
              </div>
            )}
          </div>
        )}

      </main>
    </div>
  )
}

export default DashboardCandidat
