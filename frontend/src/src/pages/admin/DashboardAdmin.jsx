import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { electionAPI, candidatureAPI, voteAPI, resultatAPI } from '../../services/api'
import {
  Users, Vote, Trophy, Settings, LogOut, Bell,
  BarChart2, CheckCircle, XCircle, Clock, Plus,
  Play, Square, Eye, FileText, Shield, ChevronRight
} from 'lucide-react'
import toast from 'react-hot-toast'

const DashboardAdmin = () => {
  const { user, deconnexion }               = useAuth()
  const [elections, setElections]           = useState([])
  const [candidatures, setCandidatures]     = useState([])
  const [activeMenu, setActiveMenu]         = useState('dashboard')
  const [loading, setLoading]               = useState(true)
  const [showCreerElection, setShowCreer]   = useState(false)
  const [formElection, setFormElection]     = useState({
    titre: '', description: '',
    date_debut: '', date_fin: '',
    annee_academique: '2025-2026'
  })
  const navigate = useNavigate()

  useEffect(() => { chargerDonnees() }, [])

  const chargerDonnees = async () => {
    try {
      const [{ data: elecs }, { data: cands }] = await Promise.all([
        electionAPI.liste(),
        candidatureAPI.enAttente(),
      ])
      setElections(elecs)
      setCandidatures(cands)
    } catch {
      toast.error('Erreur de chargement.')
    } finally {
      setLoading(false)
    }
  }

  const handleDeconnexion = async () => {
    await deconnexion()
    navigate('/connexion')
  }

  const creerElection = async (e) => {
    e.preventDefault()
    try {
      await electionAPI.creer(formElection)
      toast.success('Élection créée !')
      setShowCreer(false)
      chargerDonnees()
    } catch (err) {
      toast.error(err.response?.data?.erreur || 'Erreur.')
    }
  }

  const ouvrirElection = async (id) => {
    try {
      await electionAPI.ouvrir(id)
      toast.success('Élection ouverte !')
      chargerDonnees()
    } catch (err) {
      toast.error(err.response?.data?.erreur || 'Erreur.')
    }
  }

  const cloturerElection = async (id) => {
    try {
      await electionAPI.cloturer(id)
      toast.success('Élection clôturée !')
      chargerDonnees()
    } catch (err) {
      toast.error(err.response?.data?.erreur || 'Erreur.')
    }
  }

  const publierResultats = async (id) => {
    try {
      await resultatAPI.calculer(id)
      await electionAPI.publier(id)
      toast.success('Résultats publiés !')
      chargerDonnees()
    } catch (err) {
      toast.error(err.response?.data?.erreur || 'Erreur.')
    }
  }

  const validerCandidature = async (id) => {
    try {
      await candidatureAPI.valider(id)
      toast.success('Candidature validée !')
      chargerDonnees()
    } catch (err) {
      toast.error('Erreur.')
    }
  }

  const rejeterCandidature = async (id) => {
    try {
      await candidatureAPI.rejeter(id, { motif_rejet: 'Non conforme aux critères.' })
      toast.success('Candidature rejetée.')
      chargerDonnees()
    } catch (err) {
      toast.error('Erreur.')
    }
  }

  const statutColor = {
    PLANIFIEE:         'bg-blue-100 text-blue-700',
    EN_COURS:          'bg-green-100 text-green-700',
    CLOTUREE:          'bg-gray-100 text-gray-700',
    RESULTATS_PUBLIES: 'bg-purple-100 text-purple-700',
  }

  const menuItems = [
    { id: 'dashboard',    label: 'Tableau de bord', icon: BarChart2 },
    { id: 'elections',    label: 'Élections',        icon: Vote },
    { id: 'candidatures', label: 'Candidatures',     icon: Users },
    { id: 'resultats',    label: 'Résultats',         icon: Trophy },
    { id: 'parametres',   label: 'Paramètres',        icon: Settings },
  ]

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="min-h-screen flex bg-gray-50">

      {/* Sidebar */}
      <div className="w-72 min-h-screen flex flex-col bg-gray-900">
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-purple-600 rounded-xl flex items-center justify-center">
              <Shield size={20} className="text-white" />
            </div>
            <div>
              <p className="text-white font-bold text-sm">Admin Portal</p>
              <p className="text-white/50 text-xs">Vote Délégué</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {menuItems.map(item => (
            <button key={item.id}
              onClick={() => {
                setActiveMenu(item.id)
                if (item.id === 'resultats') navigate('/resultats')
              }}
              className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl transition-all
                ${activeMenu === item.id
                  ? 'bg-purple-600 text-white'
                  : 'text-white/60 hover:bg-white/10 hover:text-white'}`}>
              <item.icon size={20} />
              <span className="text-sm font-medium">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-white/10">
          <div className="flex items-center gap-3 mb-4 px-2">
            <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white text-xs font-bold">
                {user?.prenom?.[0]}{user?.nom?.[0]}
              </span>
            </div>
            <div>
              <p className="text-white text-sm font-medium">{user?.prenom} {user?.nom}</p>
              <p className="text-white/50 text-xs">Administrateur</p>
            </div>
          </div>
          <button onClick={handleDeconnexion}
            className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-red-400 hover:bg-red-500/10 transition-all">
            <LogOut size={20} />
            <span className="text-sm">Déconnexion</span>
          </button>
        </div>
      </div>

      {/* Contenu */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* Header */}
        <div className="bg-white shadow-sm px-8 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-orange-500">Admin Portal Dashboard</h1>
            <p className="text-gray-500 text-sm">Gestion de la plateforme de vote</p>
          </div>
          <div className="flex items-center gap-3">
            <button className="relative p-2 hover:bg-gray-100 rounded-xl">
              <Bell size={20} className="text-gray-600" />
              {candidatures.length > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 rounded-full text-white text-xs flex items-center justify-center">
                  {candidatures.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setShowCreer(true)}
              className="btn-primary flex items-center gap-2 text-sm py-2">
              <Plus size={16} /> Nouvelle élection
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-8">

          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
            {[
              { label: 'ÉLECTIONS',     value: elections.length,                                          color: 'bg-purple-600', icon: Vote },
              { label: 'EN COURS',      value: elections.filter(e => e.statut === 'EN_COURS').length,     color: 'bg-green-500',  icon: Play },
              { label: 'CANDIDATURES',  value: candidatures.length,                                       color: 'bg-blue-500',   icon: Users },
              { label: 'RÉSULTATS',     value: elections.filter(e => e.statut === 'RESULTATS_PUBLIES').length, color: 'bg-orange-500', icon: Trophy },
            ].map((stat, i) => (
              <div key={i} className={`${stat.color} rounded-2xl p-5 text-white`}>
                <div className="flex items-center gap-3 mb-2">
                  <stat.icon size={28} className="opacity-80" />
                  <span className="text-4xl font-bold">{stat.value}</span>
                </div>
                <p className="text-white/80 text-sm font-medium">{stat.label}</p>
              </div>
            ))}
          </div>

          {/* Élections */}
          <div className="bg-white rounded-2xl shadow-sm mb-6">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h2 className="font-bold text-gray-800 flex items-center gap-2">
                <Vote size={20} className="text-purple-600" /> Gestion des Élections
              </h2>
            </div>
            <div className="p-6 space-y-4">
              {elections.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <Vote size={40} className="mx-auto mb-2 opacity-50" />
                  <p>Aucune élection. Créez-en une !</p>
                </div>
              ) : elections.map(election => (
                <div key={election.id} className="border border-gray-100 rounded-xl p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-bold text-gray-800">{election.titre}</h3>
                      <p className="text-gray-500 text-sm">{election.annee_academique}</p>
                      <p className="text-gray-400 text-xs mt-1">
                        Du {new Date(election.date_debut).toLocaleDateString('fr-FR')} au {new Date(election.date_fin).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${statutColor[election.statut]}`}>
                      {election.statut.replace('_', ' ')}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {election.statut === 'PLANIFIEE' && (
                      <button onClick={() => ouvrirElection(election.id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-green-50 text-green-700 rounded-lg text-sm hover:bg-green-100">
                        <Play size={14} /> Ouvrir
                      </button>
                    )}
                    {election.statut === 'EN_COURS' && (
                      <button onClick={() => cloturerElection(election.id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-700 rounded-lg text-sm hover:bg-red-100">
                        <Square size={14} /> Clôturer
                      </button>
                    )}
                    {election.statut === 'CLOTUREE' && (
                      <button onClick={() => publierResultats(election.id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-50 text-purple-700 rounded-lg text-sm hover:bg-purple-100">
                        <Eye size={14} /> Publier résultats
                      </button>
                    )}
                    {election.statut === 'RESULTATS_PUBLIES' && (
                      <button onClick={() => navigate('/resultats')}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-sm hover:bg-blue-100">
                        <BarChart2 size={14} /> Voir résultats
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Candidatures en attente */}
          <div className="bg-white rounded-2xl shadow-sm">
            <div className="p-6 border-b border-gray-100">
              <h2 className="font-bold text-gray-800 flex items-center gap-2">
                <Users size={20} className="text-purple-600" />
                Candidatures en attente
                {candidatures.length > 0 && (
                  <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                    {candidatures.length}
                  </span>
                )}
              </h2>
            </div>
            <div className="p-6 space-y-3">
              {candidatures.length === 0 ? (
                <div className="text-center py-6 text-gray-400">
                  <CheckCircle size={36} className="mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Aucune candidature en attente</p>
                </div>
              ) : candidatures.map(cand => (
                <div key={cand.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                  <div>
                    <p className="font-semibold text-gray-800">{cand.etudiant_nom}</p>
                    <p className="text-gray-500 text-sm">{cand.etudiant_filiere}</p>
                    <p className="text-gray-400 text-xs mt-1 line-clamp-1">{cand.programme}</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => validerCandidature(cand.id)}
                      className="flex items-center gap-1 px-3 py-1.5 bg-green-50 text-green-700 rounded-lg text-sm hover:bg-green-100">
                      <CheckCircle size={14} /> Valider
                    </button>
                    <button onClick={() => rejeterCandidature(cand.id)}
                      className="flex items-center gap-1 px-3 py-1.5 bg-red-50 text-red-700 rounded-lg text-sm hover:bg-red-100">
                      <XCircle size={14} /> Rejeter
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Modal Créer Élection */}
      {showCreerElection && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-5">Créer une élection</h3>
            <form onSubmit={creerElection} className="space-y-4">
              <input placeholder="Titre de l'élection" value={formElection.titre}
                onChange={e => setFormElection({...formElection, titre: e.target.value})}
                className="input-field" required />
              <textarea placeholder="Description" value={formElection.description}
                onChange={e => setFormElection({...formElection, description: e.target.value})}
                className="input-field resize-none h-20" />
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Date début</label>
                  <input type="datetime-local" value={formElection.date_debut}
                    onChange={e => setFormElection({...formElection, date_debut: e.target.value})}
                    className="input-field text-sm" required />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Date fin</label>
                  <input type="datetime-local" value={formElection.date_fin}
                    onChange={e => setFormElection({...formElection, date_fin: e.target.value})}
                    className="input-field text-sm" required />
                </div>
              </div>
              <input placeholder="Année académique" value={formElection.annee_academique}
                onChange={e => setFormElection({...formElection, annee_academique: e.target.value})}
                className="input-field" required />
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowCreer(false)}
                  className="btn-secondary flex-1">Annuler</button>
                <button type="submit" className="btn-primary flex-1">Créer</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default DashboardAdmin