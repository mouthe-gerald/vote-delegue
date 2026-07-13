import { useNavigate } from 'react-router-dom'
import usePageTitle from '../hooks/usePageTitle'
import { Vote, Home, ArrowLeft } from 'lucide-react'

const NotFound = () => {
  const navigate = useNavigate()
  usePageTitle('Page introuvable')

  return (
    <div className="min-h-screen bg-white shadow-sm flex items-center justify-center px-4">
      <style>{`
        @keyframes fadeUp { from { opacity:0; transform:translateY(24px); } to { opacity:1; transform:translateY(0); } }
        @keyframes float { 0%,100% { transform:translateY(0); } 50% { transform:translateY(-16px); } }
        @keyframes logo-pulse { 0%,100% { transform:scale(1); } 50% { transform:scale(1.12); } }
        .fade1 { animation: fadeUp 0.6s ease 0.1s both; }
        .fade2 { animation: fadeUp 0.6s ease 0.25s both; }
        .fade3 { animation: fadeUp 0.6s ease 0.4s both; }
        .float { animation: float 3s ease-in-out infinite; }
        .logo-pulse { animation: logo-pulse 2s ease-in-out infinite; }
        @keyframes shimmer { 0% { background-position:-200% center; } 100% { background-position:200% center; } }
        .btn-home { background: linear-gradient(90deg,#F0A500 0%,#FFD55A 40%,#F0A500 60%,#F0A500 100%); background-size:200% auto; animation: shimmer 3s linear infinite; }
      `}</style>

      <div className="text-center max-w-md">
        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-12 fade1">
          <div className="w-10 h-10 bg-amber-500 rounded-lg flex items-center justify-center logo-pulse">
            <Vote size={20} className="text-slate-900" />
          </div>
          <span className="text-slate-700 font-bold text-lg">VotingApp</span>
        </div>

        {/* 404 */}
        <div className="float mb-8">
          <h1 className="text-9xl font-extrabold text-amber-500 leading-none">404</h1>
        </div>

        {/* Message */}
        <div className="fade2 mb-8">
          <h2 className="text-2xl font-bold text-slate-700 mb-3">Page introuvable</h2>
          <p className="text-slate-500 text-sm leading-relaxed">
            La page que vous recherchez n'existe pas ou a été déplacée.
          </p>
        </div>

        {/* Boutons */}
        <div className="fade3 flex flex-col sm:flex-row gap-3 justify-center">
          <button onClick={() => navigate(-1)}
            className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-slate-700 border border-white/20 hover:bg-slate-800 hover:border-white/40 transition-all duration-200 text-sm font-medium">
            <ArrowLeft size={16} />
            Retour
          </button>
          <button onClick={() => navigate('/')}
            className="btn-home flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-slate-900 font-bold text-sm hover:scale-105 transition-transform duration-200">
            <Home size={16} />
            Accueil
          </button>
        </div>
      </div>
    </div>
  )
}

export default NotFound
