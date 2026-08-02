import { Routes, Route } from "react-router-dom"
import LandingPage from "@/pages/landing/landing.page"
import LoginPage from "@/pages/auth/login.page"
import RegistroPage from "@/pages/auth/registro.page"
import DashboardLayout from "@/components/layout/dashboard-layout"
import ProtectedRoute from "@/components/auth/protected-route"
import AdminDashboard from "@/pages/admin/dashboard.page"
import CobranzaPage from "@/pages/admin/pagos/cobranza.page"
import PadreDashboard from "@/pages/padre/dashboard.page"
import AlumnoDashboard from "@/pages/alumno/dashboard.page"

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/registro" element={<RegistroPage />} />
      <Route
        path="/app"
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<AdminDashboard />} />
        <Route path="pagos" element={<CobranzaPage />} />
      </Route>
      <Route
        path="/app/padre"
        element={
          <ProtectedRoute>
            <PadreDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/app/alumno"
        element={
          <ProtectedRoute>
            <AlumnoDashboard />
          </ProtectedRoute>
        }
      />
    </Routes>
  )
}
