import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { electionAPI, resultatAPI } from '../services/api'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell,
  LineChart, Line, Legend
} from 'recharts'
import { Trophy, ArrowLeft, User, Award, RefreshCw } from 'lucide-react'
import toast from 'react-hot-toast'

const ResultatsPage = () => {
  const [elections, setElections]     = useState([])
  const [election, setElection]       = useState(null)
  const [resultats, setResultats]     = useState([])
  const [totalVotants, setTotalVotants] = useState(0)
  const [loading, setLoading]         = useState(true)
  const [lastUpdate, setLastUpdate]   = useState(null)
  const navigate                      = useNavigate()

  const COULEURS = ['#f59e0b', '#6d28d9', '#8b5cf6', '#a78bfa', '#c4b5fd', '#ddd6fe']

  const chargerElections = useCallback(async () => {
    try {
      const { data } = await electionAPI.liste()
      setElections(data)
      const publiee = data.find(e => e.statut === 'RESULTATS_PUBLIES')
      const enCours = data.find(e => e.statut === 'EN_COURS')
      const cible   = publiee || enCours
      if (cible) chargerResultats(cible)
    } catch {
      toast.error('Erreur de chargement.')
    } finally {
      setLoading(false)
    }
  }, [])

  const chargerResultats = async (elec) => {
    try {
      setElection(elec)
      if (elec.statut === 'RESULTATS_PUBLIES') {
        const { data } = await resultatAPI.consulter(elec.id)
        setResultats(data.resultats || [])
        setTotalVotants(data.total_votants || 0)
        setLastUpdate(new Date())
      } else if (elec.statut === 'EN_COURS') {
        // Calculer en temps réel
        try {
          await resultatAPI.calculer(elec.id)
          const { data } = await resultatAPI.consulter(elec.id)
          setResultats(data.resultats || [])
          setTotalVotants(data.total_votants || 0)
          setLastUpdate(new Date())
        } catch {}
      }
    } catch {}
  }

  useEffect(() => {
    chargerElections()
  }, [chargerElections])

  // Rafraîchissement automatique toutes les 5 secondes
  useEffect(() => {
    if (!election) return
    const interval = setInterval(() => {
      chargerResultats(election)
    }, 5000)
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
    <div className="min-h-screen flex items-center justify-center bg-blue-50">
      <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="min-h-screen"
      style={{ background: 'linear-gradient(180deg, #dbeafe 0%, #f0f9ff 50%, #ffffff 100%)' }}>

      {/* Header */}
      <div className="bg-white shadow-sm px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-xl">
            <ArrowLeft size={20} className="text-gray-600" />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
              <Trophy size={20} className="text-blue-600" />
            </div>
            <div>
              <h1 className="font-bold text-gray-800">Résultats de l'Élection</h1>
              <p className="text-xs text-gray-500">Licence Génie Informatique</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {lastUpdate && (
            <div className="flex items-center gap-2 bg-green-50 px-3 py-1.5 rounded-xl">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-green-600 text-xs font-medium">
                Mis à jour : {lastUpdate.toLocaleTimeString('fr-FR')}
              </span>
            </div>
          )}
          <button onClick={() => election && chargerResultats(election)}
            className="p-2 hover:bg-gray-100 rounded-xl">
            <RefreshCw size={18} className="text-gray-600" />
          </button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto p-6">

        {/* Sélecteur élection */}
        {elections.length > 1 && (
          <div className="bg-white rounded-2xl shadow-sm p-4 mb-6">
            <div className="flex gap-3 flex-wrap">
              {elections.map(e => (
                <button key={e.id} onClick={() => chargerResultats(e)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all
                    ${election?.id === e.id
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                  {e.titre}
                </button>
              ))}
            </div>
          </div>
        )}

        {election && (
          <>
            {/* Titre élection */}
            <div className="bg-white rounded-2xl shadow-sm p-6 mb-6 text-center">
              <div className="flex items-center justify-center gap-4 mb-4">
                <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center">
                  <Trophy size={32} className="text-blue-600" />
                </div>
                <div className="text-left">
                  <h2 className="text-2xl font-bold text-gray-800">{election.titre}</h2>
                  <p className="text-gray-500">{election.annee_academique}</p>
                </div>
              </div>
              <div className="flex items-center justify-center gap-4">
                <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full ${
                  election.statut === 'EN_COURS'
                    ? 'bg-green-100 text-green-700'
                    : 'bg-blue-100 text-blue-700'
                }`}>
                  {election.statut === 'EN_COURS' && (
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  )}
                  <span className="font-semibold text-sm">
                    {election.statut === 'EN_COURS' ? 'ÉLECTION EN COURS — Mise à jour toutes les 5s' : 'RÉSULTATS OFFICIELS'}
                  </span>
                </div>
                <div className="bg-purple-50 px-3 py-1.5 rounded-full">
                  <span className="text-purple-600 font-semibold text-sm">
                    {totalVotants} vote(s) exprimé(s)
                  </span>
                </div>
              </div>
            </div>

            {/* Élu */}
            {elu && elu.nb_voix > 0 && (
              <div className="bg-gradient-to-r from-yellow-400 to-orange-400 rounded-2xl shadow-lg p-6 mb-6 text-white">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-white/30 rounded-full flex items-center justify-center">
                    {elu.candidat_photo ? (
                      <img src={elu.candidat_photo} alt={elu.candidat_nom}
                        className="w-full h-full rounded-full object-cover" />
                    ) : (
                      <Award size={32} className="text-white" />
                    )}
                  </div>
                  <div>
                    <p className="text-white/80 text-sm font-medium">
                      {election.statut === 'EN_COURS' ? '🏆 EN TÊTE' : '🏆 DÉLÉGUÉ ÉLU'}
                    </p>
                    <h3 className="text-2xl font-bold">{elu.candidat_nom}</h3>
                    <p className="text-white/80">{elu.nb_voix} votes — {elu.pourcentage}%</p>
                  </div>
                </div>
              </div>
            )}

            {/* Graphique */}
            {dataGraphique.length > 0 && totalVotants > 0 && (
              <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
                <h3 className="font-bold text-gray-800 mb-6 flex items-center gap-2">
                  <BarChart size={20} className="text-purple-600" />
                  Résultats du scrutin
                  {election.statut === 'EN_COURS' && (
                    <span className="text-xs bg-green-100 text-green-600 px-2 py-0.5 rounded-full ml-2">
                      En temps réel
                    </span>
                  )}
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={dataGraphique} margin={{ top: 20, right: 20, left: 0, bottom: 60 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} angle={-45} textAnchor="end" />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload?.length) {
                          const d = payload[0].payload
                          return (
                            <div className="bg-white border border-gray-200 rounded-xl p-3 shadow-lg">
                              <p className="font-bold text-gray-800">{d.nomComplet}</p>
                              <p className="text-purple-600">{d.voix} votes</p>
                              <p className="text-gray-500">{d.pourcentage}%</p>
                            </div>
                          )
                        }
                        return null
                      }}
                    />
                    <Bar dataKey="voix" radius={[8, 8, 0, 0]}>
                      {dataGraphique.map((entry, i) => (
                        <Cell key={i} fill={entry.elu ? '#f59e0b' : COULEURS[i % COULEURS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Graphique en courbe */}
{dataGraphique.length > 0 && totalVotants > 0 && (
  <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
    <h3 className="font-bold text-gray-800 mb-6 flex items-center gap-2">
      <BarChart size={20} className="text-purple-600" />
      Évolution des votes — Courbe
    </h3>
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={dataGraphique} margin={{ top: 20, right: 20, left: 0, bottom: 20 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis dataKey="name" tick={{ fontSize: 12 }} />
        <YAxis tick={{ fontSize: 12 }} />
        <Tooltip
          content={({ active, payload }) => {
            if (active && payload?.length) {
              const d = payload[0].payload
              return (
                <div className="bg-white border border-gray-200 rounded-xl p-3 shadow-lg">
                  <p className="font-bold text-gray-800">{d.nomComplet}</p>
                  <p className="text-purple-600">{d.voix} votes</p>
                  <p className="text-gray-500">{d.pourcentage}%</p>
                </div>
              )
            }
            return null
          }}
        />
        <Legend />
        <Line
          type="monotone"
          dataKey="voix"
          stroke="#6d28d9"
          strokeWidth={3}
          dot={{ fill: '#6d28d9', strokeWidth: 2, r: 6 }}
          activeDot={{ r: 8 }}
          name="Votes"
        />
        <Line
          type="monotone"
          dataKey="pourcentage"
          stroke="#ec4899"
          strokeWidth={3}
          dot={{ fill: '#ec4899', strokeWidth: 2, r: 6 }}
          activeDot={{ r: 8 }}
          name="Pourcentage %"
        />
      </LineChart>
    </ResponsiveContainer>
  </div>
)}

            {/* Tableau */}
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
              <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                <h3 className="font-bold text-gray-800">Tableau des résultats</h3>
                <span className="text-gray-500 text-sm">{totalVotants} votant(s)</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      {['Rang', 'Candidat', 'Votes', 'Pourcentage', 'Statut'].map(h => (
                        <th key={h} className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {resultats.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-8 text-center text-gray-400">
                          Aucun vote exprimé pour le moment.
                        </td>
                      </tr>
                    ) : resultats.map((r, i) => (
                      <tr key={r.id} className={r.est_elu ? 'bg-yellow-50' : ''}>
                        <td className="px-6 py-4">
                          <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold
                            ${i === 0 ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-600'}`}>
                            {i + 1}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                              {r.candidat_photo ? (
                                <img src={r.candidat_photo} alt={r.candidat_nom}
                                  className="w-full h-full rounded-xl object-cover" />
                              ) : (
                                <User size={18} className="text-purple-600" />
                              )}
                            </div>
                            <span className="font-semibold text-gray-800">{r.candidat_nom}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 font-bold text-gray-800">{r.nb_voix}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 bg-gray-200 rounded-full h-2">
                              <div className="bg-purple-600 h-2 rounded-full transition-all duration-500"
                                style={{ width: `${r.pourcentage}%` }} />
                            </div>
                            <span className="text-sm font-medium text-gray-700 w-12">{r.pourcentage}%</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {r.est_elu ? (
                            <span className="flex items-center gap-1 bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full text-sm font-bold">
                              {election.statut === 'EN_COURS' ? '🏆 En tête' : '🏆 Élu'}
                            </span>
                          ) : (
                            <span className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-sm">
                              Candidat
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {elections.length === 0 && (
          <div className="text-center py-16">
            <Trophy size={48} className="text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-500">Aucun résultat disponible</h3>
            <p className="text-gray-400 mt-2">Les résultats seront publiés après la clôture de l'élection.</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default ResultatsPage