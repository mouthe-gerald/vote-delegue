import { useState, useEffect, useCallback } from 'react'
import usePageTitle from '../hooks/usePageTitle'
import { useNavigate, Link } from 'react-router-dom'
import { electionAPI, resultatAPI } from '../services/api'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell,
  LineChart, Line, Legend
} from 'recharts'
import { Trophy, ArrowLeft, User, Award, RefreshCw, Vote } from 'lucide-react'
import toast from 'react-hot-toast'

const ResultatsPage = () => {

  const [elections, setElections]       = useState([])
  const [election, setElection]         = useState(null)
  const [resultats, setResultats]       = useState([])
  const [totalVotants, setTotalVotants] = useState(0)
  const [loading, setLoading]           = useState(true)
  const [lastUpdate, setLastUpdate]     = useState(null)
  const navigate                        = useNavigate()
  usePageTitle('Résultats')

  const COULEURS = ['#F0A500', '#3B82F6', '#10B981', '#8B5CF6', '#EF4444', '#06B6D4']

  const chargerElections = useCallback(async () => {
    try {
      const { data } = await electionAPI.liste()
      setElections(data)
      const cible = data.find(e => e.statut === 'EN_COURS') || data.find(e => e.statut === 'CLOTUREE') || data.find(e => e.statut === 'RESULTATS_PUBLIES')
      if (cible) chargerResultats(cible)
    } catch { toast.error('Erreur de chargement.') }
    finally { setLoading(false) }
  }, [])

  const chargerResultats = async (elec) => {
    try {
      setElection(elec)
      try {
        if (elec.statut === 'EN_COURS') await resultatAPI.calculer(elec.id)
        const { data } = await resultatAPI.consulter(elec.id)
        setResultats(data.resultats || [])
        setTotalVotants(data.total_votants || 0)
        setLastUpdate(new Date())
      } catch {}
    } catch {}
  }

  useEffect(() => { chargerElections() }, [chargerElections])

  useEffect(() => {
    if (!election) return
    const interval = setInterval(() => chargerResultats(election), 5000)
    return () => clearInterval(interval)
  }, [election])

  const dataGraphique = resultats.map(r => ({
    name:        r.candidat_nom?.split(' ')[0] || 'Candidat',
    nomComplet:  r.candidat_nom,
    voix:        r.nb_voix,
    pourcentage: r.pourcentage,
    elu:         r.est_elu,
  }))

  const elu = resultats.find(r => r.est_elu)

  if (loading) return (
    <div className="min-h-screen bg-white">
      <style>{`
        @keyframes skeleton-wave { 0% { background-position:-200% 0; } 100% { background-position:200% 0; } }
        .skeleton { background: linear-gradient(90deg, #1e293b 25%, #334155 50%, #1e293b 75%); background-size:200% 100%; animation: skeleton-wave 1.5s ease-in-out infinite; border-radius:8px; }
      `}</style>
      <div className="h-14 bg-blue-50 border-b border-gray-200 px-6 flex items-center gap-3">
        <div className="skeleton h-8 w-8" />
        <div className="skeleton h-5 w-40" />
      </div>
      <div className="max-w-4xl mx-auto px-4 py-6 flex flex-col gap-4">
        <div className="flex gap-3">
          {[1,2].map(i => <div key={i} className="skeleton h-9 w-40" />)}
        </div>
        <div className="bg-white rounded-xl p-5 flex flex-col gap-4">
          <div className="skeleton h-6 w-32" />
          {[1,2,3].map(i => (
            <div key={i} className="flex items-center gap-4">
              <div className="skeleton h-8 w-8 rounded-full" />
              <div className="skeleton h-5 flex-1" />
              <div className="skeleton h-5 w-16" />
            </div>
          ))}
        </div>
        <div className="skeleton h-64 w-full" />
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-white">
      <style>{`
        @keyframes fadeUp { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }
        .fade1 { animation: fadeUp 0.5s ease 0.1s both; }
        .fade2 { animation: fadeUp 0.5s ease 0.25s both; }
        .fade3 { animation: fadeUp 0.5s ease 0.4s both; }
        @keyframes logo-pulse { 0%,100% { transform:scale(1); } 50% { transform:scale(1.1); } }
        .logo-pulse { animation: logo-pulse 2s ease-in-out infinite; }
        @keyframes trophy-bounce { 0%,100% { transform:translateY(0); } 50% { transform:translateY(-8px); } }
        .trophy-bounce { animation: trophy-bounce 2s ease-in-out infinite; }
        @keyframes bar-grow { from { width:0; } to { width:var(--bar-width); } }
        .bar-animated { animation: bar-grow 1s ease-out forwards; width: var(--bar-width); }
      `}</style>

      {/* Header */}
      <header className="bg-blue-50 border-b border-gray-200 px-4 sm:px-6 h-14 flex items-center justify-between fade1">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)}
            className="w-8 h-8 flex items-center justify-center rounded-lg bg-blue-50 hover:bg-blue-50 text-gray-500 hover:text-gray-800 transition-all">
            <ArrowLeft size={16} />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-1 h-5 bg-amber-500 rounded-full" />
            <div>
              <h1 className="text-gray-800 font-bold text-sm">Résultats de l'Élection</h1>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {lastUpdate && (
            <div className="hidden sm:flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-lg">
              <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
              <span className="text-emerald-400 text-xs">{lastUpdate.toLocaleTimeString('fr-FR')}</span>
            </div>
          )}
          <button onClick={() => election && chargerResultats(election)}
            className="w-8 h-8 flex items-center justify-center rounded-lg bg-blue-50 hover:bg-blue-50 text-gray-500 hover:text-gray-800 transition-all">
            <RefreshCw size={14} />
          </button>
          <Link to="/" className="flex items-center gap-2 bg-amber-500 text-slate-900 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-amber-400 transition-all">
            <Vote size={13} /> Accueil
          </Link>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6">

        {/* Sélecteur élection */}
        {elections.length > 1 && (
          <div className="bg-white border border-gray-200 rounded-xl p-4 mb-6">
            <div className="flex gap-2 flex-wrap">
              {elections.map(e => (
                <button key={e.id} onClick={() => chargerResultats(e)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    election?.id === e.id
                      ? 'bg-amber-500 text-slate-900'
                      : 'bg-blue-50 text-gray-500 hover:bg-blue-50 border border-gray-300'
                  }`}>
                  {e.titre}
                </button>
              ))}
            </div>
          </div>
        )}

        {election ? (
          <>
            {/* Info élection */}
            <div className="bg-white border border-gray-200 rounded-xl p-5 mb-6">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-amber-500/15 rounded-xl flex items-center justify-center">
                    <Trophy size={24} className="text-amber-500" />
                  </div>
                  <div>
                    <h2 className="text-gray-800 font-bold text-lg">{election.titre}</h2>
                    <p className="text-gray-500 text-sm">{election.annee_academique}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium border ${
                    election.statut === 'EN_COURS'
                      ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20'
                      : election.statut === 'CLOTUREE'
                      ? 'bg-amber-500/15 text-amber-400 border-amber-500/20'
                      : 'bg-blue-500/15 text-blue-400 border-blue-500/20'
                  }`}>
                    {election.statut === 'EN_COURS' && <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />}
                    {election.statut === 'EN_COURS' ? 'En cours — temps réel' : election.statut === 'CLOTUREE' ? 'Élection clôturée — Résultats finaux' : 'Résultats officiels'}
                  </span>
                  <span className="bg-amber-500/15 text-amber-400 border border-amber-500/20 px-3 py-1.5 rounded-lg text-xs font-medium">
                    {totalVotants} vote(s)
                  </span>
                </div>
              </div>
            </div>

            {/* Élu */}
            {elu && elu.nb_voix > 0 && (
              <div className="bg-gradient-to-r from-amber-500/20 to-amber-600/10 border border-amber-500/30 rounded-xl p-5 mb-6">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-amber-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                    {elu.candidat_photo
                      ? <img src={elu.candidat_photo} alt={elu.candidat_nom} className="w-full h-full rounded-full object-cover" />
                      : <Award size={28} className="text-amber-500" />
                    }
                  </div>
                  <div>
                    <p className="text-amber-400 text-xs font-semibold mb-1">
                      {election.statut === 'EN_COURS' ? '🏆 EN TÊTE' : '🏆 DÉLÉGUÉ ÉLU'}
                    </p>
                    <h3 className="text-gray-800 font-bold text-xl">{elu.candidat_nom}</h3>
                    <p className="text-gray-500 text-sm">{elu.nb_voix} votes — {elu.pourcentage}%</p>
                  </div>
                </div>
              </div>
            )}

            {/* Graphique barres */}
            {dataGraphique.length > 0 && totalVotants > 0 && (
              <div className="bg-white border border-gray-200 rounded-xl p-5 mb-6">
                <div className="flex items-center gap-2 mb-5">
                  <div className="w-1 h-5 bg-amber-500 rounded-full" />
                  <h3 className="text-gray-800 font-bold text-sm">Résultats du scrutin</h3>
                  {election.statut === 'EN_COURS' && (
                    <span className="text-xs bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full ml-1">
                      Temps réel
                    </span>
                  )}
                </div>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={dataGraphique} margin={{ top: 10, right: 10, left: -10, bottom: 50 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#94A3B8' }} angle={-30} textAnchor="end" />
                    <YAxis tick={{ fontSize: 11, fill: '#94A3B8' }} />
                    <Tooltip content={({ active, payload }) => {
                      if (active && payload?.length) {
                        const d = payload[0].payload
                        return (
                          <div className="bg-blue-100 border border-gray-300 rounded-xl p-3 shadow-xl">
                            <p className="text-gray-800 font-bold text-sm mb-1">{d.nomComplet}</p>
                            <p className="text-amber-400 text-xs">{d.voix} votes</p>
                            <p className="text-gray-500 text-xs">{d.pourcentage}%</p>
                          </div>
                        )
                      }
                      return null
                    }} />
                    <Bar dataKey="voix" radius={[6, 6, 0, 0]}>
                      {dataGraphique.map((entry, i) => (
                        <Cell key={i} fill={entry.elu ? '#F0A500' : COULEURS[i % COULEURS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Graphique courbe */}
            {dataGraphique.length > 0 && totalVotants > 0 && (
              <div className="bg-white border border-gray-200 rounded-xl p-5 mb-6">
                <div className="flex items-center gap-2 mb-5">
                  <div className="w-1 h-5 bg-amber-500 rounded-full" />
                  <h3 className="text-gray-800 font-bold text-sm">Évolution — Courbe comparative</h3>
                </div>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={dataGraphique} margin={{ top: 10, right: 10, left: -10, bottom: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#94A3B8' }} />
                    <YAxis tick={{ fontSize: 11, fill: '#94A3B8' }} />
                    <Tooltip content={({ active, payload }) => {
                      if (active && payload?.length) {
                        const d = payload[0].payload
                        return (
                          <div className="bg-blue-100 border border-gray-300 rounded-xl p-3 shadow-xl">
                            <p className="text-gray-800 font-bold text-sm mb-1">{d.nomComplet}</p>
                            <p className="text-amber-400 text-xs">{d.voix} votes</p>
                            <p className="text-blue-400 text-xs">{d.pourcentage}%</p>
                          </div>
                        )
                      }
                      return null
                    }} />
                    <Legend wrapperStyle={{ color: '#94A3B8', fontSize: '12px' }} />
                    <Line type="monotone" dataKey="voix" stroke="#F0A500" strokeWidth={2}
                      dot={{ fill: '#F0A500', r: 4 }} name="Votes" />
                    <Line type="monotone" dataKey="pourcentage" stroke="#3B82F6" strokeWidth={2}
                      dot={{ fill: '#3B82F6', r: 4 }} name="Pourcentage %" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Tableau */}
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-1 h-5 bg-amber-500 rounded-full" />
                  <h3 className="text-gray-800 font-bold text-sm">Tableau des résultats</h3>
                </div>
                <span className="text-gray-500 text-xs">{totalVotants} votant(s)</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      {['Rang', 'Candidat', 'Votes', 'Pourcentage', 'Statut'].map(h => (
                        <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-gray-400">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {resultats.length === 0 ? (
                      <tr><td colSpan={5} className="px-5 py-10 text-center text-gray-400 text-sm">
                        Aucun vote exprimé pour le moment.
                      </td></tr>
                    ) : resultats.map((r, i) => (
                      <tr key={r.id} className={`border-t border-gray-200 transition-colors ${r.est_elu ? 'bg-amber-500/5' : 'hover:bg-white'}`}>
                        <td className="px-5 py-3.5">
                          <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                            i === 0 ? 'bg-amber-500/20 text-amber-400' : 'bg-blue-50 text-gray-400'
                          }`}>{i + 1}</span>
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
                              {r.candidat_photo
                                ? <img src={r.candidat_photo} alt={r.candidat_nom} className="w-full h-full rounded-lg object-cover" />
                                : <User size={14} className="text-gray-500" />
                              }
                            </div>
                            <span className="text-gray-800 text-sm font-medium">{r.candidat_nom}</span>
                          </div>
                        </td>
                        <td className="px-5 py-3.5 text-gray-800 font-bold text-sm">{r.nb_voix}</td>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 bg-blue-50 rounded-full h-1.5 min-w-16">
                              <div className="bg-amber-500 h-1.5 rounded-full bar-animated"
                                style={{ '--bar-width': `${r.pourcentage}%` }} />
                            </div>
                            <span className="text-gray-600 text-xs w-10">{r.pourcentage}%</span>
                          </div>
                        </td>
                        <td className="px-5 py-3.5">
                          {r.est_elu
                            ? <span className="bg-amber-500/15 text-amber-400 border border-amber-500/20 px-2.5 py-1 rounded-full text-xs font-medium">
                                {election.statut === 'EN_COURS' ? '🏆 En tête' : '🏆 Élu'}
                              </span>
                            : <span className="bg-blue-50 text-gray-400 border border-gray-300 px-2.5 py-1 rounded-full text-xs">
                                Candidat
                              </span>
                          }
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        ) : (
          <div className="text-center py-20">
            <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Trophy size={32} className="text-gray-500" />
            </div>
            <h3 className="text-gray-500 font-bold text-lg mb-2">Aucun résultat disponible</h3>
            <p className="text-gray-400 text-sm">Les résultats seront publiés après la clôture de l'élection.</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default ResultatsPage
