import { useEffect, useState } from "react"
import { Navigate, useLocation } from "react-router-dom"
import { Loader2 } from "lucide-react"
import { useAuthStore } from "@/stores/auth.store"

export default function ProtectedRoute({
  children,
}: {
  children: React.ReactNode
}) {
  const { isAuthenticated, refresh } = useAuthStore()
  const location = useLocation()
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    let active = true
    ;(async () => {
      if (isAuthenticated()) {
        // Valida la sesion contra el servidor; si el usuario/colegio ya no existe, cierra sesion
        await refresh()
      }
      if (active) setChecking(false)
    })()
    return () => {
      active = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (checking) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-gray-300" />
      </div>
    )
  }

  if (!isAuthenticated()) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return <>{children}</>
}
