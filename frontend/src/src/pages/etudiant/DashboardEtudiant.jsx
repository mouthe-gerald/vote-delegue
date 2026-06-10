import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { electionAPI, voteAPI } from '../../services/api'
import {
  GraduationCap, Vote, CheckCircle, Clock, LogOut,
  Bell, Search, ChevronRight, User, BarChart2,
  BookOpen, Calendar, Shield
} from 'lucide-react'
import toast from 'react-hot-toast'

const DashboardEtudiant = () => {
  const { user, deconnexion }         = useAuth()
  const [elections, setElections]     = useState([])
  const [droitVote, setDroitVote]     = useState(null)
  const [loading, setLoading]         = useState(true)
  const [activeMenu, setActiveMenu]   = useState('dashboard')
  const navigate                      = useNavigate()

  useEffect(() => {
    chargerDonnees()
  }, [])

  const chargerDonnees = async () => {
    try {
      const { data } = await electionAPI.liste()
      setElections(data)
      const electionActive = data.find(e => e.statut === 'EN_COURS')
      if (electionActive) {
        const { data: droit } = await voteAPI.verifierDroit(electionActive.id)
        setDroitVote({ ...droit, election: electionActive })
      }
    } catch (err) {
      toast.error('Erreur lors du chargement.')
    } finally {
      setLoading(false)
    }
  }

  const handleDeconnexion = async () => {
    await deconnexion()
    navigate('/connexion')
  }

  const profil = user?.profil

  const menuItems = [
    { id: 'dashboard', label: 'Tableau de bord', icon: BarChart2 },
    { id: 'profil',    label: 'Mon Profil',       icon: User },
    { id: 'vote',      label: 'Voter',             icon: Vote },
    { id: 'resultats', label: 'Résultats',         icon: CheckCircle },
    { id: 'candidature', label: 'Candidature',     icon: BookOpen },
  ]

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-purple-50">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-purple-600 font-medium">Chargement...</p>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen flex bg-purple-50">

      {/* Sidebar */}
      <div className="w-72 min-h-screen flex flex-col"
        style={{ background: 'linear-gradient(180deg, #6d28d9 0%, #7c3aed 100%)' }}>

        {/* Logo */}
        <div className="p-6 border-b border-white/10">
          <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <GraduationCap size={32} className="text-white" />
          </div>
          <p className="text-white font-bold text-center text-sm">Vote Délégué</p>
          <p className="text-white/60 text-xs text-center">Licence GI</p>
        </div>

        {/* Menu */}
        <nav className="flex-1 p-4 space-y-1">
          {menuItems.map(item => (
            <button key={item.id}
              onClick={() => {
                setActiveMenu(item.id)
                if (item.id === 'vote') navigate('/etudiant/voter')
                if (item.id === 'resultats') navigate('/resultats')
                if (item.id === 'candidature') navigate('/etudiant/candidature')
              }}
              className={activeMenu === item.id ? 'sidebar-item-active w-full' : 'sidebar-item w-full'}>
              <item.icon size={20} />
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        {/* Déconnexion */}
        <div className="p-4 border-t border-white/10">
          <button onClick={handleDeconnexion}
            className="sidebar-item w-full text-red-300 hover:text-red-200 hover:bg-red-500/20">
            <LogOut size={20} />
            <span>Déconnexion</span>
          </button>
        </div>
      </div>

      {/* Contenu principal */}
      <div className="flex-1 flex flex-col">

        {/* Header */}
        <div className="bg-white shadow-sm px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3 bg-gray-100 rounded-xl px-4 py-2 w-72">
            <Search size={18} className="text-gray-400" />
            <input placeholder="Rechercher..." className="bg-transparent outline-none text-sm text-gray-600 w-full" />
          </div>
          <div className="flex items-center gap-4">
            <button className="relative p-2 hover:bg-gray-100 rounded-xl">
              <Bell size={20} className="text-gray-600" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
            </button>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                <User size={20} className="text-purple-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-800">
                  {user?.prenom} {user?.nom}
                </p>
                <p className="text-xs text-gray-500">{profil?.niveau}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 p-8">

          {/* Bannière */}
          <div className="rounded-3xl p-8 mb-8 flex items-center justify-between overflow-hidden relative"
            style={{ background: 'linear-gradient(135deg, #6d28d9 0%, #8b5cf6 100%)' }}>
            <div className="relative z-10">
              <p className="text-white/70 text-sm mb-1">
                {new Date().toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
              <h2 className="text-3xl font-bold text-white mb-2">
                Bienvenue, {user?.prenom} ! 👋
              </h2>
              <p className="text-white/80">Restez informé de l'actualité électorale</p>
            </div>
            <div className="w-32 h-32 bg-white/10 rounded-full absolute -right-8 -top-8" />
            <div className="w-24 h-24 bg-white/10 rounded-full absolute right-16 -bottom-8" />
            <GraduationCap size={80} className="text-white/20 relative z-10" />
          </div>

          {/* Cartes statistiques */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {/* Statut vote */}
            <div className="card border-2 border-purple-100">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                  <Vote size={24} className="text-purple-600" />
                </div>
                <div>
                  <p className="text-gray-500 text-sm">Statut Vote</p>
                  <p className="font-bold text-gray-800">
                    {profil?.a_vote ? 'Voté ✓' : 'Non voté'}
                  </p>
                </div>
              </div>
            </div>

            {/* Élection active */}
            <div className="card border-2 border-green-100">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                  <Clock size={24} className="text-green-600" />
                </div>
                <div>
                  <p className="text-gray-500 text-sm">Élection</p>
                  <p className="font-bold text-gray-800">
                    {elections.find(e => e.statut === 'EN_COURS')
                      ? 'En cours'
                      : elections.find(e => e.statut === 'PLANIFIEE')
                        ? 'Planifiée'
                        : 'Aucune'}
                  </p>
                </div>
              </div>
            </div>

            {/* Sécurité */}
            <div className="card border-2 border-blue-100">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                  <Shield size={24} className="text-blue-600" />
                </div>
                <div>
                  <p className="text-gray-500 text-sm">Sécurité</p>
                  <p className="font-bold text-gray-800">Blockchain ✓</p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            {/* Profil étudiant */}
            <div className="card">
              <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                <User size={20} className="text-purple-600" /> Mon Profil
              </h3>
              <div className="space-y-3">
                {[
                  { label: 'Nom complet', value: `${user?.prenom} ${user?.nom}` },
                  { label: 'Matricule',   value: user?.matricule },
                  { label: 'Filière',     value: profil?.filiere },
                  { label: 'Niveau',      value: profil?.niveau },
                  { label: 'Email',       value: user?.email },
                ].map((item, i) => (
                  <div key={i} className="flex justify-between py-2 border-b border-gray-100 last:border-0">
                    <span className="text-gray-500 text-sm">{item.label}</span>
                    <span className="font-medium text-gray-800 text-sm">{item.value || '—'}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Action vote */}
            <div className="card">
              <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                <Vote size={20} className="text-purple-600" /> Action de Vote
              </h3>

              {droitVote ? (
                <div className="space-y-4">
                  <div className={`p-4 rounded-xl ${droitVote.peut_voter ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                    <p className={`font-semibold ${droitVote.peut_voter ? 'text-green-700' : 'text-red-700'}`}>
                      {droitVote.peut_voter ? '✅ Vous pouvez voter' : '❌ ' + droitVote.raison}
                    </p>
                    <p className="text-sm text-gray-600 mt-1">{droitVote.election?.titre}</p>
                  </div>
                  {droitVote.peut_voter && (
                    <button onClick={() => navigate('/etudiant/voter')}
                      className="btn-primary w-full flex items-center justify-center gap-2">
                      <Vote size={18} /> Voter maintenant
                      <ChevronRight size={18} />
                    </button>
                  )}
                </div>
              ) : (
                <div className="p-4 bg-gray-50 rounded-xl text-center">
                  <Calendar size={32} className="text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-500 text-sm">Aucune élection en cours</p>
                </div>
              )}

              {/* Historique */}
              {profil?.a_vote && profil?.vote_tx_hash && (
                <div className="mt-4 p-3 bg-purple-50 rounded-xl">
                  <p className="text-xs font-semibold text-purple-700 mb-1">Hash Blockchain</p>
                  <p className="text-xs text-purple-600 font-mono break-all">
                    {profil.vote_tx_hash}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DashboardEtudiant