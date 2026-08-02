import { useState, useMemo } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import {
  Search,
  Download,
  Send,
  Loader2,
  DollarSign,
  Clock,
  TrendingUp,
  CreditCard,
  Filter,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useAuthStore } from "@/stores/auth.store"
import { apiGet, apiPost } from "@/lib/api"
import { formatCurrency, formatDateShort } from "@/lib/utils"

type EstadoPago = "pagado" | "pendiente" | "vencido"

interface CobroRecord {
  id: string
  alumnoId: string
  alumnoNombre: string
  gradoNombre: string
  monto: number
  estado: EstadoPago
  fechaPago: string | null
  fechaVencimiento: string
}

interface CobrosOverview {
  totalRecaudado: number
  totalPendiente: number
  porcentajeCompletado: number
  comisionDelMes: number
}

const MONTHS_ES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
]

function getMonthOptions() {
  const now = new Date()
  const options = []
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    options.push({
      value: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
      label: `${MONTHS_ES[d.getMonth()]} ${d.getFullYear()}`,
    })
  }
  return options
}

const mockCobros: CobroRecord[] = [
  {
    id: "1",
    alumnoId: "a1",
    alumnoNombre: "Maria Garcia",
    gradoNombre: "3ro Basico A",
    monto: 225,
    estado: "pagado",
    fechaPago: new Date().toISOString(),
    fechaVencimiento: new Date(new Date().getFullYear(), new Date().getMonth(), 10).toISOString(),
  },
  {
    id: "2",
    alumnoId: "a2",
    alumnoNombre: "Carlos Perez",
    gradoNombre: "5to Primaria B",
    monto: 225,
    estado: "pagado",
    fechaPago: new Date(Date.now() - 86400000).toISOString(),
    fechaVencimiento: new Date(new Date().getFullYear(), new Date().getMonth(), 10).toISOString(),
  },
  {
    id: "3",
    alumnoId: "a3",
    alumnoNombre: "Ana Lopez",
    gradoNombre: "2do Basico A",
    monto: 225,
    estado: "pendiente",
    fechaPago: null,
    fechaVencimiento: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 5).toISOString(),
  },
  {
    id: "4",
    alumnoId: "a4",
    alumnoNombre: "Jose Mendez",
    gradoNombre: "1ro Primaria C",
    monto: 225,
    estado: "pendiente",
    fechaPago: null,
    fechaVencimiento: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 5).toISOString(),
  },
  {
    id: "5",
    alumnoId: "a5",
    alumnoNombre: "Luisa Ramirez",
    gradoNombre: "3ro Basico B",
    monto: 225,
    estado: "vencido",
    fechaPago: null,
    fechaVencimiento: new Date(new Date().getFullYear(), new Date().getMonth() - 1, 10).toISOString(),
  },
  {
    id: "6",
    alumnoId: "a6",
    alumnoNombre: "Pedro Samayoa",
    gradoNombre: "4to Primaria A",
    monto: 225,
    estado: "vencido",
    fechaPago: null,
    fechaVencimiento: new Date(new Date().getFullYear(), new Date().getMonth() - 1, 10).toISOString(),
  },
  {
    id: "7",
    alumnoId: "a7",
    alumnoNombre: "Elena Vasquez",
    gradoNombre: "6to Primaria B",
    monto: 225,
    estado: "pagado",
    fechaPago: new Date(Date.now() - 86400000 * 3).toISOString(),
    fechaVencimiento: new Date(new Date().getFullYear(), new Date().getMonth(), 10).toISOString(),
  },
  {
    id: "8",
    alumnoId: "a8",
    alumnoNombre: "Daniel Morales",
    gradoNombre: "1ro Basico A",
    monto: 225,
    estado: "pagado",
    fechaPago: new Date(Date.now() - 86400000 * 4).toISOString(),
    fechaVencimiento: new Date(new Date().getFullYear(), new Date().getMonth(), 10).toISOString(),
  },
]

const mockOverview: CobrosOverview = {
  totalRecaudado: 44550,
  totalPendiente: 10575,
  porcentajeCompletado: 80.8,
  comisionDelMes: 1782,
}

const ESTADO_TABS: { label: string; value: EstadoPago | "todos" }[] = [
  { label: "Todos", value: "todos" },
  { label: "Pendientes", value: "pendiente" },
  { label: "Pagados", value: "pagado" },
  { label: "Vencidos", value: "vencido" },
]

