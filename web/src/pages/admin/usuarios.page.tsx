import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Users, Plus, Loader2, Search, UserCheck, UserX } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { useAuthStore } from "@/stores/auth.store"
import { apiGet, apiPost, apiPatch } from "@/lib/api"
import { formatDateShort } from "@/lib/utils"

type Rol = "ADMIN_COLEGIO" | "PROFESOR" | "PADRE" | "ALUMNO"

interface Usuario {
  id: string
  nombre: string
  email: string
  rol: Rol
  telefono: string | null
  activo: boolean
  createdAt: string
}

const ROL_LABEL: Record<Rol, string> = {
  ADMIN_COLEGIO: "Administrador",
  PROFESOR: "Profesor",
  PADRE: "Padre de familia",
  ALUMNO: "Alumno",
}

const ROL_CREABLES = [
  { value: "PROFESOR", label: "Profesor" },
  { value: "PADRE", label: "Padre de familia" },
  { value: "ALUMNO", label: "Alumno" },
]

const emptyForm = {
  nombre: "",
  email: "",
  password: "",
  rol: "PROFESOR" as Rol,
  telefono: "",
}

export default function UsuariosPage() {
  const user = useAuthStore((s) => s.user)
  const queryClient = useQueryClient()
  const [search, setSearch] = useState("")
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(emptyForm)

  const { data: usuarios, isLoading } = useQuery<Usuario[]>({
    queryKey: ["usuarios", user?.colegioId],
    queryFn: () => apiGet<Usuario[]>(`/${user?.colegioId}/usuarios`),
    enabled: !!user?.colegioId,
  })

  const createMutation = useMutation({
    mutationFn: () =>
      apiPost(`/${user?.colegioId}/usuarios`, {
        nombre: form.nombre,
        email: form.email,
        password: form.password,
        rol: form.rol,
        telefono: form.telefono || null,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["usuarios"] })
      setShowForm(false)
      setForm(emptyForm)
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) =>
      apiPatch(`/${user?.colegioId}/usuarios/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["usuarios"] })
    },
  })

  const filtered = (usuarios ?? []).filter((u) => {
    const q = search.toLowerCase()
    return (
      u.nombre.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      ROL_LABEL[u.rol].toLowerCase().includes(q)
    )
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Usuarios</h1>
          <p className="text-sm text-gray-500">
            Gestiona los usuarios de {user?.colegioNombre}
          </p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          <Plus className="mr-2 h-4 w-4" />
          Nuevo Usuario
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>Crear Usuario</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Nombre</label>
                <Input
                  placeholder="Nombre completo"
                  value={form.nombre}
                  onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Email</label>
                <Input
                  type="email"
                  placeholder="usuario@colegio.com"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Contrasena</label>
                <Input
                  type="password"
                  placeholder="Minimo 6 caracteres"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Rol</label>
                <select
                  value={form.rol}
                  onChange={(e) => setForm({ ...form, rol: e.target.value as Rol })}
                  className="h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
                >
                  {ROL_CREABLES.map((r) => (
                    <option key={r.value} value={r.value}>
                      {r.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Telefono (WhatsApp)</label>
                <Input
                  placeholder="50251234567"
                  value={form.telefono}
                  onChange={(e) => setForm({ ...form, telefono: e.target.value })}
                />
              </div>
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowForm(false)}>
                Cancelar
              </Button>
              <Button
                onClick={() => createMutation.mutate()}
                disabled={
                  createMutation.isPending ||
                  !form.nombre.trim() ||
                  !form.email.trim() ||
                  form.password.length < 6
                }
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
            <CardTitle>Listado de Usuarios</CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Buscar usuario..."
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
              <p className="mt-3 text-sm text-gray-500">No hay usuarios registrados</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 text-left">
                    <th className="pb-3 pr-4 font-medium text-gray-500">Nombre</th>
                    <th className="pb-3 pr-4 font-medium text-gray-500">Email</th>
                    <th className="pb-3 pr-4 font-medium text-gray-500">Rol</th>
                    <th className="pb-3 pr-4 font-medium text-gray-500">Telefono</th>
                    <th className="pb-3 pr-4 font-medium text-gray-500">Registro</th>
                    <th className="pb-3 pr-4 font-medium text-gray-500">Estado</th>
                    <th className="pb-3 font-medium text-gray-500">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((usuario) => (
                    <tr key={usuario.id} className="border-b border-gray-100 last:border-0">
                      <td className="py-3 pr-4 font-medium text-gray-900">{usuario.nombre}</td>
                      <td className="py-3 pr-4 text-gray-600">{usuario.email}</td>
                      <td className="py-3 pr-4">
                        <Badge variant="secondary">{ROL_LABEL[usuario.rol]}</Badge>
                      </td>
                      <td className="py-3 pr-4 text-gray-600">{usuario.telefono || "-"}</td>
                      <td className="py-3 pr-4 text-gray-500">
                        {formatDateShort(usuario.createdAt)}
                      </td>
                      <td className="py-3 pr-4">
                        <Badge variant={usuario.activo ? "success" : "destructive"}>
                          {usuario.activo ? "Activo" : "Inactivo"}
                        </Badge>
                      </td>
                      <td className="py-3">
                        <div className="flex items-center gap-2">
                          {usuario.rol === "PROFESOR" && (
                            <select
                              value={usuario.rol}
                              onChange={(e) =>
                                updateMutation.mutate({
                                  id: usuario.id,
                                  data: { rol: e.target.value },
                                })
                              }
                              className="h-8 rounded-md border border-gray-300 bg-white px-2 text-xs"
                            >
                              <option value="PROFESOR">Profesor</option>
                              <option value="PADRE">Padre</option>
                              <option value="ALUMNO">Alumno</option>
                            </select>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              updateMutation.mutate({
                                id: usuario.id,
                                data: { activo: !usuario.activo },
                              })
                            }
                            disabled={updateMutation.isPending}
                            title={usuario.activo ? "Desactivar" : "Activar"}
                          >
                            {usuario.activo ? (
                              <UserX className="h-3 w-3" />
                            ) : (
                              <UserCheck className="h-3 w-3" />
                            )}
                          </Button>
                        </div>
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
