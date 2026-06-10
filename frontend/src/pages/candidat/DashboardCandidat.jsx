import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { electionAPI, candidatureAPI, resultatAPI } from '../../services/api'
import {
  User, Award, BarChart2, FileText, Bell,
  LogOut, Settings, CheckCircle, Clock,
  Edit, Save, Trophy, Vote, Percent
} from 'lucide-react'
import toast from 'react-hot-toast'

const DashboardCandidat = () => {
  const { user, deconnexion }             = useAuth()
  const [activeMenu, setActiveMenu]       = useState('dashboard')
  const [candidature, setCandidature]     = useState(null)
  const [election, setElection]           = useState(null)
  const [resultat, setResultat]           = useState(null)
  const [programme, setProgramme]         = useState('')
  const [editProgramme, setEditProgramme] = useState(false)
  const [loading, setLoading]             = useState(true)
  const [notifications, setNotifications] = useState([])
  const navigate                          = useNavigate()

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
        const maCandidature = cands.find(
          c => c.etudiant_nom === `${user?.prenom} ${user?.nom}`
        )
        if (maCandidature) {
          setCandidature(maCandidature)
          setProgramme(maCandidature.programme || '')
        }
        if (elecActive.statut === 'RESULTATS_PUBLIES') {
          try {
            const { data: res } = await resultatAPI.consulter(elecActive.id)
            const monResultat = res.resultats?.find(
              r => r.candidat_nom === `${user?.prenom} ${user?.nom}`
            )
            setResultat(monResultat)
          } catch {}
        }
      }
      setNotifications([
        { id: 1, type: 'info',    message: 'Votre candidature a été soumise.',    date: 'Aujourd\'hui' },
        { id: 2, type: 'success', message: 'L\'élection est maintenant ouverte.', date: 'Hier' },
      ])
    } catch {
      toast.error('Erreur de chargement.')
    } finally {
      setLoading(false)
    }
  }

  const sauvegarderProgramme = async () => {
    toast.success('Programme mis à jour !')
    setEditProgramme(false)
  }

  const handleDeconnexion = async () => {
    await deconnexion()
    navigate('/connexion')
  }

  const statutColor = {
    EN_ATTENTE:      'bg-yellow-100 text-yellow-700',
    VALIDEE:         'bg-green-100 text-green-700',
    REJETEE:         'bg-red-100 text-red-700',
    RETRAIT_DEMANDE: 'bg-orange-100 text-orange-700',
    RETIREE:         'bg-gray-100 text-gray-700',
  }

  const menuItems = [
    { id: 'dashboard',    label: 'Tableau de bord',  icon: BarChart2 },
    { id: 'profil',       label: 'Mon Profil',         icon: User },
    { id: 'programme',    label: 'Mon Programme',      icon: FileText },
    { id: 'statistiques', label: 'Statistiques',       icon: BarChart2 },
    { id: 'resultats',    label: 'Résultats',          icon: Trophy },
    { id: 'notifications',label: 'Notifications',      icon: Bell },
    { id: 'parametres',   label: 'Paramètres',         icon: Settings },
  ]

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-purple-50">
      <div className="w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="min-h-screen flex bg-gray-50">

      {/* Sidebar */}
      <div className="w-72 min-h-screen flex flex-col"
        style={{ background: 'linear-gradient(180deg, #1e3a5f 0%, #2d5a8e 100%)' }}>
        <div className="p-6 border-b border-white/10 text-center">
          <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3">
            <User size={36} className="text-white" />
          </div>
          <p className="text-white font-bold">{user?.prenom} {user?.nom}</p>
          <p className="text-white/60 text-sm">{user?.profil?.filiere || 'Génie Informatique'}</p>
          <p className="text-white/50 text-xs">{user?.profil?.niveau}</p>
          {candidature && (
            <span className={`inline-block mt-2 px-3 py-1 rounded-full text-xs font-bold
              ${statutColor[candidature.statut] || 'bg-gray-100 text-gray-700'}`}>
              {candidature.statut?.replace('_', ' ')}
            </span>
          )}
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {menuItems.map(item => (
            <button key={item.id} onClick={() => setActiveMenu(item.id)}
              className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl transition-all text-sm
                ${activeMenu === item.id
                  ? 'bg-white/20 text-white font-semibold'
                  : 'text-white/60 hover:bg-white/10 hover:text-white'}`}>
              <item.icon size={18} />
              <span>{item.label}</span>
              {item.id === 'notifications' && notifications.length > 0 && (
                <span className="ml-auto bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                  {notifications.length}
                </span>
              )}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-white/10">
          <button onClick={handleDeconnexion}
            className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-red-400 hover:bg-red-500/10">
            <LogOut size={18} />
            <span className="text-sm">Déconnexion</span>
          </button>
        </div>
      </div>

      {/* Contenu */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* Header */}
        <div className="bg-white shadow-sm px-8 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-800">
              {menuItems.find(m => m.id === activeMenu)?.label}
            </h1>
            <p className="text-gray-500 text-sm">Candidat — {election?.titre || 'Aucune élection'}</p>
          </div>
          <button onClick={() => setActiveMenu('notifications')}
            className="relative p-2 hover:bg-gray-100 rounded-xl">
            <Bell size={20} className="text-gray-600" />
            {notifications.length > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 rounded-full text-white text-xs flex items-center justify-center">
                {notifications.length}
              </span>
            )}
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8">

          {/* DASHBOARD */}
          {activeMenu === 'dashboard' && (
            <div className="space-y-6">
              <div className="rounded-2xl p-6 text-white flex items-center justify-between"
                style={{ background: 'linear-gradient(135deg, #1e3a5f 0%, #2d5a8e 100%)' }}>
                <div>
                  <h2 className="text-2xl font-bold mb-1">Bonjour, {user?.prenom} ! 🎯</h2>
                  <p className="text-white/70">{election ? election.titre : 'Aucune élection active'}</p>
                  {election && (
                    <div className="flex items-center gap-2 mt-2">
                      <div className={`w-2 h-2 rounded-full ${election.statut === 'EN_COURS' ? 'bg-green-400' : 'bg-yellow-400'}`} />
                      <span className="text-white/80 text-sm">{election.statut.replace('_', ' ')}</span>
                    </div>
                  )}
                </div>
                <Award size={64} className="text-white/20" />
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
                {[
                  { label: 'Votes reçus',     value: resultat?.nb_voix ?? '—',                            icon: Vote,    color: 'bg-purple-600' },
                  { label: 'Pourcentage',      value: resultat ? `${resultat.pourcentage}%` : '—',         icon: Percent, color: 'bg-green-500' },
                  { label: 'Statut élection',  value: election?.statut?.replace('_', ' ') || '—',          icon: Clock,   color: 'bg-blue-500' },
                  { label: 'Candidature',      value: candidature?.statut?.replace('_', ' ') || '—',       icon: CheckCircle, color: 'bg-orange-500' },
                ].map((stat, i) => (
                  <div key={i} className={`${stat.color} rounded-2xl p-5 text-white`}>
                    <stat.icon size={24} className="mb-2 opacity-80" />
                    <p className="text-2xl font-bold">{stat.value}</p>
                    <p className="text-white/70 text-sm mt-1">{stat.label}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* PROFIL */}
          {activeMenu === 'profil' && (
            <div className="bg-white rounded-2xl shadow-sm p-6 max-w-lg">
              <h3 className="font-bold text-gray-800 mb-6 flex items-center gap-2">
                <User size={20} className="text-purple-600" /> Mon Profil
              </h3>
              <div className="flex items-center gap-4 mb-6">
                <div className="w-20 h-20 bg-purple-100 rounded-2xl flex items-center justify-center">
                  <User size={36} className="text-purple-600" />
                </div>
                <div>
                  <p className="text-xl font-bold text-gray-800">{user?.prenom} {user?.nom}</p>
                  <p className="text-gray-500">{user?.profil?.filiere}</p>
                </div>
              </div>
              <div className="space-y-3">
                {[
                  { label: 'Matricule', value: user?.matricule },
                  { label: 'Email',     value: user?.email },
                  { label: 'Filière',   value: user?.profil?.filiere },
                  { label: 'Niveau',    value: user?.profil?.niveau },
                ].map((item, i) => (
                  <div key={i} className="flex justify-between py-3 border-b border-gray-100">
                    <span className="text-gray-500 text-sm">{item.label}</span>
                    <span className="font-medium text-gray-800 text-sm">{item.value || '—'}</span>
                  </div>
                ))}
              </div>
              <button className="btn-primary w-full mt-6 flex items-center justify-center gap-2">
                <Edit size={16} /> Modifier le profil
              </button>
            </div>
          )}

          {/* PROGRAMME */}
          {activeMenu === 'programme' && (
            <div className="bg-white rounded-2xl shadow-sm p-6 max-w-2xl">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-bold text-gray-800 flex items-center gap-2">
                  <FileText size={20} className="text-purple-600" /> Mon Programme Électoral
                </h3>
                <button
                  onClick={() => editProgramme ? sauvegarderProgramme() : setEditProgramme(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-purple-50 text-purple-600 rounded-xl text-sm font-medium hover:bg-purple-100">
                  {editProgramme ? <><Save size={16} /> Enregistrer</> : <><Edit size={16} /> Modifier</>}
                </button>
              </div>
              {editProgramme ? (
                <textarea value={programme} onChange={e => setProgramme(e.target.value)}
                  placeholder="Décrivez votre programme électoral..."
                  className="input-field resize-none h-48 text-sm" />
              ) : (
                <div className="bg-gray-50 rounded-xl p-4 min-h-32">
                  {programme ? (
                    <p className="text-gray-700 leading-relaxed">{programme}</p>
                  ) : (
                    <p className="text-gray-400 text-sm text-center mt-8">
                      Aucun programme défini. Cliquez sur "Modifier" pour ajouter votre programme.
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* STATISTIQUES */}
          {activeMenu === 'statistiques' && (
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <h3 className="font-bold text-gray-800 mb-6 flex items-center gap-2">
                <BarChart2 size={20} className="text-purple-600" /> Statistiques des votes
              </h3>
              {resultat ? (
                <>
                  <div className="grid grid-cols-3 gap-4 mb-6">
                    {[
                      { label: 'Votes reçus',  value: resultat.nb_voix,            color: 'text-purple-600' },
                      { label: 'Pourcentage',  value: `${resultat.pourcentage}%`,  color: 'text-green-600' },
                      { label: 'Statut',       value: resultat.est_elu ? 'Élu 🏆' : 'Candidat', color: 'text-blue-600' },
                    ].map((s, i) => (
                      <div key={i} className="bg-gray-50 rounded-xl p-4 text-center">
                        <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                        <p className="text-gray-500 text-sm mt-1">{s.label}</p>
                      </div>
                    ))}
                  </div>
                  <div className="bg-gray-50 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-600">Part des votes</span>
                      <span className="font-bold text-purple-600">{resultat.pourcentage}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-4">
                      <div className="bg-purple-600 h-4 rounded-full transition-all"
                        style={{ width: `${resultat.pourcentage}%` }} />
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center py-8 text-gray-400">
                  <BarChart2 size={40} className="mx-auto mb-2 opacity-50" />
                  <p>Statistiques disponibles après la publication des résultats.</p>
                </div>
              )}
            </div>
          )}

          {/* RESULTATS */}
          {activeMenu === 'resultats' && (
            <div className="space-y-6">
              {resultat ? (
                <>
                  {resultat.est_elu && (
                    <div className="bg-gradient-to-r from-yellow-400 to-orange-400 rounded-2xl p-6 text-white text-center">
                      <Trophy size={48} className="mx-auto mb-3" />
                      <h2 className="text-2xl font-bold">Félicitations ! 🎉</h2>
                      <p className="text-white/80 mt-1">Vous avez été élu(e) délégué(e) de classe !</p>
                    </div>
                  )}
                  <div className="bg-white rounded-2xl shadow-sm p-6">
                    <h3 className="font-bold text-gray-800 mb-4">Mes résultats finaux</h3>
                    <div className="space-y-3">
                      {[
                        { label: 'Votes obtenus', value: resultat.nb_voix },
                        { label: 'Pourcentage',   value: `${resultat.pourcentage}%` },
                        { label: 'Statut final',  value: resultat.est_elu ? '🏆 Élu(e)' : 'Non élu(e)' },
                      ].map((item, i) => (
                        <div key={i} className="flex justify-between py-3 border-b border-gray-100">
                          <span className="text-gray-500">{item.label}</span>
                          <span className="font-bold text-gray-800">{item.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                <div className="bg-white rounded-2xl shadow-sm p-8 text-center">
                  <Trophy size={48} className="text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-bold text-gray-500">Résultats non disponibles</h3>
                  <p className="text-gray-400 mt-2 text-sm">
                    Les résultats seront disponibles après la clôture de l'élection.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* NOTIFICATIONS */}
          {activeMenu === 'notifications' && (
            <div className="space-y-4 max-w-2xl">
              {notifications.map(notif => (
                <div key={notif.id}
                  className={`bg-white rounded-2xl shadow-sm p-5 border-l-4
                    ${notif.type === 'success' ? 'border-green-500' : 'border-blue-500'}`}>
                  <div className="flex items-start gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0
                      ${notif.type === 'success' ? 'bg-green-100' : 'bg-blue-100'}`}>
                      {notif.type === 'success'
                        ? <CheckCircle size={16} className="text-green-600" />
                        : <Bell size={16} className="text-blue-600" />}
                    </div>
                    <div>
                      <p className="text-gray-800 font-medium">{notif.message}</p>
                      <p className="text-gray-400 text-sm mt-1">{notif.date}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* PARAMETRES */}
          {activeMenu === 'parametres' && (
            <div className="bg-white rounded-2xl shadow-sm p-6 max-w-lg">
              <h3 className="font-bold text-gray-800 mb-6 flex items-center gap-2">
                <Settings size={20} className="text-purple-600" /> Paramètres
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between py-3 border-b border-gray-100">
                  <span className="text-gray-700">Notifications email</span>
                  <input type="checkbox" defaultChecked className="w-5 h-5 accent-purple-600" />
                </div>
                <div className="flex items-center justify-between py-3 border-b border-gray-100">
                  <span className="text-gray-700">Langue</span>
                  <select className="input-field w-32 text-sm py-1.5">
                    <option>Français</option>
                    <option>English</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default DashboardCandidat