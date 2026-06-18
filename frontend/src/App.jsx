import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/common/ProtectedRoute'
import Connexion from './pages/auth/Connexion'
import Accueil from './pages/Accueil'
import Inscription from './pages/auth/Inscription'
import DashboardEtudiant from './pages/etudiant/DashboardEtudiant'
import PageVote from './pages/etudiant/PageVote'
import PageCandidature from './pages/etudiant/PageCandidature'
import DashboardAdmin from './pages/admin/DashboardAdmin'
import DashboardCandidat from './pages/candidat/DashboardCandidat'
import ResultatsPage from './pages/ResultatsPage'
import GestionEtudiants from './pages/admin/GestionEtudiants'
import GestionUtilisateurs from './pages/admin/GestionUtilisateurs'
import MotDePasseOublie from './pages/auth/MotDePasseOublie'

const App = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Toaster position="top-right" toastOptions={{
          duration: 4000,
          style: { background: '#1f2937', color: '#fff', borderRadius: '12px', padding: '12px 16px' },
          success: { iconTheme: { primary: '#8b5cf6', secondary: '#fff' } },
          error: { iconTheme: { primary: '#ef4444', secondary: '#fff' } },
        }} />
        <Routes>
          <Route path="/" element={<Accueil />} />
          <Route path="/connexion" element={<Connexion />} />
          <Route path="/inscription" element={<Inscription />} />

          {/* Routes ETUDIANT uniquement */}
          <Route path="/etudiant/dashboard" element={
            <ProtectedRoute roles={['ETUDIANT']}>
              <DashboardEtudiant />
            </ProtectedRoute>
          } />

          {/* Routes ETUDIANT + CANDIDAT */}
          <Route path="/etudiant/voter" element={
            <ProtectedRoute roles={['ETUDIANT', 'CANDIDAT']}>
              <PageVote />
            </ProtectedRoute>
          } />
          <Route path="/etudiant/candidature" element={
            <ProtectedRoute roles={['ETUDIANT', 'CANDIDAT']}>
              <PageCandidature />
            </ProtectedRoute>
          } />

          {/* Routes CANDIDAT uniquement */}
          <Route path="/candidat/dashboard" element={
            <ProtectedRoute roles={['ETUDIANT', 'CANDIDAT']}>
              <DashboardCandidat />
            </ProtectedRoute>
          } />

          {/* Routes ADMIN uniquement */}
          <Route path="/admin/dashboard" element={
            <ProtectedRoute roles={['ADMINISTRATEUR']}>
              <DashboardAdmin />
            </ProtectedRoute>
          } />
          <Route path="/admin/etudiants-autorises" element={
            <ProtectedRoute roles={['ADMINISTRATEUR']}>
              <GestionEtudiants />
            </ProtectedRoute>
          } />
          <Route path="/admin/utilisateurs" element={
            <ProtectedRoute roles={['ADMINISTRATEUR']}>
              <GestionUtilisateurs />
            </ProtectedRoute>
          } />

          {/* Route publique */}
          <Route path="/mot-de-passe-oublie" element={<MotDePasseOublie />} />
          <Route path="/resultats" element={<ResultatsPage />} />
          <Route path="*" element={<Navigate to="/connexion" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
