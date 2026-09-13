import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Users, Plus, Loader2, Search, GraduationCap, QrCode, Download, RefreshCw, X } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { useAuthStore } from "@/stores/auth.store"
import { apiGet, apiPost } from "@/lib/api"

interface Alumno {
  id: string
  codigo: string
  nombre: string
  apellido: string | null
  gradoId: string | null
  fechaNacimiento: string | null
  direccion: string | null
  activo: boolean
  grado: { id: string; nombre: string } | null
  responsable: { id: string; nombre: string; email: string } | null
}

interface Grado {
  id: string
  nombre: string
  nivel: string | null
}

interface QrData {
  alumnoId: string
  codigo: string
  nombre: string
  qrToken: string
  qrImage: string
  urlVerificacion: string
}

export default function AlumnosPage() {
  const user = useAuthStore((s) => s.user)
  const queryClient = useQueryClient()
  const [search, setSearch] = useState("")
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({
    codigo: "",
    cui: "",
    nombre: "",
    apellido: "",
    gradoId: "",
  })

  const { data: alumnos, isLoading } = useQuery<Alumno[]>({
    queryKey: ["alumnos", user?.colegioId],
    queryFn: () => apiGet<Alumno[]>(`/${user?.colegioId}/alumnos`),
    enabled: !!user?.colegioId,
  })

  const { data: grados } = useQuery<Grado[]>({
    queryKey: ["grados", user?.colegioId],
    queryFn: () => apiGet<Grado[]>(`/${user?.colegioId}/grados`),
    enabled: !!user?.colegioId,
  })

  const createMutation = useMutation({
    mutationFn: () =>
      apiPost(`/${user?.colegioId}/alumnos`, {
        codigo: form.codigo,
        cui: form.cui || undefined,
        nombre: form.nombre,
        apellido: form.apellido || undefined,
        gradoId: form.gradoId || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["alumnos"] })
      setShowForm(false)
      setForm({ codigo: "", cui: "", nombre: "", apellido: "", gradoId: "" })
    },
  })

  const [carnetAlumno, setCarnetAlumno] = useState<Alumno | null>(null)

  const carnetQuery = useQuery<QrData>({
    queryKey: ["carnet", user?.colegioId, carnetAlumno?.id],
    queryFn: () =>
      apiGet<QrData>(`/${user?.colegioId}/alumnos/${carnetAlumno?.id}/qr`),
    enabled: !!carnetAlumno && !!user?.colegioId,
  })

  const regenerarQr = async () => {
    await apiGet<QrData>(`/${user?.colegioId}/alumnos/${carnetAlumno?.id}/qr?regenerar=true`)
    await carnetQuery.refetch()
  }

  const handleDescargarCarnet = () => {
    if (!carnetQuery.data?.qrImage) return
    const a = document.createElement("a")
    a.href = carnetQuery.data.qrImage
    a.download = `carnet-${carnetQuery.data.codigo}.png`
    a.click()
  }

  const filtered = (alumnos ?? []).filter((a) => {
    const q = search.toLowerCase()
    return (
      a.nombre.toLowerCase().includes(q) ||
      (a.apellido ?? "").toLowerCase().includes(q) ||
      a.codigo.toLowerCase().includes(q)
    )
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Alumnos</h1>
          <p className="text-sm text-gray-500">
            Gestiona los alumnos inscritos en {user?.colegioNombre}
          </p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          <Plus className="mr-2 h-4 w-4" />
          Nuevo Alumno
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>Registrar Alumno</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Codigo</label>
                <Input
                  placeholder="2026-001"
                  value={form.codigo}
                  onChange={(e) => setForm({ ...form, codigo: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">CUI / DPI (opcional)</label>
                <Input
                  placeholder="Ej: 1234567890101"
                  value={form.cui}
                  onChange={(e) => setForm({ ...form, cui: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Nombre</label>
                <Input
                  placeholder="Nombre"
                  value={form.nombre}
                  onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Apellido</label>
                <Input
                  placeholder="Apellido"
                  value={form.apellido}
                  onChange={(e) => setForm({ ...form, apellido: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Grado</label>
                <select
                  value={form.gradoId}
                  onChange={(e) => setForm({ ...form, gradoId: e.target.value })}
                  className="h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
                >
                  <option value="">Sin grado</option>
                  {(grados ?? []).map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.nombre}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowForm(false)}>
                Cancelar
              </Button>
              <Button
                onClick={() => createMutation.mutate()}
                disabled={createMutation.isPending || !form.codigo || !form.nombre}
              >
                {createMutation.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                Guardar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Listado de Alumnos</CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Buscar alumno..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-gray-300" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Users className="h-12 w-12 text-gray-300" />
              <p className="mt-3 text-sm text-gray-500">No hay alumnos registrados</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 text-left">
                    <th className="pb-3 pr-4 font-medium text-gray-500">Codigo</th>
                    <th className="pb-3 pr-4 font-medium text-gray-500">Nombre</th>
                    <th className="pb-3 pr-4 font-medium text-gray-500">Grado</th>
                    <th className="pb-3 pr-4 font-medium text-gray-500">Responsable</th>
                    <th className="pb-3 pr-4 font-medium text-gray-500">Estado</th>
                    <th className="pb-3 font-medium text-gray-500">Carnet</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((alumno) => (
                    <tr key={alumno.id} className="border-b border-gray-100 last:border-0">
                      <td className="py-3 pr-4 text-gray-600">{alumno.codigo}</td>
                      <td className="py-3 pr-4 font-medium text-gray-900">
                        {alumno.nombre} {alumno.apellido}
                      </td>
                      <td className="py-3 pr-4">
                        {alumno.grado ? (
                          <span className="inline-flex items-center gap-1 text-gray-600">
                            <GraduationCap className="h-4 w-4 text-gray-400" />
                            {alumno.grado.nombre}
                          </span>
                        ) : (
                          <span className="text-gray-400">Sin grado</span>
                        )}
                      </td>
                      <td className="py-3 pr-4 text-gray-600">
                        {alumno.responsable ? alumno.responsable.nombre : "-"}
                      </td>
                      <td className="py-3">
                        <Badge variant="success">Activo</Badge>
                      </td>
                      <td className="py-3">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setCarnetAlumno(alumno)
                          }}
                        >
                          <QrCode className="h-3 w-3" />
                          <span className="ml-1">QR</span>
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {carnetAlumno && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Carnet Digital</h3>
                <p className="text-sm text-gray-500">
                  {carnetAlumno.codigo} - {carnetAlumno.nombre} {carnetAlumno.apellido}
                </p>
              </div>
              <button
                onClick={() => setCarnetAlumno(null)}
                className="rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-5 flex justify-center">
              {!carnetQuery.data || carnetQuery.isLoading ? (
                <div className="flex h-64 w-64 items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                </div>
              ) : (
                <img
                  src={carnetQuery.data.qrImage}
                  alt="QR del alumno"
                  className="h-64 w-64 rounded-md border border-gray-200"
                />
              )}
            </div>

            <p className="mt-3 text-center text-xs text-gray-500">
              El profesor escanea este codigo para registrar asistencia
            </p>

            <div className="mt-5 grid grid-cols-3 gap-2">
              <Button variant="outline" size="sm" onClick={regenerarQr}>
                <RefreshCw className="h-3 w-3" />
                <span className="ml-1">Regenerar</span>
              </Button>
              <Button variant="outline" size="sm" onClick={handleDescargarCarnet}>
                <Download className="h-3 w-3" />
                <span className="ml-1">Descargar</span>
              </Button>
              <Button size="sm" onClick={() => setCarnetAlumno(null)}>
                Cerrar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
