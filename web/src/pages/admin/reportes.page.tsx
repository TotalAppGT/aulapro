import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import {
  FileBarChart,
  Users,
  Download,
  Banknote,
  TrendingUp,
  Loader2,
  CreditCard,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useAuthStore } from "@/stores/auth.store"
import { apiGet } from "@/lib/api"
import { formatCurrency } from "@/lib/utils"

const MONTHS_ES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
]

function getMonthOptions() {
  const now = new Date()
  const options = []
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    options.push({
      value: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
      label: `${MONTHS_ES[d.getMonth()]} ${d.getFullYear()}`,
    })
  }
  return options
}

interface ReporteMes {
  mes: string
  resumen: { total: number; pagadas: number; pendientes: number; vencidas: number; totalRecaudado: number }
  detalle: { alumnoId: string; alumno: string; grado: string; monto: number; estado: string; fechaPago: string | null }[]
}

interface ComisionesData {
  periodo: { desde: string; hasta: string }
  totalRecaudado: number
  comisionPlataforma: number
  netoColegio: number
  totalPagos: number
}

interface UsuarioItem {
  id: string
  nombre: string
  email: string
  rol: string
  telefono: string | null
  activo: boolean
}

function downloadCSV(filename: string, header: string[], rows: (string | number | null)[][]) {
  const csv = [header.join(","), ...rows.map((r) =>
    r.map((v) => `"${String(v ?? "").replace(/"/g, '""')}"`).join(",")
  )].join("\n")
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export default function ReportesPage() {
  const user = useAuthStore((s) => s.user)
  const now = new Date()
  const [selectedMonth, setSelectedMonth] = useState(
    `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`
  )

  const { data: reporte, isLoading } = useQuery<ReporteMes>({
    queryKey: ["reporte", user?.colegioId, selectedMonth],
    queryFn: () => apiGet<ReporteMes>(`/${user?.colegioId}/pagos/reporte/${selectedMonth}`),
    staleTime: 30000,
  })

  const { data: comisiones } = useQuery<ComisionesData>({
    queryKey: ["comisiones", user?.colegioId],
    queryFn: () => apiGet<ComisionesData>(`/${user?.colegioId}/pagos/comisiones`),
    staleTime: 30000,
  })

  const { data: usuarios } = useQuery<UsuarioItem[]>({
    queryKey: ["reportes-usuarios", user?.colegioId],
    queryFn: () => apiGet<UsuarioItem[]>(`/${user?.colegioId}/reportes/usuarios`),
    staleTime: 30000,
  })

  const monthOptions = getMonthOptions()

  const handleExportCobros = () => {
    if (!reporte) return
    downloadCSV(
      `cobranza-${selectedMonth}.csv`,
      ["Alumno", "Grado", "Monto", "Estado", "Fecha Pago"],
      reporte.detalle.map((d) => [
        d.alumno,
        d.grado,
        d.monto,
        d.estado,
        d.fechaPago ? new Date(d.fechaPago).toLocaleDateString() : "",
      ])
    )
  }

  const handleExportUsuarios = () => {
    if (!usuarios) return
    downloadCSV(
      `usuarios-${selectedMonth}.csv`,
      ["Nombre", "Email", "Rol", "Telefono", "Activo"],
      usuarios.map((u) => [u.nombre, u.email, u.rol, u.telefono, u.activo ? "Si" : "No"])
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reportes</h1>
          <p className="text-sm text-gray-500">
            Control de ingresos, usuarios y cuadres del colegio
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          >
            {monthOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-green-50 p-2">
                <Banknote className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500">Recaudado</p>
                <p className="text-lg font-bold text-gray-900">
                  {formatCurrency(reporte?.resumen.totalRecaudado ?? 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-yellow-50 p-2">
                <FileBarChart className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500">Pagos del Mes</p>
                <p className="text-lg font-bold text-gray-900">
                  {reporte?.resumen.pagadas ?? 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-red-50 p-2">
                <TrendingUp className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500">Comision Plataforma</p>
                <p className="text-lg font-bold text-gray-900">
                  {formatCurrency(comisiones?.comisionPlataforma ?? 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-purple-50 p-2">
                <CreditCard className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500">Neto para Colegio</p>
                <p className="text-lg font-bold text-gray-900">
                  {formatCurrency(comisiones?.netoColegio ?? 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Detalle de Cobranza {selectedMonth}</CardTitle>
                <CardDescription>
                  {reporte?.resumen.pagadas ?? 0} pagadas, {reporte?.resumen.pendientes ?? 0} pendientes,{" "}
                  {reporte?.resumen.vencidas ?? 0} vencidas
                </CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={handleExportCobros}>
                <Download className="mr-2 h-4 w-4" />
                CSV
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
              </div>
            ) : !reporte || reporte.detalle.length === 0 ? (
              <p className="py-8 text-center text-sm text-gray-500">
                No hay cobros registrados para este mes
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 text-left text-xs font-semibold text-gray-500">
                      <th className="pb-3 pr-4">Alumno</th>
                      <th className="pb-3 pr-4">Grado</th>
                      <th className="pb-3 pr-4">Monto</th>
                      <th className="pb-3 pr-4">Estado</th>
                      <th className="pb-3">Fecha Pago</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reporte.detalle.map((d) => (
                      <tr key={d.alumnoId} className="border-b border-gray-100 text-sm hover:bg-gray-50">
                        <td className="py-3 pr-4 font-medium text-gray-900">{d.alumno}</td>
                        <td className="py-3 pr-4 text-gray-600">{d.grado}</td>
                        <td className="py-3 pr-4 font-medium text-gray-900">{formatCurrency(d.monto)}</td>
                        <td className="py-3 pr-4">
                          <span
                            className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                              d.estado === "PAGADO"
                                ? "bg-green-100 text-green-700"
                                : d.estado === "VENCIDO"
                                ? "bg-red-100 text-red-700"
                                : "bg-yellow-100 text-yellow-700"
                            }`}
                          >
                            {d.estado === "PAGADO"
                              ? "Pagado"
                              : d.estado === "VENCIDO"
                              ? "Vencido"
                              : "Pendiente"}
                          </span>
                        </td>
                        <td className="py-3 text-gray-600">
                          {d.fechaPago ? new Date(d.fechaPago).toLocaleDateString() : "-"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Usuarios del Colegio</CardTitle>
                  <CardDescription>Personal y responsables registrados</CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={handleExportUsuarios}>
                  <Download className="mr-2 h-4 w-4" />
                  CSV
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {!usuarios || usuarios.length === 0 ? (
                <p className="py-8 text-center text-sm text-gray-500">
                  No hay usuarios registrados
                </p>
              ) : (
                <div className="space-y-3">
                  {usuarios.map((u) => (
                    <div
                      key={u.id}
                      className="flex items-center justify-between rounded-md border border-gray-100 p-3"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-100 text-sm font-medium text-primary-700">
                          <Users className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{u.nombre}</p>
                          <p className="text-xs text-gray-500">{u.email}</p>
                        </div>
                      </div>
                      <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700">
                        {u.rol.replace("_", " ")}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Cuadre del Mes Actual</CardTitle>
              <CardDescription>Ingresos vs comision de plataforma</CardDescription>
            </CardHeader>
            <CardContent>
              {comisiones ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between rounded-md bg-green-50 p-3">
                    <span className="text-sm text-gray-700">Total Recaudado</span>
                    <span className="font-bold text-gray-900">
                      {formatCurrency(comisiones.totalRecaudado)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between rounded-md bg-red-50 p-3">
                    <span className="text-sm text-gray-700">Comision Plataforma</span>
                    <span className="font-bold text-red-600">
                      -{formatCurrency(comisiones.comisionPlataforma)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between rounded-md bg-primary-50 p-3">
                    <span className="text-sm font-medium text-gray-700">Neto para el Colegio</span>
                    <span className="font-bold text-primary-700">
                      {formatCurrency(comisiones.netoColegio)}
                    </span>
                  </div>
                </div>
              ) : (
                <p className="py-4 text-center text-sm text-gray-500">Sin datos de comisiones</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
