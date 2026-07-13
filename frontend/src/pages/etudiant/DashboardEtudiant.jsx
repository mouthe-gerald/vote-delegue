import { useState, useEffect } from 'react'
import usePageTitle from '../../hooks/usePageTitle'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { electionAPI, voteAPI, candidatureAPI } from '../../services/api'
import {
  Vote, CheckCircle, LogOut, Bell, ChevronRight, User,
  BarChart2, BookOpen, Calendar, Shield, Clock, Award,
  Menu, X, Hash, Mail, GraduationCap, Layers
} from 'lucide-react'
import toast from 'react-hot-toast'

const DashboardEtudiant = () => {

  const { user, deconnexion }           = useAuth()
  const [elections, setElections]       = useState([])
  const [droitVote, setDroitVote]       = useState(null)
  const [candidature, setCandidature]   = useState(null)
  const [loading, setLoading]           = useState(true)
  const [activeMenu, setActiveMenu]     = useState('dashboard')
  const [sidebarOpen, setSidebarOpen]   = useState(false)
  const navigate                        = useNavigate()

  useEffect(() => { chargerDonnees() }, [])

  const chargerDonnees = async () => {
    try {
      const { data } = await electionAPI.liste()
      setElections(data)
      const electionActive = data.find(e => e.statut === 'EN_COURS')
      if (electionActive) {
        const { data: droit } = await voteAPI.verifierDroit(electionActive.id)
        setDroitVote({ ...droit, election: electionActive })
        const { data: cands } = await candidatureAPI.liste(electionActive.id)
        const maCandidature = cands.find(
          c => c.etudiant_nom === `${user?.prenom} ${user?.nom}`
        )
        if (maCandidature) setCandidature(maCandidature)
      }
    } catch { toast.error('Erreur lors du chargement.') }
    finally { setLoading(false) }
  }

  const handleDeconnexion = async () => { await deconnexion(); navigate('/connexion') }

  const profil = user?.profil

  const menuItems = [
    { id: 'dashboard',   label: 'Tableau de bord', icon: BarChart2 },
    { id: 'profil',      label: 'Mon Profil',       icon: User },
    { id: 'vote',        label: 'Voter',             icon: Vote,     action: () => navigate('/etudiant/voter') },
    { id: 'resultats',   label: 'Résultats',         icon: BarChart2, action: () => navigate('/resultats') },
    { id: 'candidature', label: 'Candidature',       icon: BookOpen,  action: () => navigate('/etudiant/candidature') },
  ]

  if (loading) return (
    <div className="min-h-screen bg-white flex">
      <style>{`
        @keyframes skeleton-wave { 0% { background-position:-200% 0; } 100% { background-position:200% 0; } }
        .skeleton { background: linear-gradient(90deg, #1e293b 25%, #334155 50%, #1e293b 75%); background-size:200% 100%; animation: skeleton-wave 1.5s ease-in-out infinite; border-radius:8px; }
      `}</style>
      <div className="hidden lg:flex flex-col w-64 bg-gray-100 border-r border-gray-200 p-4 gap-3">
        <div className="skeleton h-12 w-full mb-4" />
        {[1,2,3,4].map(i => <div key={i} className="skeleton h-9 w-full" />)}
      </div>
      <div className="flex-1 p-6">
        <div className="skeleton h-8 w-48 mb-6" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          {[1,2,3].map(i => (
            <div key={i} className="bg-gray-50 rounded-xl p-4 flex flex-col gap-3">
              <div className="skeleton h-4 w-20" />
              <div className="skeleton h-8 w-12" />
            </div>
          ))}
        </div>
        <div className="bg-gray-50 rounded-xl p-5 flex flex-col gap-4">
          <div className="skeleton h-6 w-32" />
          {[1,2,3].map(i => <div key={i} className="skeleton h-12 w-full" />)}
        </div>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-white flex">

      {/* Sidebar desktop */}
      <aside className="hidden lg:flex flex-col w-60 bg-gray-100 border-r border-gray-200 flex-shrink-0">
        <div className="p-5 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-amber-500 rounded-lg flex items-center justify-center">
              <Vote size={18} className="text-slate-900" />
            </div>
            <div>
              <div className="text-gray-900 font-bold text-sm">VotingApp</div>
              <div className="text-gray-400 text-xs">Espace étudiant</div>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-3 flex flex-col gap-1">
          {menuItems.map(item => (
            <button key={item.id}
              onClick={() => { setActiveMenu(item.id); item.action && item.action(); setSidebarOpen(false) }}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm w-full text-left transition-all ${
                activeMenu === item.id
                  ? 'bg-amber-500/15 text-amber-400 border border-amber-500/20'
                  : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
              }`}>
              <item.icon size={15} />
              {item.label}
            </button>
          ))}

          {candidature?.statut === 'VALIDEE' && (
            <button onClick={() => navigate('/candidat/dashboard')}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm w-full text-left mt-2 bg-amber-500/10 text-amber-400 border border-amber-500/20 hover:bg-amber-500/20 transition-all">
              <Award size={15} />
              Espace Candidat
              <ChevronRight size={12} className="ml-auto" />
            </button>
          )}
        </nav>

        <div className="p-3 border-t border-gray-200">
          <div className="flex items-center gap-3 px-3 py-2 mb-1">
            <div className="w-8 h-8 bg-amber-500/20 rounded-lg flex items-center justify-center text-amber-500 text-xs font-bold flex-shrink-0">
              {user?.prenom?.[0]}{user?.nom?.[0]}
            </div>
            <div className="min-w-0">
              <div className="text-gray-900 text-xs font-medium truncate">{user?.prenom} {user?.nom}</div>
              <div className="text-gray-400 text-xs truncate">{user?.matricule}</div>
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
          <aside className="relative w-64 bg-gray-100 border-r border-gray-200 flex flex-col z-10">
            <div className="p-5 border-b border-gray-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-amber-500 rounded-lg flex items-center justify-center">
                  <Vote size={18} className="text-slate-900" />
                </div>
                <span className="text-gray-900 font-bold text-sm">VotingApp</span>
              </div>
              <button onClick={() => setSidebarOpen(false)} className="text-gray-500"><X size={18} /></button>
            </div>
            <nav className="flex-1 p-3 flex flex-col gap-1">
              {menuItems.map(item => (
                <button key={item.id}
                  onClick={() => { setActiveMenu(item.id); item.action && item.action(); setSidebarOpen(false) }}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm w-full text-left transition-all ${
                    activeMenu === item.id ? 'bg-amber-500/15 text-amber-400' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
                  }`}>
                  <item.icon size={15} /> {item.label}
                </button>
              ))}
              {candidature?.statut === 'VALIDEE' && (
                <button onClick={() => { navigate('/candidat/dashboard'); setSidebarOpen(false) }}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm w-full text-left mt-2 bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  <Award size={15} /> Espace Candidat <ChevronRight size={12} className="ml-auto" />
                </button>
              )}
            </nav>
            <div className="p-3 border-t border-gray-200">
              <button onClick={handleDeconnexion}
                className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-red-400 hover:bg-red-500/10 text-sm">
                <LogOut size={14} /> Déconnexion
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Topbar */}
        <header className="bg-gray-100 border-b border-gray-200 px-4 sm:px-6 h-14 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <button className="lg:hidden text-gray-500 hover:text-gray-900" onClick={() => setSidebarOpen(true)}>
              <Menu size={20} />
            </button>
            <h1 className="text-gray-900 font-bold text-sm">
              {menuItems.find(m => m.id === activeMenu)?.label || 'Tableau de bord'}
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <button className="relative p-2 text-gray-500 hover:text-gray-900">
              <Bell size={16} />
            </button>
            <div className="hidden sm:flex items-center gap-2 bg-gray-100 rounded-lg px-3 py-1.5">
              <div className="w-6 h-6 bg-amber-500/20 rounded-md flex items-center justify-center text-amber-500 text-xs font-bold">
                {user?.prenom?.[0]}
              </div>
              <span className="text-gray-900 text-xs font-medium">{user?.prenom}</span>
            </div>
          </div>
        </header>

        {/* Body */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">

          {/* Bannière candidat validé */}
          {candidature?.statut === 'VALIDEE' && (
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 mb-5 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Award size={20} className="text-amber-500 flex-shrink-0" />
                <div>
                  <p className="text-amber-400 font-semibold text-sm">Candidature validée !</p>
                  <p className="text-gray-500 text-xs">Accédez à votre espace candidat pour gérer votre programme.</p>
                </div>
              </div>
              <button onClick={() => navigate('/candidat/dashboard')}
                className="flex-shrink-0 flex items-center gap-1 bg-amber-500 text-slate-900 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-amber-400">
                Espace Candidat <ChevronRight size={12} />
              </button>
            </div>
          )}

          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            {[
              { icon: Vote,   label: 'Statut Vote', value: profil?.a_vote ? 'Voté ✓' : 'Non voté', color: '#F0A500' },
              { icon: Clock,  label: 'Élection',    value: elections.find(e => e.statut === 'EN_COURS') ? 'En cours' : elections.find(e => e.statut === 'PLANIFIEE') ? 'Planifiée' : 'Aucune', color: '#10B981' },
              { icon: Shield, label: 'Sécurité',    value: 'Blockchain ✓', color: '#3B82F6' },
            ].map((s, i) => (
              <div key={i} className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: `${s.color}20` }}>
                    <s.icon size={16} style={{ color: s.color }} />
                  </div>
                  <div>
                    <p className="text-gray-500 text-xs">{s.label}</p>
                    <p className="text-gray-900 font-bold text-sm">{s.value}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

            {/* Profil */}
            <div className="bg-gray-50 border border-gray-200 rounded-xl overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-200 flex items-center gap-2">
                <div className="w-1 h-5 bg-amber-500 rounded-full" />
                <h3 className="text-gray-900 font-bold text-sm">Mon Profil</h3>
              </div>
              <div className="p-5">
                <div className="flex items-center gap-4 mb-5">
                  <div className="w-14 h-14 bg-amber-500/15 rounded-xl flex items-center justify-center flex-shrink-0">
                    <span className="text-amber-500 font-bold text-xl">{user?.prenom?.[0]}{user?.nom?.[0]}</span>
                  </div>
                  <div>
                    <p className="text-gray-900 font-bold">{user?.prenom} {user?.nom}</p>
                    <p className="text-gray-500 text-xs">{profil?.filiere || '—'}</p>
                  </div>
                </div>
                <div className="flex flex-col gap-3">
                  {[
                    { icon: Hash,          label: 'Matricule', value: user?.matricule },
                    { icon: GraduationCap, label: 'Filière',   value: profil?.filiere },
                    { icon: Layers,        label: 'Niveau',    value: profil?.niveau },
                    { icon: Mail,          label: 'Email',     value: user?.email },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-3 py-2 border-b border-gray-200 last:border-0">
                      <div className="w-7 h-7 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <item.icon size={12} className="text-gray-500" />
                      </div>
                      <span className="text-gray-500 text-xs w-20 flex-shrink-0">{item.label}</span>
                      <span className="text-gray-900 text-xs font-medium truncate">{item.value || '—'}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Vote */}
            <div className="bg-gray-50 border border-gray-200 rounded-xl overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-200 flex items-center gap-2">
                <div className="w-1 h-5 bg-amber-500 rounded-full" />
                <h3 className="text-gray-900 font-bold text-sm">Action de Vote</h3>
              </div>
              <div className="p-5">
                {droitVote ? (
                  <div className="flex flex-col gap-4">
                    <div className={`p-4 rounded-xl border ${
                      droitVote.peut_voter
                        ? 'bg-emerald-500/10 border-emerald-500/20'
                        : 'bg-red-500/10 border-red-500/20'
                    }`}>
                      <p className={`font-semibold text-sm mb-1 ${droitVote.peut_voter ? 'text-emerald-400' : 'text-red-400'}`}>
                        {droitVote.peut_voter ? '✅ Vous pouvez voter' : '❌ ' + droitVote.raison}
                      </p>
                      <p className="text-gray-500 text-xs">{droitVote.election?.titre}</p>
                    </div>
                    {droitVote.peut_voter && (
                      <button onClick={() => navigate('/etudiant/voter')}
                        className="w-full bg-amber-500 text-slate-900 py-3 rounded-xl font-bold text-sm hover:bg-amber-400 transition-all flex items-center justify-center gap-2">
                        <Vote size={16} /> Voter maintenant <ChevronRight size={14} />
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <div className="w-12 h-12 bg-gray-200 rounded-xl flex items-center justify-center mb-3">
                      <Calendar size={22} className="text-gray-400" />
                    </div>
                    <p className="text-gray-500 text-sm">Aucune élection en cours</p>
                    <p className="text-gray-500 text-xs mt-1">Revenez plus tard</p>
                  </div>
                )}
                {profil?.a_vote && profil?.vote_tx_hash && (
                  <div className="mt-4 p-3 bg-gray-200/50 rounded-xl border border-gray-200 hover:border-amber-500/30 transition-colors">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-gray-400 text-xs">Hash Blockchain</p>
                      <a href={`https://sepolia.etherscan.io/tx/${profil.vote_tx_hash}`}
                        target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-1 bg-amber-500/15 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded-full text-xs font-medium hover:bg-amber-500/25 transition-colors">
                        ✓ Voir sur Etherscan
                      </a>
                    </div>
                    <p className="text-amber-400 font-mono text-xs break-all">{profil.vote_tx_hash}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

export default DashboardEtudiant
