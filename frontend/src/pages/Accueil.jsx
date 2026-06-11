import { useNavigate } from 'react-router-dom'
import logoIUT from '../assets/logo_iutfv.jpeg'
import { Shield, Users, BarChart2, CheckCircle, GraduationCap, Vote, Lock, Zap } from 'lucide-react'

const Accueil = () => {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen" style={{
      background: 'linear-gradient(135deg, #1a1a6e 0%, #6d28d9 60%, #ec4899 100%)'
    }}>

      {/* Navbar */}
      <nav className="px-8 py-5 flex items-center justify-between" style={{ flexWrap: 'wrap', gap: '15px' }}>
        <div className="flex items-center gap-3">
          {/* Logo plateforme */}
          <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
            <Vote size={24} className="text-white" />
          </div>
          <div>
            <p className="text-white font-bold text-lg leading-tight">Vote Des Délégués</p>
            <p className="text-white/60 text-xs">De Classe</p>
          </div>
        </div>
        <div className="flex items-center gap-3" style={{ flexWrap: 'wrap', justifyContent: 'center' }}>
          <button onClick={() => navigate('/resultats')}
            className="text-white/80 hover:text-white px-4 py-2 rounded-xl hover:bg-white/10 transition-all text-sm">
            Résultats
          </button>
          <button onClick={() => navigate('/inscription')}
            className="text-white/80 hover:text-white px-4 py-2 rounded-xl hover:bg-white/10 transition-all text-sm">
            S'inscrire
          </button>
          <button onClick={() => navigate('/connexion')}
            className="bg-white text-purple-700 font-semibold px-5 py-2 rounded-xl hover:bg-purple-50 transition-all text-sm shadow-lg">
            Se connecter
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="max-w-6xl mx-auto px-8 py-16 flex flex-col lg:flex-row items-center gap-12">

        {/* Texte gauche */}
        <div className="flex-1 text-center lg:text-left">

          {/* Badge université */}
          <div className="flex flex-col items-center lg:items-start mb-8">
            <img src={logoIUT} alt="IUT FV" className="w-48 h-48 lg:w-96 lg:h-96 object-contain mb-3" />
            <span className="text-white/80 text-sm bg-white/10 border border-white/20 rounded-full px-4 py-2">
              IUT Fotso Victor de Bandjoun
            </span>
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight mb-4">
            Vote Des<br />
            <span className="text-pink-300">Délégués</span><br />
            De Classe
          </h1>

          <p className="text-white/70 text-xl mb-4 font-light">
            Votez en toute sécurité 🔐
          </p>

          <p className="text-white/60 text-base mb-10 max-w-md mx-auto lg:mx-0">
            Plateforme officielle d'élection des délégués de classe — 
            Licence Génie Informatique, Université de Dschang.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
            <button onClick={() => navigate('/connexion')}
              className="bg-white text-purple-700 font-bold px-8 py-4 rounded-2xl hover:bg-purple-50 transition-all shadow-xl text-lg">
              Accéder à la plateforme →
            </button>
            <button onClick={() => navigate('/resultats')}
              className="bg-white/10 border border-white/30 text-white font-semibold px-8 py-4 rounded-2xl hover:bg-white/20 transition-all text-lg">
              Voir les résultats
            </button>
          </div>

          {/* Stats */}
          <div className="flex gap-8 mt-10 justify-center lg:justify-start">
            {[
              { value: '100%', label: 'Sécurisé' },
              { value: 'Blockchain', label: 'Immuable' },
              { value: 'Temps réel', label: 'Résultats' },
            ].map((stat, i) => (
              <div key={i} className="text-center">
                <p className="text-white font-bold text-lg">{stat.value}</p>
                <p className="text-white/50 text-xs">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Carte droite */}
        <div className="flex-1 max-w-md w-full">
          <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-3xl p-8 space-y-4">

            <h3 className="text-white font-bold text-xl mb-6 text-center">
              🏛️ Année académique 2025-2026
            </h3>

            {[
              { icon: Shield,    label: 'Reconnaissance Faciale',   desc: 'Vérification biométrique à chaque vote',     color: 'bg-blue-500' },
              { icon: Lock,      label: 'Sécurité Blockchain',       desc: 'Votes immuables et traçables',               color: 'bg-purple-500' },
              { icon: Users,     label: 'Vote Démocratique',         desc: 'Un étudiant = un vote',                      color: 'bg-green-500' },
              { icon: BarChart2, label: 'Résultats en Temps Réel',   desc: 'Visualisation instantanée des résultats',    color: 'bg-orange-500' },
              { icon: Zap,       label: 'Code OTP',                  desc: 'Vérification email sécurisée à l\'inscription', color: 'bg-pink-500' },
            ].map((feature, i) => (
              <div key={i} className="flex items-center gap-4 bg-white/10 rounded-2xl p-4 hover:bg-white/15 transition-all">
                <div className={`w-10 h-10 ${feature.color} rounded-xl flex items-center justify-center flex-shrink-0`}>
                  <feature.icon size={20} className="text-white" />
                </div>
                <div>
                  <p className="text-white font-semibold text-sm">{feature.label}</p>
                  <p className="text-white/60 text-xs">{feature.desc}</p>
                </div>
                <CheckCircle size={16} className="text-green-400 ml-auto flex-shrink-0" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center py-8 border-t border-white/10">
        <p className="text-white/50 text-sm">
          ©️ 2025-2026 Vote Des Délégués De Classe — IUT Fotso Victor de Bandjoun
        </p>
        <p className="text-white/30 text-xs mt-1">
          Département Licence Génie Informatique — Université de Dschang
        </p>
      </div>
    </div>
  )
}

export default Accueil