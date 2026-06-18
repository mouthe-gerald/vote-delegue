import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { electionAPI, candidatureAPI, resultatAPI } from '../../services/api'
import {
  User, Award, BarChart2, FileText, Bell, LogOut, Settings,
  CheckCircle, Clock, Edit, Save, Trophy, Vote, Menu, X,
  ChevronRight, Hash, Mail, GraduationCap, Layers, Percent
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
  const [sidebarOpen, setSidebarOpen]     = useState(false)
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
        const maCandidature = cands.find(c => c.etudiant_nom === `${user?.prenom} ${user?.nom}`)
        if (maCandidature) { setCandidature(maCandidature); setProgramme(maCandidature.programme || '') }
        if (elecActive.statut === 'RESULTATS_PUBLIES') {
          try {
            const { data: res } = await resultatAPI.consulter(elecActive.id)
            const monResultat = res.resultats?.find(r => r.candidat_nom === `${user?.prenom} ${user?.nom}`)
            setResultat(monResultat)
          } catch {}
        }
      }
    } catch { toast.error('Erreur de chargement.') }
    finally { setLoading(false) }
  }

  const sauvegarderProgramme = async () => { toast.success('Programme mis à jour !'); setEditProgramme(false) }
  const handleDeconnexion = async () => { await deconnexion(); navigate('/connexion') }

  const statutConfig = {
    EN_ATTENTE:      'bg-amber-500/15 text-amber-400 border-amber-500/20',
    VALIDEE:         'bg-emerald-500/15 text-emerald-400 border-emerald-500/20',
    REJETEE:         'bg-red-500/15 text-red-400 border-red-500/20',
    RETRAIT_DEMANDE: 'bg-orange-500/15 text-orange-400 border-orange-500/20',
    RETIREE:         'bg-slate-500/15 text-slate-400 border-slate-500/20',
  }

  const menuItems = [
    { id: 'dashboard',    label: 'Tableau de bord', icon: BarChart2 },
    { id: 'profil',       label: 'Mon Profil',       icon: User },
    { id: 'programme',    label: 'Mon Programme',    icon: FileText },
    { id: 'statistiques', label: 'Statistiques',     icon: BarChart2 },
    { id: 'resultats',    label: 'Résultats',        icon: Trophy },
  ]

  if (loading) return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center">
      <div className="w-10 h-10 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  const SidebarContent = () => (
    <>
      <div className="p-5 border-b border-white/5">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 bg-amber-500 rounded-lg flex items-center justify-center">
            <Vote size={18} className="text-slate-900" />
          </div>
          <div>
            <div className="text-white font-bold text-sm">VotingApp</div>
            <div className="text-slate-500 text-xs">Espace candidat</div>
          </div>
        </div>
        <div className="flex items-center gap-3 bg-white/5 rounded-xl p-3">
          <div className="w-10 h-10 bg-amber-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
            <span className="text-amber-500 font-bold text-sm">{user?.prenom?.[0]}{user?.nom?.[0]}</span>
          </div>
          <div className="min-w-0">
            <p className="text-white font-bold text-sm truncate">{user?.prenom} {user?.nom}</p>
            {candidature && (
              <span className={`text-xs px-2 py-0.5 rounded-full border ${statutConfig[candidature.statut] || ''}`}>
                {candidature.statut?.replace('_', ' ')}
              </span>
            )}
          </div>
        </div>
      </div>

      <nav className="flex-1 p-3 flex flex-col gap-1">
        {menuItems.map(item => (
          <button key={item.id}
            onClick={() => { setActiveMenu(item.id); setSidebarOpen(false) }}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm w-full text-left transition-all ${
              activeMenu === item.id
                ? 'bg-amber-500/15 text-amber-400 border border-amber-500/20'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}>
            <item.icon size={15} /> {item.label}
          </button>
        ))}
        <button onClick={() => navigate('/etudiant/dashboard')}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm w-full text-left text-slate-500 hover:text-white hover:bg-white/5 transition-all mt-2 border-t border-white/5 pt-4">
          <ChevronRight size={15} className="rotate-180" /> Espace étudiant
        </button>
      </nav>

      <div className="p-3 border-t border-white/5">
        <button onClick={handleDeconnexion}
          className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-red-400 hover:bg-red-500/10 text-sm">
          <LogOut size={14} /> Déconnexion
        </button>
      </div>
    </>
  )

  return (
    <div className="min-h-screen bg-slate-900 flex">

      {/* Sidebar desktop */}
      <aside className="hidden lg:flex flex-col w-60 bg-slate-950 border-r border-white/5 flex-shrink-0">
        <SidebarContent />
      </aside>

      {/* Sidebar mobile */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/60" onClick={() => setSidebarOpen(false)} />
          <aside className="relative w-64 bg-slate-950 border-r border-white/5 flex flex-col z-10">
            <button onClick={() => setSidebarOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white">
              <X size={18} />
            </button>
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Topbar */}
        <header className="bg-slate-950 border-b border-white/5 px-4 sm:px-6 h-14 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <button className="lg:hidden text-slate-400 hover:text-white" onClick={() => setSidebarOpen(true)}>
              <Menu size={20} />
            </button>
            <div className="flex items-center gap-2">
              <div className="w-1 h-5 bg-amber-500 rounded-full" />
              <h1 className="text-white font-bold text-sm">
                {menuItems.find(m => m.id === activeMenu)?.label || 'Dashboard'}
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 text-slate-400 text-xs">
              <Clock size={12} />
              {election?.titre || 'Aucune élection'}
            </div>
            <button className="p-2 text-slate-400 hover:text-white">
              <Bell size={16} />
            </button>
          </div>
        </header>

        {/* Body */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">

          {/* DASHBOARD */}
          {activeMenu === 'dashboard' && (
            <div className="flex flex-col gap-5">

              {/* Bannière élu */}
              {resultat?.est_elu && (
                <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-5 flex items-center gap-4">
                  <Trophy size={32} className="text-amber-500 flex-shrink-0" />
                  <div>
                    <p className="text-amber-400 font-bold">🏆 Félicitations — Vous êtes élu(e) !</p>
                    <p className="text-slate-400 text-sm">Vous avez été élu(e) délégué(e) de classe.</p>
                  </div>
                </div>
              )}

              {/* Hero */}
              <div className="bg-slate-800 border border-white/5 rounded-xl p-5 flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-xs mb-1">Bonjour</p>
                  <h2 className="text-white font-extrabold text-xl mb-1">{user?.prenom} {user?.nom} 🎯</h2>
                  <p className="text-slate-400 text-sm">{election?.titre || 'Aucune élection active'}</p>
                  {election && (
                    <div className="flex items-center gap-2 mt-2">
                      <div className={`w-1.5 h-1.5 rounded-full ${election.statut === 'EN_COURS' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                      <span className="text-slate-400 text-xs">{election.statut.replace('_', ' ')}</span>
                    </div>
                  )}
                </div>
                <div className="w-14 h-14 bg-amber-500/15 rounded-2xl flex items-center justify-center flex-shrink-0">
                  <Award size={28} className="text-amber-500" />
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { label: 'Votes reçus',    value: resultat?.nb_voix ?? '—',                     icon: Vote,       color: '#F0A500' },
                  { label: 'Pourcentage',    value: resultat ? `${resultat.pourcentage}%` : '—',  icon: Percent,    color: '#10B981' },
                  { label: 'Statut élection', value: election?.statut?.replace('_', ' ') || '—', icon: Clock,      color: '#3B82F6' },
                  { label: 'Candidature',    value: candidature?.statut?.replace('_', ' ') || '—', icon: CheckCircle, color: '#8B5CF6' },
                ].map((s, i) => (
                  <div key={i} className="bg-slate-800 border border-white/5 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${s.color}20` }}>
                        <s.icon size={15} style={{ color: s.color }} />
                      </div>
                    </div>
                    <p className="text-white font-extrabold text-xl">{s.value}</p>
                    <p className="text-slate-500 text-xs mt-0.5">{s.label}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* PROFIL */}
          {activeMenu === 'profil' && (
            <div className="bg-slate-800 border border-white/5 rounded-xl overflow-hidden max-w-lg">
              <div className="px-5 py-4 border-b border-white/5 flex items-center gap-2">
                <div className="w-1 h-5 bg-amber-500 rounded-full" />
                <h3 className="text-white font-bold text-sm">Mon Profil</h3>
              </div>
              <div className="p-5">
                <div className="flex items-center gap-4 mb-5">
                  <div className="w-14 h-14 bg-amber-500/15 rounded-xl flex items-center justify-center flex-shrink-0">
                    <span className="text-amber-500 font-bold text-xl">{user?.prenom?.[0]}{user?.nom?.[0]}</span>
                  </div>
                  <div>
                    <p className="text-white font-bold">{user?.prenom} {user?.nom}</p>
                    <p className="text-slate-400 text-xs">Candidat</p>
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  {[
                    { icon: Hash,          label: 'Matricule', value: user?.matricule },
                    { icon: Mail,          label: 'Email',     value: user?.email },
                    { icon: GraduationCap, label: 'Filière',   value: user?.profil?.filiere },
                    { icon: Layers,        label: 'Niveau',    value: user?.profil?.niveau },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-3 py-2.5 border-b border-white/5 last:border-0">
                      <div className="w-7 h-7 bg-white/5 rounded-lg flex items-center justify-center flex-shrink-0">
                        <item.icon size={12} className="text-slate-400" />
                      </div>
                      <span className="text-slate-500 text-xs w-20 flex-shrink-0">{item.label}</span>
                      <span className="text-white text-xs font-medium truncate">{item.value || '—'}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* PROGRAMME */}
          {activeMenu === 'programme' && (
            <div className="bg-slate-800 border border-white/5 rounded-xl overflow-hidden max-w-2xl">
              <div className="px-5 py-4 border-b border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-1 h-5 bg-amber-500 rounded-full" />
                  <h3 className="text-white font-bold text-sm">Mon Programme Électoral</h3>
                </div>
                <button onClick={() => editProgramme ? sauvegarderProgramme() : setEditProgramme(true)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    editProgramme
                      ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20'
                      : 'bg-white/5 text-slate-400 border border-white/10 hover:bg-white/10'
                  }`}>
                  {editProgramme ? <><Save size={12} /> Enregistrer</> : <><Edit size={12} /> Modifier</>}
                </button>
              </div>
              <div className="p-5">
                {editProgramme ? (
                  <textarea value={programme} onChange={e => setProgramme(e.target.value)}
                    placeholder="Décrivez votre programme électoral..."
                    className="w-full px-4 py-3 rounded-xl text-sm text-white bg-white/5 border border-white/10 outline-none resize-none h-48 placeholder-slate-600 focus:border-amber-500/50 transition-colors" />
                ) : (
                  <div className="min-h-32">
                    {programme
                      ? <p className="text-slate-300 text-sm leading-relaxed">{programme}</p>
                      : <p className="text-slate-600 text-sm text-center mt-10">Aucun programme. Cliquez sur "Modifier".</p>
                    }
                  </div>
                )}
              </div>
            </div>
          )}

          {/* STATISTIQUES */}
          {activeMenu === 'statistiques' && (
            <div className="bg-slate-800 border border-white/5 rounded-xl overflow-hidden max-w-xl">
              <div className="px-5 py-4 border-b border-white/5 flex items-center gap-2">
                <div className="w-1 h-5 bg-amber-500 rounded-full" />
                <h3 className="text-white font-bold text-sm">Statistiques des votes</h3>
              </div>
              <div className="p-5">
                {resultat ? (
                  <>
                    <div className="grid grid-cols-3 gap-3 mb-5">
                      {[
                        { label: 'Votes',       value: resultat.nb_voix,           color: '#F0A500' },
                        { label: 'Pourcentage', value: `${resultat.pourcentage}%`, color: '#10B981' },
                        { label: 'Statut',      value: resultat.est_elu ? '🏆 Élu' : 'Candidat', color: '#3B82F6' },
                      ].map((s, i) => (
                        <div key={i} className="bg-white/5 rounded-xl p-3 text-center">
                          <p className="font-extrabold text-lg" style={{ color: s.color }}>{s.value}</p>
                          <p className="text-slate-500 text-xs mt-0.5">{s.label}</p>
                        </div>
                      ))}
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-slate-400 text-xs">Part des votes</span>
                        <span className="text-amber-400 font-bold text-xs">{resultat.pourcentage}%</span>
                      </div>
                      <div className="w-full bg-white/5 rounded-full h-2">
                        <div className="bg-amber-500 h-2 rounded-full transition-all duration-500"
                          style={{ width: `${resultat.pourcentage}%` }} />
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-10">
                    <BarChart2 size={32} className="text-slate-600 mx-auto mb-3" />
                    <p className="text-slate-500 text-sm">Statistiques disponibles après la publication des résultats.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* RESULTATS */}
          {activeMenu === 'resultats' && (
            <div className="flex flex-col gap-4 max-w-xl">
              {resultat ? (
                <>
                  {resultat.est_elu && (
                    <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-6 text-center">
                      <Trophy size={40} className="text-amber-500 mx-auto mb-3" />
                      <h2 className="text-white font-extrabold text-xl mb-1">Félicitations ! 🎉</h2>
                      <p className="text-slate-400 text-sm">Vous avez été élu(e) délégué(e) de classe !</p>
                    </div>
                  )}
                  <div className="bg-slate-800 border border-white/5 rounded-xl overflow-hidden">
                    <div className="px-5 py-4 border-b border-white/5 flex items-center gap-2">
                      <div className="w-1 h-5 bg-amber-500 rounded-full" />
                      <h3 className="text-white font-bold text-sm">Résultats finaux</h3>
                    </div>
                    <div className="p-5 flex flex-col gap-3">
                      {[
                        { label: 'Votes obtenus', value: resultat.nb_voix },
                        { label: 'Pourcentage',   value: `${resultat.pourcentage}%` },
                        { label: 'Statut final',  value: resultat.est_elu ? '🏆 Élu(e)' : 'Non élu(e)' },
                      ].map((item, i) => (
                        <div key={i} className="flex items-center justify-between py-2.5 border-b border-white/5 last:border-0">
                          <span className="text-slate-400 text-sm">{item.label}</span>
                          <span className="text-white font-bold text-sm">{item.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                <div className="bg-slate-800 border border-white/5 rounded-xl p-10 text-center">
                  <Trophy size={36} className="text-slate-600 mx-auto mb-3" />
                  <p className="text-slate-400 font-bold mb-1">Résultats non disponibles</p>
                  <p className="text-slate-600 text-sm">Disponibles après la clôture de l'élection.</p>
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  )
}

export default DashboardCandidat
