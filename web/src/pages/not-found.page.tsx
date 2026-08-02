import { useNavigate } from "react-router-dom"
import { Compass, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

export default function NotFoundPage() {
  const navigate = useNavigate()

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md">
        <CardContent className="flex flex-col items-center py-16 text-center">
          <Compass className="h-14 w-14 text-primary" />
          <h1 className="mt-4 text-2xl font-bold text-gray-900">
            Modulo no encontrado
          </h1>
          <p className="mt-2 text-sm text-gray-500">
            La seccion que buscas no existe o aun no esta disponible.
          </p>
          <Button className="mt-6" onClick={() => navigate("/app")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver al Inicio
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
