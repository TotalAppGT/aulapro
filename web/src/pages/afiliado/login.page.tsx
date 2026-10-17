import { useState, type FormEvent } from "react"
import { Link, useNavigate } from "react-router-dom"
import { Users, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuthStore } from "@/stores/auth.store"

export default function AfiliadoLoginPage() {
  const navigate = useNavigate()
  const loginAfiliado = useAuthStore((s) => s.loginAfiliado)
  const loading = useAuthStore((s) => s.loading)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setError("")
    try {
      await loginAfiliado(email, password)
      navigate("/afiliado")
    } catch (err) {
      setError((err as Error).message || "Error al iniciar sesion")
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="flex items-center justify-center gap-2">
            <Users className="h-10 w-10 text-primary" />
            <span className="text-3xl font-bold text-gray-900">AulaPro · Afiliados</span>
          </div>
          <p className="mt-2 text-sm text-gray-600">Gana comisiones recomendando AulaPro</p>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Acceso de afiliados</CardTitle>
            <CardDescription>Ingresa con tu cuenta de afiliado</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={submit} className="space-y-4">
              {error && <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</div>}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Correo</label>
                <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="tu@correo.com" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Contrasena</label>
                <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Tu contrasena" />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Entrar
              </Button>
            </form>
            <p className="mt-4 text-center text-sm text-gray-500">
              <Link to="/" className="font-medium text-primary hover:underline">
                Volver al sitio
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
