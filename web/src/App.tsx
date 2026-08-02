import { Routes, Route } from "react-router-dom"
import LandingPage from "@/pages/landing/landing.page"
import LoginPage from "@/pages/auth/login.page"
import RegistroPage from "@/pages/auth/registro.page"
import NotFoundPage from "@/pages/not-found.page"
import DashboardLayout from "@/components/layout/dashboard-layout"
import ProtectedRoute from "@/components/auth/protected-route"
import AdminDashboard from "@/pages/admin/dashboard.page"
import AlumnosPage from "@/pages/admin/alumnos.page"
import GradosPage from "@/pages/admin/grados.page"
import CobranzaPage from "@/pages/admin/pagos/cobranza.page"
import CalificacionesPage from "@/pages/admin/calificaciones.page"
import TareasPage from "@/pages/admin/tareas.page"
import AsistenciaPage from "@/pages/admin/asistencia.page"
import AnunciosPage from "@/pages/admin/anuncios.page"
import ConfiguracionPage from "@/pages/admin/configuracion.page"
import CursosPage from "@/pages/profesor/cursos.page"
import CalificarPage from "@/pages/profesor/calificar.page"
import HijosPage from "@/pages/padre/hijos.page"
import MensajesPage from "@/pages/padre/mensajes.page"
import NotasPage from "@/pages/alumno/notas.page"
import HorarioPage from "@/pages/alumno/horario.page"

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
        <Route path="alumnos" element={<AlumnosPage />} />
        <Route path="grados" element={<GradosPage />} />
        <Route path="pagos" element={<CobranzaPage />} />
        <Route path="calificaciones" element={<CalificacionesPage />} />
        <Route path="tareas" element={<TareasPage />} />
        <Route path="asistencia" element={<AsistenciaPage />} />
        <Route path="anuncios" element={<AnunciosPage />} />
        <Route path="configuracion" element={<ConfiguracionPage />} />
        <Route path="cursos" element={<CursosPage />} />
        <Route path="calificar" element={<CalificarPage />} />
        <Route path="hijos" element={<HijosPage />} />
        <Route path="mensajes" element={<MensajesPage />} />
        <Route path="notas" element={<NotasPage />} />
        <Route path="horario" element={<HorarioPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}
