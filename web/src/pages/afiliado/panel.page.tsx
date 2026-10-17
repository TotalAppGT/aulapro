import { useQuery } from "@tanstack/react-query"
import { Navigate, useNavigate } from "react-router-dom"
import { Copy, LogOut, Loader2, Users, Wallet, TrendingUp, Percent } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useAuthStore } from "@/stores/auth.store"
import { apiGet } from "@/lib/api"
import { formatCurrency } from "@/lib/utils"

interface AfiliadoMe {
  afiliado: { id: string; nombre: string; email: string; codigo: string; comisionPct: number }
  periodo: string
  stats: { referidos: number; activos: number; comisionMes: number; comisionTotal: number; pendiente: number }
  colegios: { id: string; nombre: string; plan: string; estado: string; createdAt: string }[]
  comisiones: { id: string; colegioId: string; periodo: string; monto: number; estado: string; createdAt: string }[]
}

export default function AfiliadoPanelPage() {
  const user = useAuthStore((s) => s.user)
  const logout = useAuthStore((s) => s.logout)
  const navigate = useNavigate()

  const { data, isLoading } = useQuery<AfiliadoMe>({
    queryKey: ["afiliado-me"],
    queryFn: () => apiGet<AfiliadoMe>("/afiliados/me"),
    enabled: !!user && user.rol === "AFILIADO",
  })

  if (!user || user.rol !== "AFILIADO") {
    return <Navigate to="/afiliado/login" replace />
  }

  const link = data ? `${window.location.origin}/registro?ref=${data.afiliado.codigo}` : ""

  const copiar = () => {
    if (link) navigator.clipboard?.writeText(link)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Programa de Afiliados</h1>
            <p className="text-sm text-gray-500">{user.nombre}</p>
          </div>
          <Button
            variant="outline"
            onClick={async () => {
              await logout()
              navigate("/afiliado/login")
            }}
          >
            <LogOut className="mr-2 h-4 w-4" />
            Salir
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-6 px-4 py-6">
        {isLoading || !data ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-gray-300" />
          </div>
        ) : (
          <>
            <Card>
              <CardHeader>
                <CardTitle>Tu enlace de afiliado</CardTitle>
                <CardDescription>
                  Comparte este enlace; los colegios que se registren quedan vinculados a ti.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <input
                    readOnly
                    value={link}
                    className="h-10 flex-1 rounded-md border border-gray-300 bg-gray-50 px-3 text-sm text-gray-700"
                  />
                  <Button onClick={copiar}>
                    <Copy className="mr-2 h-4 w-4" />
                    Copiar
                  </Button>
                </div>
                <p className="mt-2 text-xs text-gray-500">
                  Codigo: <span className="font-semibold">{data.afiliado.codigo}</span> · Comision:{" "}
                  {data.afiliado.comisionPct}% de la suscripcion
                </p>
              </CardContent>
            </Card>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">Referidos</p>
                      <p className="text-2xl font-bold text-gray-900">{data.stats.referidos}</p>
                    </div>
                    <Users className="h-6 w-6 text-primary" />
                  </div>
                  <p className="mt-1 text-xs text-gray-500">{data.stats.activos} activos</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">Comision del mes</p>
                      <p className="text-2xl font-bold text-gray-900">{formatCurrency(data.stats.comisionMes)}</p>
                    </div>
                    <Wallet className="h-6 w-6 text-green-600" />
                  </div>
                  <p className="mt-1 text-xs text-gray-500">{data.periodo}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">Comision total</p>
                      <p className="text-2xl font-bold text-gray-900">{formatCurrency(data.stats.comisionTotal)}</p>
                    </div>
                    <TrendingUp className="h-6 w-6 text-blue-600" />
                  </div>
                  <p className="mt-1 text-xs text-gray-500">Historico</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">Pendiente de pago</p>
                      <p className="text-2xl font-bold text-gray-900">{formatCurrency(data.stats.pendiente)}</p>
                    </div>
                    <Percent className="h-6 w-6 text-yellow-600" />
                  </div>
                  <p className="mt-1 text-xs text-gray-500">Por liquidar</p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Colegios referidos</CardTitle>
              </CardHeader>
              <CardContent>
                {data.colegios.length === 0 ? (
                  <p className="text-sm text-gray-500">Aun no tienes colegios referidos.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-200 text-left text-gray-500">
                          <th className="pb-3 pr-4">Colegio</th>
                          <th className="pb-3 pr-4">Plan</th>
                          <th className="pb-3 pr-4">Estado</th>
                          <th className="pb-3">Registro</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.colegios.map((c) => (
                          <tr key={c.id} className="border-b border-gray-100 last:border-0">
                            <td className="py-3 pr-4 font-medium text-gray-900">{c.nombre}</td>
                            <td className="py-3 pr-4">
                              <Badge variant="secondary">{c.plan}</Badge>
                            </td>
                            <td className="py-3 pr-4">
                              <Badge variant={c.estado === "ACTIVE" ? "success" : "warning"}>{c.estado}</Badge>
                            </td>
                            <td className="py-3 text-gray-500">
                              {new Date(c.createdAt).toLocaleDateString("es-GT")}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Comisiones</CardTitle>
              </CardHeader>
              <CardContent>
                {data.comisiones.length === 0 ? (
                  <p className="text-sm text-gray-500">Sin comisiones generadas.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-200 text-left text-gray-500">
                          <th className="pb-3 pr-4">Periodo</th>
                          <th className="pb-3 pr-4">Monto</th>
                          <th className="pb-3">Estado</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.comisiones.map((c) => (
                          <tr key={c.id} className="border-b border-gray-100 last:border-0">
                            <td className="py-3 pr-4 text-gray-700">{c.periodo}</td>
                            <td className="py-3 pr-4 font-semibold text-gray-900">{formatCurrency(c.monto)}</td>
                            <td className="py-3">
                              <Badge variant={c.estado === "PAGADA" ? "success" : "warning"}>{c.estado}</Badge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </main>
    </div>
  )
}
