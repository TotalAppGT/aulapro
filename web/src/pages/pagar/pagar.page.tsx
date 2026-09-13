import { useState } from "react"
import { useQuery, useMutation } from "@tanstack/react-query"
import { useSearchParams } from "react-router-dom"
import {
  Loader2,
  CreditCard,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useAuthStore } from "@/stores/auth.store"
import { apiGet, apiPost } from "@/lib/api"
import { formatCurrency } from "@/lib/utils"

interface EstadoPago {
  id: string
  alumno: string
  mes: string
  monto: number
  estado: string
  fechaPago: string | null
  liquidado: boolean
}

interface CheckoutResult {
  checkout_url: string
  checkout_id: string
  referencia: string
  monto: number
}

export default function PagarPage() {
  const user = useAuthStore((s) => s.user)
  const [searchParams] = useSearchParams()
  const alumnoId = searchParams.get("alumnoId") || ""
  const mes = searchParams.get("mes") || ""
  const [error, setError] = useState("")

  const { data: estado, isLoading } = useQuery<EstadoPago>({
    queryKey: ["pago-estado", user?.colegioId, alumnoId, mes],
    queryFn: () =>
      apiGet<EstadoPago>(`/${user?.colegioId}/pagos/estado/${alumnoId}/${mes}`),
    enabled: !!user && !!alumnoId && !!mes,
    retry: false,
  })

  const checkoutMutation = useMutation({
    mutationFn: () =>
      apiPost<CheckoutResult>(`/${user?.colegioId}/pagos/checkout`, {
        alumnoId,
        mes,
      }),
    onSuccess: (data) => {
      window.open(data.checkout_url, "_blank")
    },
    onError: (err: Error) => setError(err.message),
  })

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <p className="text-sm text-gray-600">
              Debes iniciar sesion para realizar un pago.
            </p>
            <Button className="mt-4 w-full" onClick={() => (window.location.href = "/login")}>
              Iniciar Sesion
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12">
      <div className="w-full max-w-md">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-xl">Pago de Colegiatura</CardTitle>
            <CardDescription>
              {user.colegioNombre} - Plataforma de pagos segura
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {isLoading ? (
              <div className="flex items-center justify-center py-10">
                <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
              </div>
            ) : !estado ? (
              <div className="py-10 text-center">
                <AlertTriangle className="mx-auto h-10 w-10 text-yellow-500" />
                <p className="mt-3 text-sm text-gray-600">
                  No se encontro un cobro pendiente para este alumno y mes.
                </p>
              </div>
            ) : estado.estado === "PAGADO" ? (
              <div className="py-10 text-center">
                <CheckCircle2 className="mx-auto h-12 w-12 text-green-500" />
                <p className="mt-3 text-lg font-semibold text-gray-900">
                  Mes pagado
                </p>
                <p className="mt-1 text-sm text-gray-600">
                  {estado.alumno} - {estado.mes}
                </p>
              </div>
            ) : (
              <>
                <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-center">
                  <p className="text-sm text-gray-500">{estado.alumno}</p>
                  <p className="mt-1 text-xs text-gray-400">Periodo: {estado.mes}</p>
                  <p className="mt-3 text-3xl font-extrabold text-gray-900">
                    {formatCurrency(estado.monto)}
                  </p>
                </div>

                {error && (
                  <div className="rounded-md bg-red-50 p-3 text-sm text-red-700 border border-red-200">
                    {error}
                  </div>
                )}

                <Button
                  className="w-full"
                  onClick={() => checkoutMutation.mutate()}
                  disabled={checkoutMutation.isPending}
                >
                  {checkoutMutation.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <CreditCard className="mr-2 h-4 w-4" />
                  )}
                  Pagar con Tarjeta
                </Button>

                <p className="flex items-center justify-center gap-1 text-center text-xs text-gray-400">
                  <ExternalLink className="h-3 w-3" />
                  Seras redirigido a una pasarela de pago segura
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
