import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  School,
  FileSpreadsheet,
  Coins,
  MessageCircleOff,
  ShieldCheck,
  Users,
  BookOpen,
  MessageCircle,
  FileBarChart,
  ClipboardCheck,
  Check,
  ArrowRight,
  Menu,
  X,
  Star,
} from "lucide-react"

const painPoints = [
  {
    icon: FileSpreadsheet,
    title: "Cansado del Excel",
    description:
      "Deja de perder horas en hojas de calculo que se rompen. Automatiza calificaciones, asistencia y reportes en un solo lugar.",
  },
  {
    icon: Coins,
    title: "Pagos Manuales",
    description:
      "Olvidate de perseguir pagos con listas de papel. Cobranza automatizada con recordatorios por WhatsApp y reportes en tiempo real.",
  },
  {
    icon: MessageCircleOff,
    title: "Falta de Comunicacion",
    description:
      "Conecta a padres, profesores y administracion en una sola plataforma. Anuncios, tareas y mensajes sin grupos de WhatsApp.",
  },
]

const features = [
  {
    icon: Coins,
    title: "Cobros Automaticos",
    description:
      "Genera cobros mensuales automaticamente, envia recordatorios por WhatsApp y recibe pagos en linea.",
  },
  {
    icon: ClipboardCheck,
    title: "Calificaciones Digitales",
    description:
      "Registra notas, calcula promedios automaticamente y genera boletines listos para imprimir.",
  },
  {
    icon: Users,
    title: "Portal de Padres",
    description:
      "Los padres ven notas, tareas y pagos de sus hijos en tiempo real desde su celular.",
  },
  {
    icon: BookOpen,
    title: "Tareas en Linea",
    description:
      "Asigna, recibe y califica tareas digitalmente. Los alumnos suben archivos desde cualquier dispositivo.",
  },
  {
    icon: MessageCircle,
    title: "WhatsApp Integrado",
    description:
      "Envia anuncios, recordatorios de pago y comunicados directamente al WhatsApp de los padres.",
  },
  {
    icon: FileBarChart,
    title: "Reportes MINEDUC",
    description:
      "Genera reportes estadisticos y cuadros oficiales listos para presentar al ministerio de educacion.",
  },
]

