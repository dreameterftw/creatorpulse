import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import { useAuth } from "./context/AuthContext"
import ErrorBoundary from "./components/ErrorBoundary"

import Landing from "./pages/Landing"
import Auth from "./pages/Auth"
import VerifyEmail from "./pages/VerifyEmail"
import Onboarding from "./pages/Onboarding"
import Dashboard from "./pages/Dashboard"
import RateCalculator from "./pages/RateCalculator"
import GapRadar from "./pages/GapRadar"
import PitchGenerator from "./pages/PitchGenerator"
import FitScore from "./pages/FitScore"
import WhatIfSimulator from "./pages/WhatIfSimulator"
import AccountSettings from "./pages/AccountSettings"

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-400">Loading...</p>
      </div>
    )
  }

  if (!user) return <Navigate to="/auth" />

  // Email/password accounts must verify before accessing any feature.
  // Google accounts are always pre-verified so this never blocks them.
  if (!user.emailVerified) return <Navigate to="/verify-email" />

  return children
}

function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/verify-email" element={<VerifyEmail />} />
          <Route
            path="/onboarding"
            element={
              <ProtectedRoute>
                <Onboarding />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/rate-calculator"
            element={
              <ProtectedRoute>
                <RateCalculator />
              </ProtectedRoute>
            }
          />
          <Route
            path="/gap-radar"
            element={
              <ProtectedRoute>
                <GapRadar />
              </ProtectedRoute>
            }
          />
          <Route
            path="/pitch-generator"
            element={
              <ProtectedRoute>
                <PitchGenerator />
              </ProtectedRoute>
            }
          />
          <Route
            path="/fit-score"
            element={
              <ProtectedRoute>
                <FitScore />
              </ProtectedRoute>
            }
          />
          <Route
            path="/what-if"
            element={
              <ProtectedRoute>
                <WhatIfSimulator />
              </ProtectedRoute>
            }
          />
          <Route
            path="/account"
            element={
              <ProtectedRoute>
                <AccountSettings />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </BrowserRouter>
    </ErrorBoundary>
  )
}

export default App
