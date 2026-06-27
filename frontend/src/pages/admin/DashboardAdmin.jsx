import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { electionAPI, candidatureAPI, resultatAPI } from '../../services/api'
import {
  Vote, Trophy, LogOut, Bell, BarChart2, CheckCircle, XCircle,
  Plus, Play, Square, Eye, Shield, TrendingUp, Award, RefreshCw,
  Ban, Users, Menu, X, ChevronRight, FileDown
} from 'lucide-react'
import toast from 'react-hot-toast'

const DashboardAdmin = () => {
  const { user, deconnexion }           = useAuth()
  const [elections, setElections]       = useState([])
  const [candidatures, setCandidatures] = useState([])
  const [loading, setLoading]           = useState(true)
  const [showCreer, setShowCreer]       = useState(false)
  const [showAnnuler, setShowAnnuler]   = useState(false)
  const [electionAnnuler, setElectionAnnuler] = useState(null)
  const [motifAnnulation, setMotifAnnulation] = useState('')
  const [sidebarOpen, setSidebarOpen]   = useState(false)
  const [formElection, setFormElection] = useState({
    titre: '', description: '', date_debut: '', date_fin: '', annee_academique: '2025-2026'
  })
  const navigate = useNavigate()

  useEffect(() => { chargerDonnees() }, [])

  const chargerDonnees = async () => {
    try {
      const [{ data: elecs }, { data: cands }] = await Promise.all([
        electionAPI.liste(), candidatureAPI.enAttente(),
      ])
      setElections(elecs)
      setCandidatures(cands)
    } catch { toast.error('Erreur de chargement.') }
    finally { setLoading(false) }
  }

  const handleDeconnexion = async () => { await deconnexion(); navigate('/connexion') }
  const ouvrirElection     = async (id) => { try { await electionAPI.ouvrir(id);   toast.success('Élection ouverte !');   chargerDonnees() } catch (err) { toast.error(err.response?.data?.erreur || 'Erreur.') } }
  const cloturerElection   = async (id) => { try { await electionAPI.cloturer(id); toast.success('Élection clôturée !'); chargerDonnees() } catch (err) { toast.error(err.response?.data?.erreur || 'Erreur.') } }
  const publierResultats   = async (id) => { try { await resultatAPI.calculer(id); await electionAPI.publier(id); toast.success('Résultats publiés !'); chargerDonnees() } catch (err) { toast.error(err.response?.data?.erreur || 'Erreur.') } }
  const telechargerRapport = async (id) => {
    try {
      const response = await resultatAPI.rapport(id)
      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }))
      const a = document.createElement('a')
      a.href = url
      a.download = `rapport_election_${id}.pdf`
      a.click()
      window.URL.revokeObjectURL(url)
      toast.success('Rapport téléchargé !')
    } catch { toast.error('Erreur lors de la génération du rapport.') }
  }
  const validerCandidature = async (id) => { try { await candidatureAPI.valider(id); toast.success('Validée !'); chargerDonnees() } catch { toast.error('Erreur.') } }
  const rejeterCandidature = async (id) => { try { await candidatureAPI.rejeter(id, { motif_rejet: 'Non conforme.' }); toast.success('Rejetée.'); chargerDonnees() } catch { toast.error('Erreur.') } }
  const creerElection = async (e) => {
    e.preventDefault()
    try { await electionAPI.creer(formElection); toast.success('Élection créée !'); setShowCreer(false); chargerDonnees() }
    catch (err) { toast.error(err.response?.data?.erreur || 'Erreur.') }
  }
  const confirmerAnnulation = async () => {
    if (!motifAnnulation.trim()) { toast.error('Motif obligatoire.'); return }
    try {
      await electionAPI.annuler(electionAnnuler.id, { motif_annulation: motifAnnulation })
      toast.success('Élection annulée.')
      setShowAnnuler(false); setMotifAnnulation(''); setElectionAnnuler(null); chargerDonnees()
    } catch (err) { toast.error(err.response?.data?.erreur || 'Erreur.') }
  }

  const statutConfig = {
    PLANIFIEE:         { label: 'Planifiée',         color: 'bg-blue-500/15 text-blue-400 border-blue-500/30' },
    EN_COURS:          { label: 'En cours',           color: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' },
    CLOTUREE:          { label: 'Clôturée',           color: 'bg-slate-500/15 text-slate-400 border-slate-500/30' },
    RESULTATS_PUBLIES: { label: 'Résultats publiés',  color: 'bg-purple-500/15 text-purple-400 border-purple-500/30' },
    ANNULEE:           { label: 'Annulée',            color: 'bg-red-500/15 text-red-400 border-red-500/30' },
  }

  const navLinks = [
    { label: 'Tableau de bord',      icon: BarChart2, action: () => {} },
    { label: 'Gestion utilisateurs', icon: Users,     action: () => { navigate('/admin/utilisateurs'); setSidebarOpen(false) } },
    { label: 'Étudiants autorisés',  icon: Shield,    action: () => { navigate('/admin/etudiants-autorises'); setSidebarOpen(false) } },
    { label: 'Voir les résultats',   icon: Award,     action: () => { navigate('/resultats'); setSidebarOpen(false) } },
  ]

  if (loading) return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center">
      <div className="text-center">
        <div className="w-12 h-12 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-slate-400 text-sm">Chargement...</p>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-slate-900 flex">

      {/* Sidebar desktop */}
      <aside className="hidden lg:flex flex-col w-64 bg-slate-950 border-r border-white/5">
        <div className="p-6 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-amber-500 rounded-lg flex items-center justify-center">
              <Vote size={18} className="text-slate-900" />
            </div>
            <div>
              <div className="text-white font-bold text-sm">VotingApp</div>
              <div className="text-slate-500 text-xs">Administration</div>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 flex flex-col gap-1">
          {navLinks.map((l, i) => (
            <button key={i} onClick={l.action}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-all text-sm w-full text-left">
              <l.icon size={16} />
              {l.label}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-white/5">
          <div className="flex items-center gap-3 px-3 py-2 mb-2">
            <div className="w-8 h-8 bg-amber-500/20 rounded-lg flex items-center justify-center text-amber-500 text-xs font-bold">
              {user?.prenom?.[0]}{user?.nom?.[0]}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-white text-xs font-medium truncate">{user?.prenom} {user?.nom}</div>
              <div className="text-slate-500 text-xs">Administrateur</div>
            </div>
          </div>
          <button onClick={handleDeconnexion}
            className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-red-400 hover:bg-red-500/10 transition-all text-sm">
            <LogOut size={14} /> Déconnexion
          </button>
        </div>
      </aside>

      {/* Sidebar mobile overlay */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/60" onClick={() => setSidebarOpen(false)} />
          <aside className="relative w-72 bg-slate-950 border-r border-white/5 flex flex-col z-10">
            <div className="p-6 border-b border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-amber-500 rounded-lg flex items-center justify-center">
                  <Vote size={18} className="text-slate-900" />
                </div>
                <span className="text-white font-bold">VotingApp</span>
              </div>
              <button onClick={() => setSidebarOpen(false)} className="text-slate-400">
                <X size={20} />
              </button>
            </div>
            <nav className="flex-1 p-4 flex flex-col gap-1">
              {navLinks.map((l, i) => (
                <button key={i} onClick={l.action}
                  className="flex items-center gap-3 px-3 py-3 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-all text-sm w-full text-left">
                  <l.icon size={16} /> {l.label}
                </button>
              ))}
            </nav>
            <div className="p-4 border-t border-white/5">
              <button onClick={handleDeconnexion}
                className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-red-400 hover:bg-red-500/10 text-sm">
                <LogOut size={14} /> Déconnexion
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Topbar */}
        <header className="bg-slate-950 border-b border-white/5 px-4 sm:px-6 h-14 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <button className="lg:hidden text-slate-400 hover:text-white" onClick={() => setSidebarOpen(true)}>
              <Menu size={20} />
            </button>
            <div>
              <h1 className="text-white font-bold text-sm">Tableau de bord</h1>
              <p className="text-slate-500 text-xs hidden sm:block">
                {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button className="relative p-2 text-slate-400 hover:text-white">
              <Bell size={18} />
              {candidatures.length > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 rounded-full text-white text-xs flex items-center justify-center">
                  {candidatures.length}
                </span>
              )}
            </button>
            <button onClick={() => setShowCreer(true)}
              className="flex items-center gap-2 bg-amber-500 text-slate-900 px-3 py-1.5 rounded-lg text-sm font-bold hover:bg-amber-400 transition-all">
              <Plus size={14} /> <span className="hidden sm:block">Nouvelle élection</span>
            </button>
          </div>
        </header>

        {/* Body */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          <style>{`
            @keyframes fadeUp { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }
            .fade1 { animation: fadeUp 0.5s ease 0.1s both; }
            .fade2 { animation: fadeUp 0.5s ease 0.2s both; }
            .fade3 { animation: fadeUp 0.5s ease 0.3s both; }
            .fade4 { animation: fadeUp 0.5s ease 0.4s both; }
            .fade5 { animation: fadeUp 0.5s ease 0.5s both; }
            .card-anim { animation: fadeUp 0.5s ease both; }
            .card-anim:nth-child(1) { animation-delay:0.1s; }
            .card-anim:nth-child(2) { animation-delay:0.2s; }
            .card-anim:nth-child(3) { animation-delay:0.3s; }
            .card-anim:nth-child(4) { animation-delay:0.4s; }
          `}</style>

          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {[
              { label: 'Élections',        value: elections.length,                                                icon: Vote,       color: '#F0A500' },
              { label: 'En cours',         value: elections.filter(e => e.statut === 'EN_COURS').length,          icon: TrendingUp, color: '#10B981' },
              { label: 'Candidatures',     value: candidatures.length,                                            icon: Users,      color: '#3B82F6' },
              { label: 'Résultats publiés', value: elections.filter(e => e.statut === 'RESULTATS_PUBLIES').length, icon: Trophy,     color: '#8B5CF6' },
            ].map((s, i) => (
              <div key={i} className="card-anim bg-slate-800 border border-white/5 rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${s.color}20` }}>
                    <s.icon size={16} style={{ color: s.color }} />
                  </div>
                  <span className="text-2xl font-extrabold text-white">{s.value}</span>
                </div>
                <p className="text-slate-400 text-xs">{s.label}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 fade3">

            {/* Élections */}
            <div className="lg:col-span-2 bg-slate-800 border border-white/5 rounded-xl overflow-hidden">
              <div className="px-5 py-4 border-b border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-1 h-5 bg-amber-500 rounded-full" />
                  <h2 className="text-white font-bold text-sm">Gestion des Élections</h2>
                </div>
                <button onClick={chargerDonnees} className="text-slate-500 hover:text-white transition-colors">
                  <RefreshCw size={14} />
                </button>
              </div>
              <div className="p-4 flex flex-col gap-3 max-h-96 overflow-y-auto">
                {elections.length === 0 ? (
                  <div className="text-center py-10">
                    <Vote size={32} className="text-slate-600 mx-auto mb-3" />
                    <p className="text-slate-500 text-sm">Aucune élection. Créez-en une !</p>
                  </div>
                ) : elections.map(election => {
                  const s = statutConfig[election.statut] || statutConfig.PLANIFIEE
                  return (
                    <div key={election.id} className="bg-slate-700/50 border border-white/5 rounded-xl p-4">
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="flex-1 min-w-0">
                          <h3 className="text-white font-semibold text-sm truncate mb-1">{election.titre}</h3>
                          <p className="text-slate-500 text-xs">
                            {new Date(election.date_debut).toLocaleDateString('fr-FR')} → {new Date(election.date_fin).toLocaleDateString('fr-FR')}
                          </p>
                          {election.statut === 'ANNULEE' && election.motif_annulation && (
                            <p className="text-red-400 text-xs mt-1">Motif : {election.motif_annulation}</p>
                          )}
                        </div>
                        <span className={`flex-shrink-0 px-2.5 py-1 rounded-full text-xs font-medium border ${s.color}`}>
                          {s.label}
                        </span>
                      </div>
                      <div className="flex gap-2 flex-wrap">
                        {election.statut === 'PLANIFIEE' && (
                          <button onClick={() => ouvrirElection(election.id)}
                            className="flex items-center gap-1 px-3 py-1.5 bg-emerald-500/15 text-emerald-400 rounded-lg text-xs font-medium hover:bg-emerald-500/25 border border-emerald-500/20">
                            <Play size={10} /> Ouvrir
                          </button>
                        )}
                        {election.statut === 'EN_COURS' && (
                          <button onClick={() => cloturerElection(election.id)}
                            className="flex items-center gap-1 px-3 py-1.5 bg-slate-500/15 text-slate-400 rounded-lg text-xs font-medium hover:bg-slate-500/25 border border-slate-500/20">
                            <Square size={10} /> Clôturer
                          </button>
                        )}
                        {election.statut === 'CLOTUREE' && (
                          <button onClick={() => publierResultats(election.id)}
                            className="flex items-center gap-1 px-3 py-1.5 bg-purple-500/15 text-purple-400 rounded-lg text-xs font-medium hover:bg-purple-500/25 border border-purple-500/20">
                            <Eye size={10} /> Publier
                          </button>
                        )}
                        {election.statut === 'RESULTATS_PUBLIES' && (
                          <button onClick={() => navigate('/resultats')}
                            className="flex items-center gap-1 px-3 py-1.5 bg-blue-500/15 text-blue-400 rounded-lg text-xs font-medium hover:bg-blue-500/25 border border-blue-500/20">
                            <BarChart2 size={10} /> Résultats
                          </button>
                        )}
                        {['CLOTUREE', 'RESULTATS_PUBLIES'].includes(election.statut) && (
                          <button onClick={() => telechargerRapport(election.id)}
                            className="flex items-center gap-1 px-3 py-1.5 bg-emerald-500/15 text-emerald-400 rounded-lg text-xs font-medium hover:bg-emerald-500/25 border border-emerald-500/20">
                            <FileDown size={10} /> Rapport PDF
                          </button>
                        )}
                        {['PLANIFIEE', 'EN_COURS', 'CLOTUREE'].includes(election.statut) && (
                          <button onClick={() => { setElectionAnnuler(election); setShowAnnuler(true) }}
                            className="flex items-center gap-1 px-3 py-1.5 bg-red-500/15 text-red-400 rounded-lg text-xs font-medium hover:bg-red-500/25 border border-red-500/20">
                            <Ban size={10} /> Annuler
                          </button>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Panel droit */}
            <div className="flex flex-col gap-4">

              {/* Résumé */}
              <div className="bg-slate-800 border border-white/5 rounded-xl p-5">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-1 h-5 bg-amber-500 rounded-full" />
                  <h2 className="text-white font-bold text-sm">Résumé</h2>
                </div>
                <div className="flex flex-col gap-3">
                  {[
                    { label: 'Planifiées',       value: elections.filter(e => e.statut === 'PLANIFIEE').length,         color: 'bg-blue-500' },
                    { label: 'En cours',         value: elections.filter(e => e.statut === 'EN_COURS').length,          color: 'bg-emerald-500' },
                    { label: 'Clôturées',        value: elections.filter(e => e.statut === 'CLOTUREE').length,          color: 'bg-slate-400' },
                    { label: 'Publiées',         value: elections.filter(e => e.statut === 'RESULTATS_PUBLIES').length, color: 'bg-purple-500' },
                    { label: 'Annulées',         value: elections.filter(e => e.statut === 'ANNULEE').length,           color: 'bg-red-500' },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${item.color}`} />
                        <span className="text-slate-400 text-xs">{item.label}</span>
                      </div>
                      <span className="text-white text-xs font-bold">{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Actions rapides */}
              <div className="bg-slate-800 border border-white/5 rounded-xl p-5">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-1 h-5 bg-amber-500 rounded-full" />
                  <h2 className="text-white font-bold text-sm">Actions rapides</h2>
                </div>
                <div className="flex flex-col gap-2">
                  {[
                    { label: 'Gestion utilisateurs', icon: Users,  action: () => navigate('/admin/utilisateurs') },
                    { label: 'Étudiants autorisés',  icon: Shield, action: () => navigate('/admin/etudiants-autorises') },
                    { label: 'Voir les résultats',   icon: Award,  action: () => navigate('/resultats') },
                  ].map((a, i) => (
                    <button key={i} onClick={a.action}
                      className="flex items-center justify-between px-3 py-2.5 rounded-lg bg-white/3 hover:bg-white/8 border border-white/5 transition-all group">
                      <div className="flex items-center gap-2">
                        <a.icon size={14} className="text-amber-500" />
                        <span className="text-slate-300 text-xs">{a.label}</span>
                      </div>
                      <ChevronRight size={12} className="text-slate-600 group-hover:text-slate-400 transition-colors" />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Candidatures */}
          {candidatures.length > 0 && (
            <div className="mt-6 bg-slate-800 border border-white/5 rounded-xl overflow-hidden">
              <div className="px-5 py-4 border-b border-white/5 flex items-center gap-3">
                <div className="w-1 h-5 bg-amber-500 rounded-full" />
                <h2 className="text-white font-bold text-sm">Candidatures en attente</h2>
                <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">{candidatures.length}</span>
              </div>
              <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {candidatures.map(cand => (
                  <div key={cand.id} className="bg-slate-700/50 border border-white/5 rounded-xl p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-9 h-9 bg-amber-500/15 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Users size={15} className="text-amber-500" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-white text-sm font-medium truncate">{cand.etudiant_nom}</p>
                        <p className="text-slate-500 text-xs">{cand.etudiant_filiere}</p>
                      </div>
                    </div>
                    {cand.programme && (
                      <p className="text-slate-400 text-xs mb-3 line-clamp-2 bg-slate-600/30 p-2 rounded-lg">{cand.programme}</p>
                    )}
                    <div className="flex gap-2">
                      <button onClick={() => validerCandidature(cand.id)}
                        className="flex-1 flex items-center justify-center gap-1 py-2 bg-emerald-500/15 text-emerald-400 rounded-lg text-xs font-medium hover:bg-emerald-500/25 border border-emerald-500/20">
                        <CheckCircle size={12} /> Valider
                      </button>
                      <button onClick={() => rejeterCandidature(cand.id)}
                        className="flex-1 flex items-center justify-center gap-1 py-2 bg-red-500/15 text-red-400 rounded-lg text-xs font-medium hover:bg-red-500/25 border border-red-500/20">
                        <XCircle size={12} /> Rejeter
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Modal créer élection */}
      {showCreer && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 border border-white/10 rounded-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-white font-bold text-lg">Créer une élection</h3>
              <button onClick={() => setShowCreer(false)} className="text-slate-400 hover:text-white"><X size={20} /></button>
            </div>
            <form onSubmit={creerElection} className="flex flex-col gap-4">
              <div>
                <label className="text-slate-400 text-xs mb-1.5 block">Titre</label>
                <input placeholder="Titre de l'élection" value={formElection.titre}
                  onChange={e => setFormElection({...formElection, titre: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl text-sm text-white bg-white/5 border border-white/10 outline-none placeholder-slate-600" required />
              </div>
              <div>
                <label className="text-slate-400 text-xs mb-1.5 block">Description</label>
                <textarea placeholder="Description (optionnel)" value={formElection.description}
                  onChange={e => setFormElection({...formElection, description: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl text-sm text-white bg-white/5 border border-white/10 outline-none resize-none h-20 placeholder-slate-600" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 text-xs mb-1.5 block">Date début</label>
                  <input type="datetime-local" value={formElection.date_debut}
                    onChange={e => setFormElection({...formElection, date_debut: e.target.value})}
                    className="w-full px-3 py-3 rounded-xl text-sm text-white bg-white/5 border border-white/10 outline-none" required />
                </div>
                <div>
                  <label className="text-slate-400 text-xs mb-1.5 block">Date fin</label>
                  <input type="datetime-local" value={formElection.date_fin}
                    onChange={e => setFormElection({...formElection, date_fin: e.target.value})}
                    className="w-full px-3 py-3 rounded-xl text-sm text-white bg-white/5 border border-white/10 outline-none" required />
                </div>
              </div>
              <div>
                <label className="text-slate-400 text-xs mb-1.5 block">Année académique</label>
                <input placeholder="2025-2026" value={formElection.annee_academique}
                  onChange={e => setFormElection({...formElection, annee_academique: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl text-sm text-white bg-white/5 border border-white/10 outline-none placeholder-slate-600" required />
              </div>
              <div className="flex gap-3 mt-2">
                <button type="button" onClick={() => setShowCreer(false)}
                  className="flex-1 py-3 rounded-xl text-slate-300 bg-white/5 border border-white/10 text-sm font-medium hover:bg-white/10">
                  Annuler
                </button>
                <button type="submit"
                  className="flex-1 py-3 rounded-xl bg-amber-500 text-slate-900 text-sm font-bold hover:bg-amber-400">
                  Créer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal annuler élection */}
      {showAnnuler && electionAnnuler && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 border border-white/10 rounded-2xl w-full max-w-md p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-red-500/15 rounded-xl flex items-center justify-center">
                <Ban size={20} className="text-red-400" />
              </div>
              <div>
                <h3 className="text-white font-bold">Annuler l'élection</h3>
                <p className="text-slate-400 text-xs">{electionAnnuler.titre}</p>
              </div>
            </div>
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 mb-4 text-red-400 text-xs">
              ⚠️ Cette action est irréversible.
            </div>
            <textarea placeholder="Motif d'annulation (obligatoire)..."
              value={motifAnnulation} onChange={e => setMotifAnnulation(e.target.value)}
              className="w-full px-4 py-3 rounded-xl text-sm text-white bg-white/5 border border-white/10 outline-none resize-none h-24 mb-4 placeholder-slate-600" />
            <div className="flex gap-3">
              <button onClick={() => { setShowAnnuler(false); setMotifAnnulation(''); setElectionAnnuler(null) }}
                className="flex-1 py-3 rounded-xl text-slate-300 bg-white/5 border border-white/10 text-sm font-medium hover:bg-white/10">
                Annuler
              </button>
              <button onClick={confirmerAnnulation}
                className="flex-1 py-3 rounded-xl bg-red-600 text-white text-sm font-bold hover:bg-red-500">
                Confirmer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default DashboardAdmin
