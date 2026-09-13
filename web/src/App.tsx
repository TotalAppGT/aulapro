import { Navigate } from "react-router-dom"
import { Routes, Route } from "react-router-dom"
import LandingPage from "@/pages/landing/landing.page"
import LoginPage from "@/pages/auth/login.page"
import RegistroPage from "@/pages/auth/registro.page"
import NotFoundPage from "@/pages/not-found.page"
import DashboardLayout from "@/components/layout/dashboard-layout"
import ProtectedRoute from "@/components/auth/protected-route"
import { useAuthStore, Role, getLastPath } from "@/stores/auth.store"
import AdminDashboard from "@/pages/admin/dashboard.page"
import AlumnosPage from "@/pages/admin/alumnos.page"
import GradosPage from "@/pages/admin/grados.page"
import CobranzaPage from "@/pages/admin/pagos/cobranza.page"
import CalificacionesPage from "@/pages/admin/calificaciones.page"
import TareasPage from "@/pages/admin/tareas.page"
import AsistenciaPage from "@/pages/admin/asistencia.page"
import AnunciosPage from "@/pages/admin/anuncios.page"
import ConfiguracionPage from "@/pages/admin/configuracion.page"
import ReportesPage from "@/pages/admin/reportes.page"
import NotificacionesPage from "@/pages/admin/notificaciones.page"
import UsuariosPage from "@/pages/admin/usuarios.page"
import CursosPage from "@/pages/profesor/cursos.page"
import CalificarPage from "@/pages/profesor/calificar.page"
import HijosPage from "@/pages/padre/hijos.page"
import PadreTareasPage from "@/pages/padre/tareas.page"
import MensajesPage from "@/pages/padre/mensajes.page"
import NotasPage from "@/pages/alumno/notas.page"
import HorarioPage from "@/pages/alumno/horario.page"
import PagarPage from "@/pages/pagar/pagar.page"
import CursoDetallePage from "@/pages/curso/curso-detalle.page"

function RootRoute() {
  const user = useAuthStore((s) => s.user)
  if (!user) return <LandingPage />
  return <Navigate to={getLastPath() ?? "/app"} replace />
}

function HomeRedirect() {
  const user = useAuthStore((s) => s.user)
  if (!user) return <Navigate to="/login" replace />
  switch (user.rol) {
    case "PROFESOR":
      return <Navigate to="/app/cursos" replace />
    case "PADRE":
      return <Navigate to="/app/hijos" replace />
    case "ALUMNO":
      return <Navigate to="/app/notas" replace />
    default:
      return <AdminDashboard />
  }
}

function RoleRoute({
  allowed,
  children,
}: {
  allowed: Role[]
  children: React.ReactNode
}) {
  const user = useAuthStore((s) => s.user)
  if (user && !allowed.includes(user.rol)) {
    return <Navigate to="/app" replace />
  }
  return <>{children}</>
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<RootRoute />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/registro" element={<RegistroPage />} />
      <Route
        path="/app/pagar"
        element={
          <RoleRoute allowed={["PADRE", "ADMIN_COLEGIO", "PROFESOR"]}>
            <PagarPage />
          </RoleRoute>
        }
      />
      <Route
        path="/app"
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<HomeRedirect />} />

        <Route
          path="alumnos"
          element={
            <RoleRoute allowed={["ADMIN_COLEGIO"]}>
              <AlumnosPage />
            </RoleRoute>
          }
        />
        <Route
          path="grados"
          element={
            <RoleRoute allowed={["ADMIN_COLEGIO"]}>
              <GradosPage />
            </RoleRoute>
          }
        />
        <Route
          path="pagos"
          element={
            <RoleRoute allowed={["ADMIN_COLEGIO", "PROFESOR"]}>
              <CobranzaPage />
            </RoleRoute>
          }
        />
        <Route
          path="calificaciones"
          element={
            <RoleRoute allowed={["ADMIN_COLEGIO", "PROFESOR"]}>
              <CalificacionesPage />
            </RoleRoute>
          }
        />
        <Route
          path="tareas"
          element={
            <RoleRoute allowed={["ADMIN_COLEGIO", "PROFESOR", "ALUMNO"]}>
              <TareasPage />
            </RoleRoute>
          }
        />
        <Route
          path="asistencia"
          element={
            <RoleRoute allowed={["ADMIN_COLEGIO", "PROFESOR"]}>
              <AsistenciaPage />
            </RoleRoute>
          }
        />
        <Route
          path="anuncios"
          element={
            <RoleRoute allowed={["ADMIN_COLEGIO", "PROFESOR"]}>
              <AnunciosPage />
            </RoleRoute>
          }
        />
        <Route
          path="configuracion"
          element={
            <RoleRoute allowed={["ADMIN_COLEGIO"]}>
              <ConfiguracionPage />
            </RoleRoute>
          }
        />
        <Route
          path="reportes"
          element={
            <RoleRoute allowed={["ADMIN_COLEGIO"]}>
              <ReportesPage />
            </RoleRoute>
          }
        />
        <Route
          path="notificaciones"
          element={
            <RoleRoute allowed={["ADMIN_COLEGIO"]}>
              <NotificacionesPage />
            </RoleRoute>
          }
        />
        <Route
          path="usuarios"
          element={
            <RoleRoute allowed={["ADMIN_COLEGIO"]}>
              <UsuariosPage />
            </RoleRoute>
          }
        />
        <Route
          path="cursos"
          element={
            <RoleRoute allowed={["ADMIN_COLEGIO", "PROFESOR", "ALUMNO"]}>
              <CursosPage />
            </RoleRoute>
          }
        />
        <Route
          path="curso/:cursoId"
          element={
            <RoleRoute allowed={["ADMIN_COLEGIO", "PROFESOR", "ALUMNO"]}>
              <CursoDetallePage />
            </RoleRoute>
          }
        />
        <Route
          path="calificar"
          element={
            <RoleRoute allowed={["PROFESOR"]}>
              <CalificarPage />
            </RoleRoute>
          }
        />
        <Route
          path="hijos"
          element={
            <RoleRoute allowed={["PADRE"]}>
              <HijosPage />
            </RoleRoute>
          }
        />
        <Route
          path="mis-tareas"
          element={
            <RoleRoute allowed={["PADRE"]}>
              <PadreTareasPage />
            </RoleRoute>
          }
        />
        <Route
          path="mensajes"
          element={
            <RoleRoute allowed={["PADRE"]}>
              <MensajesPage />
            </RoleRoute>
          }
        />
        <Route
          path="notas"
          element={
            <RoleRoute allowed={["ALUMNO"]}>
              <NotasPage />
            </RoleRoute>
          }
        />
        <Route
          path="horario"
          element={
            <RoleRoute allowed={["ALUMNO"]}>
              <HorarioPage />
            </RoleRoute>
          }
        />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}