export default function CobranzaPage() {
  const user = useAuthStore((s) => s.user)
  const queryClient = useQueryClient()
  const now = new Date()
  const [selectedMonth, setSelectedMonth] = useState(
    `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`
  )
  const [estadoFilter, setEstadoFilter] = useState<EstadoPago | "todos">("todos")
  const [searchQuery, setSearchQuery] = useState("")

  const { data: cobros, isLoading } = useQuery<CobroRecord[]>({
    queryKey: ["cobros", user?.colegioId, selectedMonth],
    queryFn: () =>
      apiGet<CobroRecord[]>(`/colegios/${user?.colegioId}/pagos`, {
        mes: selectedMonth,
      }),
    placeholderData: mockCobros,
    staleTime: 30000,
  })

  const overviewData = mockOverview

  const generarCobrosMutation = useMutation({
    mutationFn: () =>
      apiPost(`/colegios/${user?.colegioId}/pagos/generar-mes`, {
        mes: selectedMonth,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cobros"] })
    },
  })

  const enviarRecordatorioMutation = useMutation({
    mutationFn: (cobroId: string) =>
      apiPost(`/colegios/${user?.colegioId}/pagos/${cobroId}/recordatorio`),
    onSuccess: () => {},
  })

  const filteredCobros = useMemo(() => {
    const data = cobros ?? mockCobros
    let filtered = data

    if (estadoFilter !== "todos") {
      filtered = filtered.filter((c) => c.estado === estadoFilter)
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      filtered = filtered.filter((c) =>
        c.alumnoNombre.toLowerCase().includes(q)
      )
    }

    return filtered
  }, [cobros, estadoFilter, searchQuery])

  const monthOptions = getMonthOptions()

  const handleGenerarCobros = async () => {
    try {
      await generarCobrosMutation.mutateAsync()
    } catch (_) {}
  }

  const handleEnviarRecordatorio = async (cobroId: string) => {
    try {
      await enviarRecordatorioMutation.mutateAsync(cobroId)
    } catch (_) {}
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Gestion de Cobranza
          </h1>
          <p className="text-sm text-gray-500">
            Control de pagos y cobros mensuales
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
          <Button
            onClick={handleGenerarCobros}
            disabled={generarCobrosMutation.isPending}
          >
            {generarCobrosMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generando...
              </>
            ) : (
              <>
                <DollarSign className="mr-2 h-4 w-4" />
                Generar Cobros del Mes
              </>
            )}
          </Button>
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Descargar Reporte
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-green-50 p-2">
                <DollarSign className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500">
                  Total Recaudado
                </p>
                <p className="text-lg font-bold text-gray-900">
                  {formatCurrency(overviewData.totalRecaudado)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-red-50 p-2">
                <Clock className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500">
                  Total Pendiente
                </p>
                <p className="text-lg font-bold text-red-600">
                  {formatCurrency(overviewData.totalPendiente)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-blue-50 p-2">
                <TrendingUp className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500">
                  % Completado
                </p>
                <p className="text-lg font-bold text-gray-900">
                  {overviewData.porcentajeCompletado}%
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
                <p className="text-xs font-medium text-gray-500">
                  Comision del Mes
                </p>
                <p className="text-lg font-bold text-gray-900">
                  {formatCurrency(overviewData.comisionDelMes)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>Listado de Cobros</CardTitle>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input
                  placeholder="Buscar alumno..."
                  className="pl-9"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
          </div>
          <div className="mt-3 flex gap-2 border-b border-gray-200">
            {ESTADO_TABS.map((tab) => (
              <button
                key={tab.value}
                onClick={() => setEstadoFilter(tab.value)}
                className={`px-3 py-2 text-sm font-medium border-b-2 transition-colors ${
                  estadoFilter === tab.value
                    ? "border-primary text-primary"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
          ) : filteredCobros.length === 0 ? (
            <div className="py-12 text-center">
              <Filter className="mx-auto h-8 w-8 text-gray-300" />
              <p className="mt-2 text-sm text-gray-500">
                No se encontraron cobros
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 text-left text-xs font-semibold text-gray-500">
                    <th className="pb-3 pr-4">Alumno</th>
                    <th className="pb-3 pr-4">Grado</th>
                    <th className="pb-3 pr-4">Monto</th>
                    <th className="pb-3 pr-4">Estado</th>
                    <th className="pb-3 pr-4">Fecha Pago</th>
                    <th className="pb-3 pr-4">Vencimiento</th>
                    <th className="pb-3">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCobros.map((cobro) => (
                    <tr
                      key={cobro.id}
                      className="border-b border-gray-100 text-sm hover:bg-gray-50"
                    >
                      <td className="py-3 pr-4 font-medium text-gray-900">
                        {cobro.alumnoNombre}
                      </td>
                      <td className="py-3 pr-4 text-gray-600">
                        {cobro.gradoNombre}
                      </td>
                      <td className="py-3 pr-4 font-medium text-gray-900">
                        {formatCurrency(cobro.monto)}
                      </td>
                      <td className="py-3 pr-4">
                        <Badge
                          variant={
                            cobro.estado === "pagado"
                              ? "success"
                              : cobro.estado === "vencido"
                              ? "destructive"
                              : "warning"
                          }
                        >
                          {cobro.estado === "pagado"
                            ? "Pagado"
                            : cobro.estado === "vencido"
                            ? "Vencido"
                            : "Pendiente"}
                        </Badge>
                      </td>
                      <td className="py-3 pr-4 text-gray-600">
                        {cobro.fechaPago
                          ? formatDateShort(cobro.fechaPago)
                          : "-"}
                      </td>
                      <td className="py-3 pr-4 text-gray-600">
                        {formatDateShort(cobro.fechaVencimiento)}
                      </td>
                      <td className="py-3">
                        {cobro.estado !== "pagado" && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              handleEnviarRecordatorio(cobro.id)
                            }
                            disabled={
                              enviarRecordatorioMutation.isPending
                            }
                          >
                            {enviarRecordatorioMutation.isPending ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <Send className="h-3 w-3" />
                            )}
                            <span className="ml-1 text-xs">
                              Recordatorio
                            </span>
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
