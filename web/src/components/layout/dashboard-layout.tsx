import { useState } from "react"
import { Outlet, NavLink, useNavigate, useLocation } from "react-router-dom"
import { useAuthStore, Role } from "@/stores/auth.store"
import { Button } from "@/components/ui/button"
import {
  LayoutDashboard,
  GraduationCap,
  Users,
  DollarSign,
  ClipboardCheck,
  BookOpen,
  CalendarCheck,
  Megaphone,
  Settings,
  BookOpenCheck,
  MessageSquare,
  Clock,
  FileText,
  UserCircle,
  LogOut,
  Menu,
  X,
  ChevronDown,
  School,
  Bell,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface NavItemDef {
  to: string
  label: string
  icon: React.ComponentType<{ className?: string }>
}

const adminNav: NavItemDef[] = [
  { to: "/app", label: "Dashboard", icon: LayoutDashboard },
  { to: "/app/alumnos", label: "Alumnos", icon: Users },
  { to: "/app/grados", label: "Grados", icon: GraduationCap },
  { to: "/app/pagos", label: "Pagos", icon: DollarSign },
  { to: "/app/calificaciones", label: "Calificaciones", icon: ClipboardCheck },
  { to: "/app/tareas", label: "Tareas", icon: BookOpen },
  { to: "/app/asistencia", label: "Asistencia", icon: CalendarCheck },
  { to: "/app/anuncios", label: "Anuncios", icon: Megaphone },
  { to: "/app/configuracion", label: "Configuracion", icon: Settings },
]

const profesorNav: NavItemDef[] = [
  { to: "/app", label: "Dashboard", icon: LayoutDashboard },
  { to: "/app/cursos", label: "Mis Cursos", icon: BookOpenCheck },
  { to: "/app/calificar", label: "Calificar", icon: ClipboardCheck },
  { to: "/app/tareas", label: "Tareas", icon: BookOpen },
]

const padreNav: NavItemDef[] = [
  { to: "/app", label: "Dashboard", icon: LayoutDashboard },
  { to: "/app/hijos", label: "Mis Hijos", icon: Users },
  { to: "/app/pagos", label: "Pagos", icon: DollarSign },
  { to: "/app/mensajes", label: "Mensajes", icon: MessageSquare },
]

const alumnoNav: NavItemDef[] = [
  { to: "/app", label: "Dashboard", icon: LayoutDashboard },
  { to: "/app/tareas", label: "Mis Tareas", icon: BookOpen },
  { to: "/app/notas", label: "Mis Notas", icon: FileText },
  { to: "/app/horario", label: "Horario", icon: Clock },
]

function getNavForRole(role: Role): NavItemDef[] {
  switch (role) {
    case "ADMIN_COLEGIO":
      return adminNav
    case "PROFESOR":
      return profesorNav
    case "PADRE":
      return padreNav
    case "ALUMNO":
      return alumnoNav
    default:
      return adminNav
  }
}

export default function DashboardLayout() {
  const { user, isAuthenticated, logout } = useAuthStore()
  const navigate = useNavigate()
  const location = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)

  if (!isAuthenticated) {
    navigate("/login", { replace: true })
    return null
  }

  const role = user!.rol
  const navItems = getNavForRole(role)

  const handleLogout = () => {
    logout()
    navigate("/login")
  }

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <div
        className={cn(
          "fixed inset-0 z-40 bg-black/50 lg:hidden",
          sidebarOpen ? "block" : "hidden"
        )}
        onClick={() => setSidebarOpen(false)}
      />

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-gray-900 text-white transition-transform lg:static lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-16 items-center justify-between px-6 border-b border-gray-800">
          <div className="flex items-center gap-2">
            <School className="h-7 w-7 text-primary-400" />
            <span className="text-xl font-bold tracking-tight">AulaPro</span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="text-gray-400 hover:text-white hover:bg-gray-800 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        <nav className="flex-1 overflow-y-auto py-4 px-3">
          <div className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = location.pathname === item.to
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === "/app"}
                  onClick={() => setSidebarOpen(false)}
                  className={cn(
                    "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-primary text-white"
                      : "text-gray-300 hover:bg-gray-800 hover:text-white"
                  )}
                >
                  <Icon className="h-5 w-5" />
                  {item.label}
                </NavLink>
              )
            })}
          </div>
        </nav>

        <div className="border-t border-gray-800 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-600 text-sm font-medium text-white">
              {user!.nombre
                .split(" ")
                .map((n) => n[0])
                .slice(0, 2)
                .join("")
                .toUpperCase()}
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="truncate text-sm font-medium text-white">
                {user!.nombre}
              </p>
              <p className="truncate text-xs text-gray-400">{user!.rol}</p>
            </div>
          </div>
        </div>
      </aside>

      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-16 items-center justify-between border-b border-gray-200 bg-white px-4 lg:px-6">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </Button>
            <div>
              <p className="text-sm font-medium text-gray-900">
                {user!.colegioNombre}
              </p>
              <p className="text-xs text-gray-500">{user!.rol}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="text-gray-500">
              <Bell className="h-5 w-5" />
            </Button>

            <div className="relative">
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-2 rounded-md p-1 hover:bg-gray-100"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-100 text-sm font-medium text-primary-700">
                  {user!.nombre
                    .split(" ")
                    .map((n) => n[0])
                    .slice(0, 2)
                    .join("")
                    .toUpperCase()}
                </div>
                <ChevronDown className="h-4 w-4 text-gray-500" />
              </button>

              {dropdownOpen && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setDropdownOpen(false)}
                  />
                  <div className="absolute right-0 top-full z-20 mt-2 w-48 rounded-md border border-gray-200 bg-white py-1 shadow-lg">
                    <button
                      onClick={() => {
                        setDropdownOpen(false)
                        navigate("/app/perfil")
                      }}
                      className="flex w-full items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      <UserCircle className="h-4 w-4" />
                      Perfil
                    </button>
                    <button
                      onClick={() => {
                        setDropdownOpen(false)
                        handleLogout()
                      }}
                      className="flex w-full items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                    >
                      <LogOut className="h-4 w-4" />
                      Cerrar Sesion
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
