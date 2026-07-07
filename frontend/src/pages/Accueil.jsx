import { useNavigate, Link } from 'react-router-dom'
import usePageTitle from '../hooks/usePageTitle'
import { useState, useEffect } from 'react'
import { Shield, Vote, BarChart2, Users, Fingerprint, Mail, Phone, MapPin, ChevronRight, CheckCircle, Lock, Zap, Eye, Menu, X } from 'lucide-react'
import toast from 'react-hot-toast'

const Accueil = () => {
  const navigate = useNavigate()
  usePageTitle('Accueil')
  const [menuOpen, setMenuOpen] = useState(false)
  const [contactForm, setContactForm] = useState({ nom: '', email: '', message: '' })
  const [contactLoading, setContactLoading] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    const els = document.querySelectorAll('.scroll-anim')
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible') })
    }, { threshold: 0.15 })
    els.forEach(el => observer.observe(el))
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    const els = document.querySelectorAll('.scroll-anim')
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible') })
    }, { threshold: 0.15 })
    els.forEach(el => observer.observe(el))
    return () => observer.disconnect()
  }, [])

  const handleContact = async (e) => {
    e.preventDefault()
    if (!contactForm.nom || !contactForm.email || !contactForm.message) {
      toast.error('Veuillez remplir tous les champs.')
      return
    }
    setContactLoading(true)
    await new Promise(r => setTimeout(r, 1000))
    toast.success('Message envoyé ! Nous vous répondrons bientôt.')
    setContactForm({ nom: '', email: '', message: '' })
    setContactLoading(false)
  }

  return (
    <div className="font-sans text-slate-900">
      <style>{`
        @keyframes fadeUp { from { opacity:0; transform:translateY(24px); } to { opacity:1; transform:translateY(0); } }
        @keyframes shimmer { 0% { background-position:-200% center; } 100% { background-position:200% center; } }
        @keyframes pulse-ring { 0%,100% { box-shadow:0 0 0 0 rgba(240,165,0,0.4); } 50% { box-shadow:0 0 0 6px rgba(240,165,0,0); } }
        @keyframes slideDown { from { opacity:0; transform:translateY(-8px); } to { opacity:1; transform:translateY(0); } }
        .fade1 { animation: fadeUp 0.6s ease 0.1s both; }
        .fade2 { animation: fadeUp 0.6s ease 0.25s both; }
        .fade3 { animation: fadeUp 0.6s ease 0.4s both; }
        .fade4 { animation: fadeUp 0.6s ease 0.55s both; }
        .fade5 { animation: fadeUp 0.6s ease 0.7s both; }
        .fade6 { animation: fadeUp 0.6s ease 0.85s both; }
        .shimmer-btn { background: linear-gradient(90deg,#F0A500 0%,#FFD55A 40%,#F0A500 60%,#F0A500 100%); background-size:200% auto; }
        .shimmer-btn:hover { animation: shimmer 1.2s linear infinite; }
        .nav-link { position:relative; }
        .nav-link::after { content:''; position:absolute; bottom:-2px; left:0; width:0; height:2px; background:#F0A500; transition:width 0.3s ease; }
        .nav-link:hover::after { width:100%; }
        .card-hover { transition: transform 0.3s ease, box-shadow 0.3s ease; }
        .card-hover:hover { transform:translateY(-4px); box-shadow:0 12px 32px rgba(0,0,0,0.1); }
        .slide-down { animation: slideDown 0.3s ease forwards; }
        @keyframes logo-pulse { 0%,100% { transform:scale(1); } 50% { transform:scale(1.12); } }
        .logo-pulse { animation: logo-pulse 2s ease-in-out infinite; }
        .btn-inscrire { position:relative; overflow:hidden; }
        .btn-inscrire::before { content:''; position:absolute; top:0; left:-100%; width:100%; height:100%; background:#F0A500; transition:left 0.4s ease; z-index:0; }
        .btn-inscrire:hover::before { left:0; }
        .btn-inscrire span { position:relative; z-index:1; }
        .btn-connecter { position:relative; overflow:hidden; }
        .btn-connecter::before { content:''; position:absolute; top:0; left:-100%; width:100%; height:100%; background:#FFD55A; transition:left 0.4s ease; z-index:0; }
        .btn-connecter:hover::before { left:0; }
        .btn-connecter span { position:relative; z-index:1; }
        .scroll-anim { opacity:0; transform:translateY(28px); transition: opacity 0.6s ease, transform 0.6s ease; }
        .scroll-anim.visible { opacity:1; transform:translateY(0); }
      `}</style>

      {/* NAVBAR */}
      <nav className={`fixed top-0 left-0 right-0 z-50 border-b-2 border-amber-500 transition-all duration-300 ${scrolled ? 'bg-slate-900/95 backdrop-blur-md shadow-lg' : 'bg-slate-900'}`}>
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-amber-500 rounded-lg flex items-center justify-center logo-pulse">
              <Vote size={18} className="text-slate-900" />
            </div>
            <span className="text-white font-bold text-base">VotingApp</span>
          </div>
          <div className="hidden md:flex items-center gap-6">
            <a href="#apropos" className="nav-link text-slate-400 hover:text-white text-sm transition-colors">À propos</a>
            <a href="#fonctionnalites" className="nav-link text-slate-400 hover:text-white text-sm transition-colors">Fonctionnalités</a>
            <a href="#contact" className="nav-link text-slate-400 hover:text-white text-sm transition-colors">Contact</a>
            <Link to="/resultats" className="nav-link text-slate-400 hover:text-white text-sm transition-colors">Résultats</Link>
            <button onClick={() => navigate('/inscription')}
              className="btn-inscrire text-amber-500 border border-amber-500 px-4 py-2 rounded-lg text-sm font-semibold hover:text-slate-900 transition-all duration-200">
              <span>S'inscrire</span>
            </button>
            <button onClick={() => navigate('/connexion')}
              className="btn-connecter text-white px-4 py-2 rounded-lg text-sm font-bold transition-all duration-200">
              <span>Se connecter</span>
            </button>
          </div>
          <button className="md:hidden text-white" onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
        {menuOpen && (
          <div className="md:hidden bg-slate-800 border-t border-slate-700 px-4 py-4 flex flex-col gap-3 slide-down">
            <a href="#apropos" className="text-slate-300 text-sm py-2 hover:text-amber-500 transition-colors" onClick={() => setMenuOpen(false)}>À propos</a>
            <a href="#fonctionnalites" className="text-slate-300 text-sm py-2 hover:text-amber-500 transition-colors" onClick={() => setMenuOpen(false)}>Fonctionnalités</a>
            <a href="#contact" className="text-slate-300 text-sm py-2 hover:text-amber-500 transition-colors" onClick={() => setMenuOpen(false)}>Contact</a>
            <Link to="/resultats" className="text-slate-300 text-sm py-2 hover:text-amber-500 transition-colors" onClick={() => setMenuOpen(false)}>Résultats</Link>
            <div className="flex gap-3 pt-2">
              <button onClick={() => navigate('/inscription')} className="flex-1 text-amber-500 border border-amber-500 py-2 rounded-lg text-sm font-semibold">S'inscrire</button>
              <button onClick={() => navigate('/connexion')} className="flex-1 shimmer-btn text-slate-900 py-2 rounded-lg text-sm font-bold">Se connecter</button>
            </div>
          </div>
        )}
      </nav>

      {/* HERO */}
      <section className="min-h-screen bg-slate-900 flex items-center pt-16 relative">
        <div className="absolute inset-0" style={{backgroundImage:'radial-gradient(circle at 20% 50%, rgba(21,101,192,0.3) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(240,165,0,0.1) 0%, transparent 40%)'}} />
        <div className="max-w-6xl mx-auto px-4 py-16 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center relative z-10">
          <div>
            <div className="fade1 inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/30 rounded-full px-4 py-1.5 mb-8">
              <div className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse" />
            </div>
            <h1 className="fade2 text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white leading-normal mb-6">
              Election<br />
              <span className="text-amber-500">Transparente</span>
            </h1>
            <p className="fade3 text-slate-400 text-lg leading-relaxed mb-8 max-w-lg">
              Plateforme officielle de vote électronique sécurisée par la blockchain.
            </p>
            <div className="fade4 flex flex-wrap gap-4 mb-10">
              <button onClick={() => navigate('/connexion')}
                className="btn-acceder shimmer-btn flex items-center gap-2 text-slate-900 px-6 py-3.5 rounded-lg font-bold text-sm hover:shadow-lg hover:shadow-amber-500/25 transition-all duration-200">
                Accéder à la plateforme <ChevronRight size={16} />
              </button>
              <button onClick={() => navigate('/resultats')}
                className="px-6 py-3.5 rounded-lg font-semibold text-sm text-white border border-white/20 hover:bg-white/10 hover:border-white/40 hover:scale-105 transition-all duration-200">
                Voir les résultats
              </button>
            </div>
            <div className="fade5 flex gap-8 pt-8 border-t border-white/10">
              {[{value:'100%',label:'Sécurisé'},{value:'Blockchain',label:'Immuable'},{value:'Temps réel',label:'Résultats'}].map((s,i) => (
                <div key={i} className="group cursor-default">
                  <div className="text-amber-500 font-bold text-lg group-hover:scale-110 transition-transform duration-200 inline-block">{s.value}</div>
                  <div className="text-slate-500 text-xs">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
          <div className="fade3 bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-sm">
            <div className="flex items-center gap-2 mb-5">
              <div className="w-1 h-5 bg-amber-500 rounded-full" />
              <span className="text-white font-semibold text-sm">Fonctionnalités clés</span>
            </div>
            <div className="flex flex-col gap-3">
              {[
                {icon:Fingerprint,label:'Authentification biométrique',desc:'Empreinte digitale via WebAuthn',color:'#3B82F6'},
                {icon:Lock,label:'Sécurité Blockchain',desc:'Votes immuables et traçables',color:'#10B981'},
                {icon:Users,label:'Vote démocratique',desc:'Un étudiant = un vote',color:'#8B5CF6'},
                {icon:BarChart2,label:'Résultats en temps réel',desc:'Visualisation instantanée',color:'#F59E0B'},
                {icon:Mail,label:'Vérification OTP',desc:"Email sécurisé à l'inscription",color:'#EF4444'},
              ].map((f,i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-white/3 border border-white/5 hover:bg-white/8 hover:border-white/15 transition-all duration-200 cursor-default group">
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-200" style={{background:`${f.color}20`}}>
                    <f.icon size={16} style={{color:f.color}} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-white text-xs font-semibold">{f.label}</div>
                    <div className="text-slate-500 text-xs">{f.desc}</div>
                  </div>
                  <CheckCircle size={14} className="text-emerald-500 flex-shrink-0 group-hover:scale-110 transition-transform duration-200" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* À PROPOS */}
      <section id="apropos" className="bg-slate-50 py-24 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-1 h-8 bg-amber-500 rounded-full" />
            <span className="text-slate-500 text-xs font-semibold tracking-widest uppercase">À propos</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mb-4">
            Une plateforme conçue pour<br className="hidden sm:block" />un vote transparent et automatisé
          </h2>
          <p className="text-slate-500 text-lg max-w-xl leading-relaxed mb-14">
            Développée dans le cadre d'un Projet de Fin d'Études (PFE) en Licence Génie Informatique.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {icon:Shield,title:'Transparence totale',color:'#1565C0',desc:"Chaque vote est enregistré sur la blockchain Ethereum — vérifiable, immuable, et accessible à tous après publication des résultats."},
              {icon:Users,title:'Accès contrôlé',color:'#F0A500',desc:"Seuls les votants officiellement inscrits et vérifiés par l'administration peuvent participer au processus électoral."},
              {icon:Zap,title:'Résultats instantanés',color:'#10B981',desc:"Dès la clôture de l'élection, les résultats sont calculés et publiés en temps réel pour tous."},
            ].map((c,i) => (
              <div key={i} className="scroll-anim card-hover bg-white rounded-xl p-6 border border-slate-100" style={{borderTop:`3px solid ${c.color}`}}>
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-5" style={{background:`${c.color}15`}}>
                  <c.icon size={22} style={{color:c.color}} />
                </div>
                <h3 className="text-base font-bold text-slate-900 mb-2">{c.title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{c.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FONCTIONNALITÉS */}
      <section id="fonctionnalites" className="bg-white py-24 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-1 h-8 bg-amber-500 rounded-full" />
            <span className="text-slate-500 text-xs font-semibold tracking-widest uppercase">Fonctionnalités</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mb-4">Tout ce dont vous avez besoin</h2>
          <p className="text-slate-500 text-lg max-w-md leading-relaxed mb-14">Une suite complète d'outils pour organiser, sécuriser et analyser les élections.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              {icon:Fingerprint,color:'#3B82F6',title:'Biométrie WebAuthn',desc:"Enregistrez votre empreinte digitale lors de l'inscription. Vérifiée à chaque vote."},
              {icon:Lock,color:'#8B5CF6',title:'Blockchain Ethereum',desc:"Chaque vote génère un hash unique enregistré sur Sepolia testnet."},
              {icon:Eye,color:'#10B981',title:'Résultats publics',desc:"Les résultats sont accessibles sans connexion après publication."},
              {icon:Shield,color:'#F0A500',title:'Base étudiants autorisés',desc:"L'administration contrôle qui peut s'inscrire et voter."},
              {icon:Vote,color:'#EF4444',title:'Gestion des élections',desc:"Créez, ouvrez, clôturez et publiez les résultats en quelques clics."},
              {icon:BarChart2,color:'#F59E0B',title:'Tableau de bord analytique',desc:"Visualisez les statistiques en temps réel : participation, classement."},
            ].map((f,i) => (
              <div key={i} className="scroll-anim card-hover flex gap-4 p-5 border border-slate-100 rounded-xl hover:border-amber-500/30 group">
                <div className="w-11 h-11 rounded-xl flex-shrink-0 flex items-center justify-center group-hover:scale-110 transition-transform duration-300" style={{background:`${f.color}15`}}>
                  <f.icon size={20} style={{color:f.color}} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 mb-1 group-hover:text-amber-600 transition-colors duration-200">{f.title}</h3>
                  <p className="text-slate-500 text-xs leading-relaxed">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CONTACT */}
      <section id="contact" className="bg-slate-900 py-24 px-4">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-1 h-8 bg-amber-500 rounded-full" />
              <span className="text-slate-500 text-xs font-semibold tracking-widest uppercase">Contact</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-4">Une question ?<br />Contactez-nous</h2>
            <p className="text-slate-400 text-base leading-relaxed mb-10">L'équipe de développement est disponible pour toute question relative à la plateforme.</p>
            <div className="flex flex-col gap-5">
              {[
                {icon:MapPin,label:'Localisation',value:'IUT Fotso Victor de Bandjoun, Université de Dschang'},
                {icon:Mail,label:'Email',value:'mickymil24@gmail.com'},
                {icon:Phone,label:'Téléphone',value:'+237 657 771 065 / +237 694 215 183'},
              ].map((c,i) => (
                <div key={i} className="flex gap-4 items-start group">
                  <div className="w-10 h-10 rounded-lg flex-shrink-0 flex items-center justify-center bg-amber-500/15 group-hover:bg-amber-500/25 transition-colors duration-200">
                    <c.icon size={16} className="text-amber-500" />
                  </div>
                  <div>
                    <div className="text-slate-500 text-xs mb-1">{c.label}</div>
                    <div className="text-white text-sm font-medium">{c.value}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <form onSubmit={handleContact} className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:border-white/20 transition-colors duration-300">
            <h3 className="text-white font-bold text-base mb-5">Envoyer un message</h3>
            <div className="flex flex-col gap-4">
              <input placeholder="Votre nom" value={contactForm.nom} onChange={e => setContactForm({...contactForm,nom:e.target.value})} className="border border-white/15 rounded-lg px-4 py-3 text-white text-sm outline-none placeholder-slate-500 focus:border-amber-500/50 transition-colors w-full" style={{background:'rgba(255,255,255,0.06)'}} />
              <input placeholder="Votre email" type="email" value={contactForm.email} onChange={e => setContactForm({...contactForm,email:e.target.value})} className="border border-white/15 rounded-lg px-4 py-3 text-white text-sm outline-none placeholder-slate-500 focus:border-amber-500/50 transition-colors w-full" style={{background:'rgba(255,255,255,0.06)'}} />
              <textarea placeholder="Votre message" rows={5} value={contactForm.message} onChange={e => setContactForm({...contactForm,message:e.target.value})} className="border border-white/15 rounded-lg px-4 py-3 text-white text-sm outline-none placeholder-slate-500 resize-none focus:border-amber-500/50 transition-colors w-full" style={{background:'rgba(255,255,255,0.06)'}} />
              <button type="submit" disabled={contactLoading} className="shimmer-btn w-full text-slate-900 py-3 rounded-lg font-bold text-sm hover:scale-[1.02] transition-all duration-200 flex items-center justify-center gap-2">
                {contactLoading ? <div className="w-4 h-4 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" /> : 'Envoyer le message'}
              </button>
            </div>
          </form>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-slate-950 border-t border-white/5 py-8 px-4 text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <div className="w-6 h-6 bg-amber-500 rounded-md flex items-center justify-center">
            <Vote size={12} className="text-slate-900" />
          </div>
          <span className="text-white font-semibold text-sm">VotingApp</span>
        </div>
      </footer>
    </div>
  )
}

export default Accueil