const pricingPlans = [
  {
    name: "Starter",
    price: "Q149",
    period: "/mes",
    students: "Hasta 100 alumnos",
    description: "Ideal para colegios pequenos que inician su digitalizacion.",
    features: [
      "Gestion de alumnos y grados",
      "Cobranza automatizada",
      "Portal de padres basico",
      "Calificaciones digitales",
      "Soporte por correo",
      "1 usuario administrador",
    ],
    cta: "Comenzar Prueba",
    highlighted: false,
  },
  {
    name: "Pro",
    price: "Q349",
    period: "/mes",
    students: "Hasta 500 alumnos",
    description: "La opcion mas popular para colegios en crecimiento.",
    features: [
      "Todo lo de Starter",
      "WhatsApp integrado",
      "Tareas en linea",
      "Portal de profesores",
      "Reportes MINEDUC",
      "5 usuarios administradores",
      "Soporte prioritario",
    ],
    cta: "Comenzar Prueba",
    highlighted: true,
  },
  {
    name: "Business",
    price: "Q599",
    period: "/mes",
    students: "Alumnos ilimitados",
    description: "Para instituciones con multiples sedes y necesidades avanzadas.",
    features: [
      "Todo lo de Pro",
      "Alumnos ilimitados",
      "Multiples sedes",
      "API de integracion",
      "Usuarios ilimitados",
      "Soporte dedicado 24/7",
      "Capacitacion presencial",
    ],
    cta: "Comenzar Prueba",
    highlighted: false,
  },
]

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-white">
      <header className="fixed top-0 z-50 w-full border-b border-gray-100 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2">
            <School className="h-7 w-7 text-primary" />
            <span className="text-xl font-bold tracking-tight text-gray-900">
              AulaPro
            </span>
          </div>

          <nav className="hidden items-center gap-8 md:flex">
            <a
              href="#features"
              className="text-sm font-medium text-gray-600 hover:text-primary"
            >
              Funcionalidades
            </a>
            <a
              href="#pricing"
              className="text-sm font-medium text-gray-600 hover:text-primary"
            >
              Precios
            </a>
            <a
              href="#contact"
              className="text-sm font-medium text-gray-600 hover:text-primary"
            >
              Contacto
            </a>
            <Button
              variant="outline"
              onClick={() => navigate("/login")}
            >
              Iniciar Sesion
            </Button>
          </nav>

          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </Button>
        </div>

        {mobileMenuOpen && (
          <div className="border-t border-gray-100 bg-white px-4 py-4 md:hidden">
            <div className="flex flex-col gap-3">
              <a
                href="#features"
                className="text-sm font-medium text-gray-600"
                onClick={() => setMobileMenuOpen(false)}
              >
                Funcionalidades
              </a>
              <a
                href="#pricing"
                className="text-sm font-medium text-gray-600"
                onClick={() => setMobileMenuOpen(false)}
              >
                Precios
              </a>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => navigate("/login")}
              >
                Iniciar Sesion
              </Button>
            </div>
          </div>
        )}
      </header>

      <section className="relative overflow-hidden px-4 pt-32 pb-20 sm:px-6 lg:px-8">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-50 via-white to-blue-50" />
        <div className="absolute -top-40 right-0 h-[600px] w-[600px] rounded-full bg-primary-100/40 blur-3xl" />
        <div className="absolute -bottom-40 left-0 h-[400px] w-[400px] rounded-full bg-blue-100/30 blur-3xl" />

        <div className="relative mx-auto max-w-4xl text-center">
          <Badge variant="secondary" className="mb-6 text-sm">
            Nuevo: Prueba gratuita de 14 dias sin tarjeta de credito
          </Badge>

          <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 sm:text-5xl lg:text-6xl">
            Gestion Escolar Inteligente para Colegios en Guatemala
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-lg text-gray-600 sm:text-xl">
            Automatiza pagos, calificaciones, tareas y comunicacion con padres
            desde{" "}
            <span className="font-semibold text-primary">Q149/mes</span>.
            Todo en una sola plataforma, sin instalaciones complicadas.
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Button
              size="lg"
              className="w-full sm:w-auto text-base"
              onClick={() => navigate("/registro")}
            >
              Probar 14 Dias Gratis
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="w-full sm:w-auto text-base"
            >
              Ver Demo
            </Button>
          </div>

          <div className="mt-8 flex items-center justify-center gap-2 text-sm text-gray-500">
            <ShieldCheck className="h-4 w-4 text-green-500" />
            Sin tarjeta de credito. Cancela cuando quieras.
          </div>
        </div>
      </section>

      <section
        id="problems"
        className="border-t border-gray-100 bg-gray-50 px-4 py-20 sm:px-6 lg:px-8"
      >
        <div className="mx-auto max-w-5xl">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">
              Â¿Problemas gestionando tu colegio?
            </h2>
            <p className="mt-3 text-lg text-gray-600">
              No estas solo. Estos son los dolores mas comunes de los colegios
              en Guatemala.
            </p>
          </div>

          <div className="mt-12 grid gap-8 sm:grid-cols-3">
            {painPoints.map((point, i) => {
              const Icon = point.icon
              return (
                <div
                  key={i}
                  className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-red-50">
                    <Icon className="h-6 w-6 text-red-500" />
                  </div>
                  <h3 className="mt-4 text-lg font-semibold text-gray-900">
                    {point.title}
                  </h3>
                  <p className="mt-2 text-sm text-gray-600">
                    {point.description}
                  </p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      <section
        id="features"
        className="px-4 py-20 sm:px-6 lg:px-8"
      >
        <div className="mx-auto max-w-6xl">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">
              Todo lo que necesitas en un solo lugar
            </h2>
            <p className="mt-3 text-lg text-gray-600">
              Desde la cobranza hasta los reportes para el ministerio.
            </p>
          </div>

          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature, i) => {
              const Icon = feature.icon
              return (
                <div
                  key={i}
                  className="group rounded-xl border border-gray-200 p-6 transition-shadow hover:shadow-md"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary-50 group-hover:bg-primary-100 transition-colors">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="mt-4 text-lg font-semibold text-gray-900">
                    {feature.title}
                  </h3>
                  <p className="mt-2 text-sm text-gray-600">
                    {feature.description}
                  </p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      <section
        id="pricing"
        className="border-t border-gray-100 bg-gray-50 px-4 py-20 sm:px-6 lg:px-8"
      >
        <div className="mx-auto max-w-6xl">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">
              Precios simples y transparentes
            </h2>
            <p className="mt-3 text-lg text-gray-600">
              Todos los planes incluyen 14 dias de prueba gratis. Sin compromiso.
            </p>
          </div>

          <div className="mt-12 grid gap-8 lg:grid-cols-3">
            {pricingPlans.map((plan, i) => (
              <div
                key={i}
                className={`relative flex flex-col rounded-2xl border p-8 ${
                  plan.highlighted
                    ? "border-primary bg-white shadow-xl ring-2 ring-primary scale-[1.02]"
                    : "border-gray-200 bg-white shadow-sm"
                }`}
              >
                {plan.highlighted && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-primary text-white">
                      <Star className="mr-1 h-3 w-3" /> Mas Popular
                    </Badge>
                  </div>
                )}

                <div className="mb-6">
                  <h3 className="text-xl font-bold text-gray-900">
                    {plan.name}
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    {plan.students}
                  </p>
                </div>

                <div className="mb-6">
                  <span className="text-4xl font-extrabold text-gray-900">
                    {plan.price}
                  </span>
                  <span className="text-gray-500">{plan.period}</span>
                </div>

                <p className="mb-6 text-sm text-gray-600">
                  {plan.description}
                </p>

                <ul className="mb-8 flex-1 space-y-3">
                  {plan.features.map((feature, j) => (
                    <li key={j} className="flex items-start gap-2 text-sm">
                      <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-500" />
                      <span className="text-gray-600">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  className="w-full"
                  variant={plan.highlighted ? "default" : "outline"}
                  onClick={() => navigate("/registro")}
                >
                  {plan.cta}
                </Button>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-gray-900 px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-bold text-white sm:text-4xl">
            Â¿Listo para transformar tu colegio?
          </h2>
          <p className="mt-4 text-lg text-gray-300">
            Unete a mas de 200 colegios en Guatemala que ya usan AulaPro.
            Empieza tu prueba gratuita hoy.
          </p>
          <div className="mt-8">
            <Button
              size="lg"
              className="text-base"
              onClick={() => navigate("/registro")}
            >
              Comenzar Prueba Gratis
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </div>
      </section>

      <footer className="border-t border-gray-200 bg-white px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <div className="flex items-center gap-2">
                <School className="h-6 w-6 text-primary" />
                <span className="text-lg font-bold text-gray-900">
                  AulaPro
                </span>
              </div>
              <p className="mt-3 text-sm text-gray-500">
                Software de gestion escolar disenado para colegios en Guatemala.
              </p>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-gray-900">
                Producto
              </h4>
              <ul className="mt-3 space-y-2">
                <li>
                  <a
                    href="#features"
                    className="text-sm text-gray-500 hover:text-primary"
                  >
                    Funcionalidades
                  </a>
                </li>
                <li>
                  <a
                    href="#pricing"
                    className="text-sm text-gray-500 hover:text-primary"
                  >
                    Precios
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-sm text-gray-500 hover:text-primary"
                  >
                    Actualizaciones
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-gray-900">Soporte</h4>
              <ul className="mt-3 space-y-2">
                <li>
                  <a
                    href="#"
                    className="text-sm text-gray-500 hover:text-primary"
                  >
                    Centro de ayuda
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-sm text-gray-500 hover:text-primary"
                  >
                    Documentacion
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-sm text-gray-500 hover:text-primary"
                  >
                    Contacto
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-gray-900">Legal</h4>
              <ul className="mt-3 space-y-2">
                <li>
                  <a
                    href="#"
                    className="text-sm text-gray-500 hover:text-primary"
                  >
                    Privacidad
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-sm text-gray-500 hover:text-primary"
                  >
                    Terminos
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-10 border-t border-gray-200 pt-6 text-center">
            <p className="text-sm text-gray-500">
              Hecho con dedicacion en Guatemala. &copy; {new Date().getFullYear()}{" "}
              AulaPro. Todos los derechos reservados.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
