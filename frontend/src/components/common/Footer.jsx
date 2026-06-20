import { Vote } from 'lucide-react'

const Footer = () => {
  return (
    <footer className="bg-slate-950 border-t border-white/5 py-6 px-4 text-center mt-auto">
      <div className="flex items-center justify-center gap-2 mb-2">
        <div className="w-6 h-6 bg-amber-500 rounded-md flex items-center justify-center">
          <Vote size={12} className="text-slate-900" />
        </div>
        <span className="text-white font-semibold text-sm">VotingApp</span>
      </div>
      <p className="text-slate-600 text-xs">© 2025-2026 Plateforme de Vote en Ligne — IUT Fotso Victor de Bandjoun</p>
    </footer>
  )
}

export default Footer
