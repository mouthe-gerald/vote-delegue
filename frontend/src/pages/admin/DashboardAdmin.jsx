import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { electionAPI, candidatureAPI, resultatAPI } from '../../services/api'
import {
  Users, Vote, Trophy, LogOut, Bell, BarChart2,
  CheckCircle, XCircle, Plus, Play, Square, Eye,
  Shield, TrendingUp, Clock, Award, RefreshCw
} from 'lucide-react'
import toast from 'react-hot-toast'

const DashboardAdmin = () => {
  const { user, deconnexion }           = useAuth()
  const [elections, setElections]       = useState([])
  const [candidatures, setCandidatures] = useState([])
  const [loading, setLoading]           = useState(true)
  const [showCreer, setShowCreer]       = useState(false)
  const [formElection, setFormElection] = useState({
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

  const ouvrirElection   = async (id) => { try { await electionAPI.ouvrir(id);   toast.success('Élection ouverte !');   chargerDonnees() } catch (err) { toast.error(err.response?.data?.erreur || 'Erreur.') } }
  const cloturerElection = async (id) => { try { await electionAPI.cloturer(id); toast.success('Élection clôturée !'); chargerDonnees() } catch (err) { toast.error(err.response?.data?.erreur || 'Erreur.') } }
  const publierResultats = async (id) => { try { await resultatAPI.calculer(id); await electionAPI.publier(id); toast.success('Résultats publiés !'); chargerDonnees() } catch (err) { toast.error(err.response?.data?.erreur || 'Erreur.') } }
  const validerCandidature = async (id) => { try { await candidatureAPI.valider(id); toast.success('Validée !'); chargerDonnees() } catch { toast.error('Erreur.') } }
  const rejeterCandidature = async (id) => { try { await candidatureAPI.rejeter(id, { motif_rejet: 'Non conforme.' }); toast.success('Rejetée.'); chargerDonnees() } catch { toast.error('Erreur.') } }

  const statutColor = {
    PLANIFIEE:         { bg: 'bg-blue-100',   text: 'text-blue-700',   dot: 'bg-blue-500' },
    EN_COURS:          { bg: 'bg-green-100',  text: 'text-green-700',  dot: 'bg-green-500' },
    CLOTUREE:          { bg: 'bg-gray-100',   text: 'text-gray-700',   dot: 'bg-gray-500' },
    RESULTATS_PUBLIES: { bg: 'bg-purple-100', text: 'text-purple-700', dot: 'bg-purple-500' },
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center"
      style={{ background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)' }}>
      <div className="text-center text-white">
        <div className="w-16 h-16 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="font-semibold">Chargement...</p>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Navbar */}
      <nav className="shadow-lg px-8 py-4 flex items-center justify-between"
        style={{ background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)' }}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
            <Shield size={22} className="text-white" />
          </div>
          <div>
            <p className="text-white font-bold text-lg">Vote Délégué</p>
            <p className="text-white/60 text-xs">Panneau d'administration</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button className="relative p-2 bg-white/10 rounded-xl hover:bg-white/20">
            <Bell size={20} className="text-white" />
            {candidatures.length > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-white text-xs flex items-center justify-center">
                {candidatures.length}
              </span>
            )}
          </button>
          <div className="flex items-center gap-3 bg-white/10 rounded-xl px-3 py-2">
            <div className="w-8 h-8 bg-purple-400 rounded-lg flex items-center justify-center">
              <span className="text-white text-xs font-bold">
                {user?.prenom?.[0]}{user?.nom?.[0]}
              </span>
            </div>
            <div>
              <p className="text-white text-sm font-medium">{user?.prenom} {user?.nom}</p>
              <p className="text-white/60 text-xs">Administrateur</p>
            </div>
          </div>
          <button onClick={handleDeconnexion}
            className="flex items-center gap-2 bg-red-500/20 hover:bg-red-500/40 text-red-300 px-3 py-2 rounded-xl text-sm transition-all">
            <LogOut size={16} /> Déconnexion
          </button>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 py-8">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Tableau de bord</h1>
          <p className="text-gray-500 mt-1">
            {new Date().toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[
            {
              label: 'Total Élections',
              value: elections.length,
              icon: Vote,
              gradient: 'from-purple-500 to-purple-700',
              trend: '+1 cette semaine'
            },
            {
              label: 'En Cours',
              value: elections.filter(e => e.statut === 'EN_COURS').length,
              icon: TrendingUp,
              gradient: 'from-green-400 to-green-600',
              trend: 'Active maintenant'
            },
            {
              label: 'Candidatures',
              value: candidatures.length,
              icon: Users,
              gradient: 'from-blue-400 to-blue-600',
              trend: 'En attente'
            },
            {
              label: 'Résultats Publiés',
              value: elections.filter(e => e.statut === 'RESULTATS_PUBLIES').length,
              icon: Trophy,
              gradient: 'from-orange-400 to-orange-600',
              trend: 'Élections terminées'
            },
          ].map((stat, i) => (
            <div key={i}
              className={`bg-gradient-to-br ${stat.gradient} rounded-2xl p-6 text-white shadow-lg`}>
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                  <stat.icon size={24} />
                </div>
                <span className="text-4xl font-bold">{stat.value}</span>
              </div>
              <p className="font-semibold text-lg">{stat.label}</p>
              <p className="text-white/70 text-sm mt-1">{stat.trend}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">

          {/* Gestion Elections */}
          <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between"
              style={{ background: 'linear-gradient(135deg, #f8f9ff 0%, #f0f4ff 100%)' }}>
              <h2 className="font-bold text-gray-800 flex items-center gap-2">
                <Vote size={20} className="text-purple-600" />
                Gestion des Élections
              </h2>
              <button onClick={() => setShowCreer(true)}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white rounded-xl"
                style={{ background: 'linear-gradient(135deg, #7c3aed, #6d28d9)' }}>
                <Plus size={16} /> Nouvelle
              </button>
            </div>
            <div className="p-6 space-y-4 max-h-96 overflow-y-auto">
              {elections.length === 0 ? (
                <div className="text-center py-8">
                  <Vote size={40} className="text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-400">Aucune élection. Créez-en une !</p>
                </div>
              ) : elections.map(election => {
                const s = statutColor[election.statut] || statutColor.PLANIFIEE
                return (
                  <div key={election.id}
                    className="border border-gray-100 rounded-xl p-4 hover:border-purple-200 hover:shadow-sm transition-all">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="font-bold text-gray-800 mb-1">{election.titre}</h3>
                        <p className="text-gray-400 text-xs">
                          {new Date(election.date_debut).toLocaleDateString('fr-FR')} →
                          {new Date(election.date_fin).toLocaleDateString('fr-FR')}
                        </p>
                      </div>
                      <span className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${s.bg} ${s.text}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
                        {election.statut.replace(/_/g, ' ')}
                      </span>
                    </div>
                    <div className="flex gap-2 flex-wrap">
                      {election.statut === 'PLANIFIEE' && (
                        <button onClick={() => ouvrirElection(election.id)}
                          className="flex items-center gap-1 px-3 py-1.5 bg-green-50 text-green-700 rounded-lg text-xs font-medium hover:bg-green-100">
                          <Play size={12} /> Ouvrir
                        </button>
                      )}
                      {election.statut === 'EN_COURS' && (
                        <button onClick={() => cloturerElection(election.id)}
                          className="flex items-center gap-1 px-3 py-1.5 bg-red-50 text-red-700 rounded-lg text-xs font-medium hover:bg-red-100">
                          <Square size={12} /> Clôturer
                        </button>
                      )}
                      {election.statut === 'CLOTUREE' && (
                        <button onClick={() => publierResultats(election.id)}
                          className="flex items-center gap-1 px-3 py-1.5 bg-purple-50 text-purple-700 rounded-lg text-xs font-medium hover:bg-purple-100">
                          <Eye size={12} /> Publier
                        </button>
                      )}
                      {election.statut === 'RESULTATS_PUBLIES' && (
                        <button onClick={() => navigate('/resultats')}
                          className="flex items-center gap-1 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-xs font-medium hover:bg-blue-100">
                          <BarChart2 size={12} /> Résultats
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Résumé rapide */}
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-100"
              style={{ background: 'linear-gradient(135deg, #f8f9ff 0%, #f0f4ff 100%)' }}>
              <h2 className="font-bold text-gray-800 flex items-center gap-2">
                <Clock size={20} className="text-purple-600" />
                Résumé Rapide
              </h2>
            </div>
            <div className="p-6 space-y-4">
              {[
                { label: 'Planifiées',        value: elections.filter(e => e.statut === 'PLANIFIEE').length,         color: 'bg-blue-500' },
                { label: 'En cours',          value: elections.filter(e => e.statut === 'EN_COURS').length,          color: 'bg-green-500' },
                { label: 'Clôturées',         value: elections.filter(e => e.statut === 'CLOTUREE').length,          color: 'bg-gray-400' },
                { label: 'Résultats publiés', value: elections.filter(e => e.statut === 'RESULTATS_PUBLIES').length, color: 'bg-purple-500' },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${item.color} flex-shrink-0`} />
                  <div className="flex-1">
                    <div className="flex justify-between mb-1">
                      <span className="text-sm text-gray-600">{item.label}</span>
                      <span className="text-sm font-bold text-gray-800">{item.value}</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-1.5">
                      <div className={`${item.color} h-1.5 rounded-full`}
                        style={{ width: `${elections.length > 0 ? (item.value / elections.length) * 100 : 0}%` }} />
                    </div>
                  </div>
                </div>
              ))}

              <div className="pt-4 border-t border-gray-100 space-y-2">
                <button onClick={() => navigate('/resultats')}
                  className="w-full flex items-center justify-center gap-2 py-2.5 bg-purple-50 text-purple-700 rounded-xl text-sm font-medium hover:bg-purple-100">
                  <Award size={16} /> Voir les résultats
                </button>
                <button onClick={chargerDonnees}
                  className="w-full flex items-center justify-center gap-2 py-2.5 bg-gray-50 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-100">
                  <RefreshCw size={16} /> Actualiser
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Candidatures en attente */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-100 flex items-center justify-between"
            style={{ background: 'linear-gradient(135deg, #f8f9ff 0%, #f0f4ff 100%)' }}>
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
          <div className="p-6">
            {candidatures.length === 0 ? (
              <div className="text-center py-8">
                <CheckCircle size={40} className="text-green-300 mx-auto mb-3" />
                <p className="text-gray-400">Aucune candidature en attente</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {candidatures.map(cand => (
                  <div key={cand.id}
                    className="border border-gray-100 rounded-xl p-4 hover:border-purple-200 hover:shadow-sm transition-all">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center flex-shrink-0">
                        <Users size={18} className="text-purple-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-800 text-sm">{cand.etudiant_nom}</p>
                        <p className="text-gray-400 text-xs">{cand.etudiant_filiere}</p>
                      </div>
                    </div>
                    {cand.programme && (
                      <p className="text-gray-500 text-xs mb-3 line-clamp-2 bg-gray-50 p-2 rounded-lg">
                        {cand.programme}
                      </p>
                    )}
                    <div className="flex gap-2">
                      <button onClick={() => validerCandidature(cand.id)}
                        className="flex-1 flex items-center justify-center gap-1 py-2 bg-green-50 text-green-700 rounded-lg text-xs font-medium hover:bg-green-100">
                        <CheckCircle size={14} /> Valider
                      </button>
                      <button onClick={() => rejeterCandidature(cand.id)}
                        className="flex-1 flex items-center justify-center gap-1 py-2 bg-red-50 text-red-700 rounded-lg text-xs font-medium hover:bg-red-100">
                        <XCircle size={14} /> Rejeter
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal */}
      {showCreer && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
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
              <div className="flex gap-3">
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