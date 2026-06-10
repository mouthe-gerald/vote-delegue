import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/common/ProtectedRoute'

// Pages Auth
import Connexion   from './pages/auth/Connexion'
import Inscription from './pages/auth/Inscription'

// Pages Étudiant
import DashboardEtudiant from './pages/etudiant/DashboardEtudiant'
import PageVote          from './pages/etudiant/PageVote'

// Pages Admin
import DashboardAdmin from './pages/admin/DashboardAdmin'

// Pages Candidat
import DashboardCandidat from './pages/candidat/DashboardCandidat'

// Page Résultats
import ResultatsPage from './pages/ResultatsPage'

const App = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#1f2937',
              color: '#fff',
              borderRadius: '12px',
              padding: '12px 16px',
            },
            success: {
              iconTheme: { primary: '#8b5cf6', secondary: '#fff' },
            },
            error: {
              iconTheme: { primary: '#ef4444', secondary: '#fff' },
            },
          }}
        />

        <Routes>
          {/* Redirection racine */}
          <Route path="/" element={<Navigate to="/connexion" replace />} />

          {/* Routes publiques */}
          <Route path="/connexion"   element={<Connexion />} />
          <Route path="/inscription" element={<Inscription />} />

          {/* Routes Étudiant */}
          <Route path="/etudiant/dashboard" element={
            <ProtectedRoute roles={['ETUDIANT', 'CANDIDAT']}>
              <DashboardEtudiant />
            </ProtectedRoute>
          } />
          <Route path="/etudiant/voter" element={
            <ProtectedRoute roles={['ETUDIANT', 'CANDIDAT']}>
              <PageVote />
            </ProtectedRoute>
          } />

          {/* Routes Admin */}
          <Route path="/admin/dashboard" element={
            <ProtectedRoute roles={['ADMINISTRATEUR']}>
              <DashboardAdmin />
            </ProtectedRoute>
          } />

          {/* Routes Candidat */}
          <Route path="/candidat/dashboard" element={
            <ProtectedRoute roles={['CANDIDAT']}>
              <DashboardCandidat />
            </ProtectedRoute>
          } />

          {/* Résultats */}
          <Route path="/resultats" element={
            <ProtectedRoute>
              <ResultatsPage />
            </ProtectedRoute>
          } />

          {/* 404 */}
          <Route path="*" element={<Navigate to="/connexion" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App