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
  X,
  ArrowRight,
  Menu,
  Star,
  Sparkles,
  Phone,
  Mail,
  MapPin,
  ChevronDown,
  Clock,
  Zap,
  TrendingUp,
  Award,
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
      "Genera cobros mensuales automaticamente, envia recordatorios por WhatsApp y recibe pagos en linea con tarjeta o transferencia.",
    tag: "Pagos",
  },
  {
    icon: ClipboardCheck,
    title: "Calificaciones Digitales",
    description:
      "Registra notas, calcula promedios automaticamente y genera boletines listos para imprimir o enviar por correo.",
    tag: "Academico",
  },
  {
    icon: Users,
    title: "Portal de Padres",
    description:
      "Los padres ven notas, tareas, pagos y anuncios de sus hijos en tiempo real desde su celular, sin instalar nada.",
    tag: "Familias",
  },
  {
    icon: BookOpen,
    title: "Tareas en Linea",
    description:
      "Asigna, recibe y califica tareas digitalmente. Los alumnos suben archivos desde cualquier dispositivo.",
    tag: "Academico",
  },
  {
    icon: MessageCircle,
    title: "WhatsApp Integrado",
    description:
      "Envia anuncios, recordatorios de pago y comunicados directamente al WhatsApp de los padres con un solo clic.",
    tag: "Comunicacion",
  },
  {
    icon: FileBarChart,
    title: "Reportes MINEDUC",
    description:
      "Genera reportes estadisticos y cuadros oficiales listos para presentar al ministerio de educacion.",
    tag: "Reportes",
  },
]

const pricingPlans = [
  {
    name: "Starter",
    monthly: 149,
    annual: 119,
    students: "Hasta 100 alumnos",
    description: "Ideal para colegios pequenos que inician su digitalizacion.",
    features: [
      { text: "Gestion de alumnos y grados", included: true },
      { text: "Cobranza automatizada", included: true },
      { text: "Portal de padres basico", included: true },
      { text: "Calificaciones digitales", included: true },
      { text: "WhatsApp integrado", included: false },
      { text: "Tareas en linea", included: false },
      { text: "Reportes MINEDUC", included: false },
      { text: "Soporte prioritario", included: false },
    ],
    cta: "Comenzar Prueba",
    highlighted: false,
  },
  {
    name: "Pro",
    monthly: 349,
    annual: 279,
    students: "Hasta 500 alumnos",
    description: "La opcion mas popular para colegios en crecimiento.",
    features: [
      { text: "Gestion de alumnos y grados", included: true },
      { text: "Cobranza automatizada", included: true },
      { text: "Portal de padres basico", included: true },
      { text: "Calificaciones digitales", included: true },
      { text: "WhatsApp integrado", included: true },
      { text: "Tareas en linea", included: true },
      { text: "Reportes MINEDUC", included: true },
      { text: "Soporte prioritario", included: true },
    ],
    cta: "Comenzar Prueba",
    highlighted: true,
  },
  {
    name: "Business",
    monthly: 599,
    annual: 479,
    students: "Alumnos ilimitados",
    description: "Para instituciones con multiples sedes y necesidades avanzadas.",
    features: [
      { text: "Todo lo de Pro", included: true },
      { text: "Alumnos ilimitados", included: true },
      { text: "Multiples sedes", included: true },
      { text: "API de integracion", included: true },
      { text: "Usuarios ilimitados", included: true },
      { text: "Capacitacion presencial", included: true },
      { text: "Soporte dedicado 24/7", included: true },
      { text: "Consultoria personalizada", included: true },
    ],
    cta: "Comenzar Prueba",
    highlighted: false,
  },
]

const testimonials = [
  {
    name: "Lic. Maria Jose Lopez",
    role: "Directora, Colegio Cristiano Bethel",
    quote:
      "Reduje el tiempo de cobranza de 3 semanas a 2 dias. Los padres pagan en linea y ya no tenemos morosidad.",
  },
  {
    name: "Prof. Carlos Estrada",
    role: "Coordinador Academico",
    quote:
      "Los boletines se generan solos. Lo que antes nos tomaba una semana ahora se hace en minutos.",
  },
  {
    name: "Sra. Ana Martinez",
    role: "Madre de familia",
    quote:
      "Ahora veo las notas y los pagos de mis hijos desde mi celular. La comunicacion con el colegio mejoro muchisimo.",
  },
]

const faqs = [
  {
    question: "¿Necesito tarjeta de credito para la prueba?",
    answer:
      "No. Los 14 dias de prueba son completamente gratis y sin necesidad de registrar una tarjeta. Puedes cancelar cuando quieras.",
  },
  {
    question: "¿Los padres necesitan instalar una aplicacion?",
    answer:
      "No. El portal de padres funciona directamente desde el navegador del celular. Solo reciben un enlace y un acceso seguro.",
  },
  {
    question: "¿Puedo cambiar de plan mas adelante?",
    answer:
      "Si. Puedes cambiar de plan en cualquier momento desde el panel de administracion. El costo se prorratea automaticamente.",
  },
  {
    question: "¿Ofrecen capacitacion para mi equipo?",
    answer:
      "Si. Todos los planes incluyen una sesion de induccion guiada y acceso a nuestra base de conocimiento. En Business la capacitacion es presencial.",
  },
  {
    question: "¿Mis datos estan seguros?",
    answer:
      "Si. Usamos cifrado de extremo a extremo, copias de seguridad automaticas y servidores con los mas altos estandares de seguridad.",
  },
]

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [billing, setBilling] = useState<"monthly" | "annual">("monthly")
  const [openFaq, setOpenFaq] = useState<number | null>(0)
  const navigate = useNavigate()

  const goToRegister = () => navigate("/registro")
  const goToLogin = () => navigate("/login")

  return (
    <div className="min-h-screen bg-white">
      <header className="fixed top-0 z-50 w-full border-b border-gray-100 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-indigo-600 text-white shadow-md">
              <School className="h-5 w-5" />
            </div>
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
              href="#testimonials"
              className="text-sm font-medium text-gray-600 hover:text-primary"
            >
              Clientes
            </a>
            <a
              href="#pricing"
              className="text-sm font-medium text-gray-600 hover:text-primary"
            >
              Precios
            </a>
            <a
              href="#faq"
              className="text-sm font-medium text-gray-600 hover:text-primary"
            >
              Preguntas
            </a>
            <a
              href="#contact"
              className="text-sm font-medium text-gray-600 hover:text-primary"
            >
              Contacto
            </a>
            <Button variant="outline" onClick={goToLogin}>
              Iniciar Sesion
            </Button>
            <Button onClick={goToRegister}>
              Prueba Gratis
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
              <a
                href="#contact"
                className="text-sm font-medium text-gray-600"
                onClick={() => setMobileMenuOpen(false)}
              >
                Contacto
              </a>
              <Button
                variant="outline"
                className="w-full"
                onClick={goToLogin}
              >
                Iniciar Sesion
              </Button>
              <Button className="w-full" onClick={goToRegister}>
                Prueba Gratis
              </Button>
            </div>
          </div>
        )}
      </header>

      <section className="relative overflow-hidden px-4 pt-32 pb-24 sm:px-6 lg:px-8">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 via-white to-primary-50" />
        <div className="absolute -top-40 right-0 h-[600px] w-[600px] rounded-full bg-gradient-to-br from-primary-200/50 to-indigo-200/50 blur-3xl" />
        <div className="absolute -bottom-40 left-0 h-[400px] w-[400px] rounded-full bg-gradient-to-tr from-amber-100/60 to-primary-100/40 blur-3xl" />

        <div className="relative mx-auto max-w-4xl text-center">
          <div className="mb-6 flex items-center justify-center gap-2">
            <Badge variant="secondary" className="px-4 py-1.5 text-sm">
              <Sparkles className="mr-1.5 h-4 w-4 text-primary" />
              Nuevo: Prueba gratuita de 14 dias sin tarjeta de credito
            </Badge>
          </div>

          <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 sm:text-5xl lg:text-6xl">
            Gestion Escolar Inteligente para{" "}
            <span className="bg-gradient-to-r from-primary via-indigo-600 to-violet-600 bg-clip-text text-transparent">
              Colegios en Guatemala
            </span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-lg text-gray-600 sm:text-xl">
            Automatiza pagos, calificaciones, tareas y comunicacion con padres
            desde{" "}
            <span className="font-semibold text-primary">Q119/mes</span>.
            Todo en una sola plataforma, sin instalaciones complicadas.
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Button
              size="lg"
              className="w-full sm:w-auto text-base shadow-lg shadow-primary/30"
              onClick={goToRegister}
            >
              Probar 14 Dias Gratis
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="w-full sm:w-auto text-base"
              onClick={goToLogin}
            >
              Ver Demo
            </Button>
          </div>

          <div className="mt-8 flex items-center justify-center gap-2 text-sm text-gray-500">
            <ShieldCheck className="h-4 w-4 text-green-500" />
            Sin tarjeta de credito. Cancela cuando quieras.
          </div>

          <div className="mx-auto mt-16 grid max-w-3xl grid-cols-2 gap-6 sm:grid-cols-4">
            {[
              { icon: Users, value: "+200", label: "Colegios activos" },
              { icon: TrendingUp, value: "98%", label: "Pago puntual" },
              { icon: Clock, value: "-80%", label: "Tiempo en cobranza" },
              { icon: Award, value: "4.9/5", label: "Satisfaccion" },
            ].map((stat, i) => {
              const Icon = stat.icon
              return (
                <div key={i} className="rounded-2xl border border-gray-100 bg-white/70 p-4 text-center shadow-sm backdrop-blur-sm">
                  <Icon className="mx-auto h-6 w-6 text-primary" />
                  <p className="mt-2 text-2xl font-extrabold text-gray-900">
                    {stat.value}
                  </p>
                  <p className="text-xs font-medium text-gray-500">
                    {stat.label}
                  </p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      <section
        id="problems"
        className="border-t border-gray-100 bg-gray-50 px-4 py-20 sm:px-6 lg:px-8"
      >
        <div className="mx-auto max-w-5xl">
          <div className="text-center">
            <Badge variant="secondary" className="mb-4">
              ¿Te identificas?
            </Badge>
            <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">
              ¿Problemas gestionando tu colegio?
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
                  className="group rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-red-50 to-rose-100 transition-colors group-hover:from-red-100 group-hover:to-rose-200">
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
            <Badge variant="secondary" className="mb-4">
              Funcionalidades
            </Badge>
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
                  className="group relative overflow-hidden rounded-xl border border-gray-200 p-6 transition-all hover:-translate-y-1 hover:border-primary/40 hover:shadow-lg"
                >
                  <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-gradient-to-br from-primary-50 to-indigo-50 opacity-0 transition-opacity group-hover:opacity-100" />
                  <div className="relative">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-indigo-600 text-white shadow-md transition-transform group-hover:scale-110">
                      <Icon className="h-6 w-6" />
                    </div>
                    <h3 className="mt-4 text-lg font-semibold text-gray-900">
                      {feature.title}
                    </h3>
                    <p className="mt-2 text-sm text-gray-600">
                      {feature.description}
                    </p>
                    <div className="mt-4">
                      <Badge variant="secondary" className="text-xs">
                        {feature.tag}
                      </Badge>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      <section
        id="testimonials"
        className="border-t border-gray-100 bg-gradient-to-b from-gray-50 to-white px-4 py-20 sm:px-6 lg:px-8"
      >
        <div className="mx-auto max-w-6xl">
          <div className="text-center">
            <Badge variant="secondary" className="mb-4">
              Testimonios
            </Badge>
            <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">
              Colegios que ya transformaron su gestion
            </h2>
          </div>

          <div className="mt-12 grid gap-6 lg:grid-cols-3">
            {testimonials.map((t, i) => (
              <div
                key={i}
                className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm"
              >
                <div className="flex gap-1 text-amber-400">
                  {Array.from({ length: 5 }).map((_, j) => (
                    <Star key={j} className="h-4 w-4 fill-current" />
                  ))}
                </div>
                <p className="mt-4 text-sm leading-relaxed text-gray-700">
                  "{t.quote}"
                </p>
                <div className="mt-6 border-t border-gray-100 pt-4">
                  <p className="text-sm font-semibold text-gray-900">{t.name}</p>
                  <p className="text-xs text-gray-500">{t.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section
        id="pricing"
        className="border-t border-gray-100 bg-gray-50 px-4 py-20 sm:px-6 lg:px-8"
      >
        <div className="mx-auto max-w-6xl">
          <div className="text-center">
            <Badge variant="secondary" className="mb-4">
              <Zap className="mr-1 h-3 w-3 text-amber-500" />
              Precios
            </Badge>
            <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">
              Precios simples y transparentes
            </h2>
            <p className="mt-3 text-lg text-gray-600">
              Todos los planes incluyen 14 dias de prueba gratis. Sin compromiso.
            </p>

            <div className="mt-8 inline-flex items-center gap-3 rounded-full border border-gray-200 bg-white p-1.5 shadow-sm">
              <button
                onClick={() => setBilling("monthly")}
                className={`rounded-full px-5 py-2 text-sm font-semibold transition-colors ${
                  billing === "monthly"
                    ? "bg-primary text-white shadow"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                Mensual
              </button>
              <button
                onClick={() => setBilling("annual")}
                className={`rounded-full px-5 py-2 text-sm font-semibold transition-colors ${
                  billing === "annual"
                    ? "bg-primary text-white shadow"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                Anual
                <Badge variant="success" className="ml-2">
                  -20%
                </Badge>
              </button>
            </div>
          </div>

          <div className="mt-12 grid gap-8 lg:grid-cols-3">
            {pricingPlans.map((plan, i) => (
              <div
                key={i}
                className={`relative flex flex-col rounded-2xl border p-8 ${
                  plan.highlighted
                    ? "border-transparent bg-white shadow-xl ring-2 ring-primary scale-[1.02]"
                    : "border-gray-200 bg-white shadow-sm"
                }`}
              >
                {plan.highlighted && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-gradient-to-r from-primary to-indigo-600 text-white">
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
                    Q
                    {billing === "monthly" ? plan.monthly : plan.annual}
                  </span>
                  <span className="text-gray-500">/mes</span>
                  {billing === "annual" && (
                    <p className="mt-1 text-xs font-medium text-green-600">
                      Facturado anualmente (ahorra Q
                      {(plan.monthly - plan.annual) * 12}/ano)
                    </p>
                  )}
                </div>

                <p className="mb-6 text-sm text-gray-600">
                  {plan.description}
                </p>

                <ul className="mb-8 flex-1 space-y-3">
                  {plan.features.map((feature, j) => (
                    <li key={j} className="flex items-start gap-2 text-sm">
                      {feature.included ? (
                        <span className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-green-100">
                          <Check className="h-3 w-3 text-green-600" />
                        </span>
                      ) : (
                        <span className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-gray-100">
                          <X className="h-3 w-3 text-gray-400" />
                        </span>
                      )}
                      <span
                        className={
                          feature.included
                            ? "text-gray-700"
                            : "text-gray-400 line-through"
                        }
                      >
                        {feature.text}
                      </span>
                    </li>
                  ))}
                </ul>

                <Button
                  className="w-full"
                  variant={plan.highlighted ? "default" : "outline"}
                  onClick={goToRegister}
                >
                  {plan.cta}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>

          <p className="mt-8 text-center text-sm text-gray-500">
            Todos los precios en Quetzales (GTQ). IVA incluido. Cambio de plan
            en cualquier momento.
          </p>
        </div>
      </section>

      <section id="faq" className="px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl">
          <div className="text-center">
            <Badge variant="secondary" className="mb-4">
              Preguntas frecuentes
            </Badge>
            <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">
              Resolvemos tus dudas
            </h2>
          </div>

          <div className="mt-12 space-y-4">
            {faqs.map((faq, i) => (
              <div
                key={i}
                className="overflow-hidden rounded-xl border border-gray-200 bg-white"
              >
                <button
                  className="flex w-full items-center justify-between px-6 py-4 text-left"
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                >
                  <span className="font-semibold text-gray-900">
                    {faq.question}
                  </span>
                  <ChevronDown
                    className={`h-5 w-5 flex-shrink-0 text-gray-400 transition-transform ${
                      openFaq === i ? "rotate-180" : ""
                    }`}
                  />
                </button>
                {openFaq === i && (
                  <div className="border-t border-gray-100 px-6 py-4">
                    <p className="text-sm leading-relaxed text-gray-600">
                      {faq.answer}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl overflow-hidden rounded-3xl bg-gradient-to-br from-primary via-indigo-600 to-violet-700 px-8 py-16 text-center shadow-2xl shadow-primary/30 sm:px-12">
          <h2 className="text-3xl font-bold text-white sm:text-4xl">
            ¿Listo para transformar tu colegio?
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-lg text-indigo-100">
            Unete a mas de 200 colegios en Guatemala que ya usan AulaPro.
            Empieza tu prueba gratuita hoy y olvidate de las hojas de calculo.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Button
              size="lg"
              className="w-full bg-white text-primary hover:bg-indigo-50 sm:w-auto text-base shadow-lg"
              onClick={goToRegister}
            >
              Comenzar Prueba Gratis
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="w-full border-white/40 bg-white/10 text-white hover:bg-white/20 sm:w-auto text-base"
              onClick={goToLogin}
            >
              Iniciar Sesion
            </Button>
          </div>
        </div>
      </section>

      <footer id="contact" className="border-t border-gray-200 bg-gray-900 px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-indigo-600 text-white">
                  <School className="h-4 w-4" />
                </div>
                <span className="text-lg font-bold text-white">
                  AulaPro
                </span>
              </div>
              <p className="mt-3 text-sm text-gray-400">
                Software de gestion escolar disenado para colegios en Guatemala.
              </p>
              <div className="mt-4 space-y-2 text-sm text-gray-400">
                <p className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-gray-500" />
                  +502 5830 9505
                </p>
                <p className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-gray-500" />
                  contacto@totalappgt.online
                </p>
                <p className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-gray-500" />
                  Guatemala, C.A.
                </p>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-white">
                Producto
              </h4>
              <ul className="mt-3 space-y-2">
                <li>
                  <a
                    href="#features"
                    className="text-sm text-gray-400 hover:text-primary"
                  >
                    Funcionalidades
                  </a>
                </li>
                <li>
                  <a
                    href="#pricing"
                    className="text-sm text-gray-400 hover:text-primary"
                  >
                    Precios
                  </a>
                </li>
                <li>
                  <a
                    href="#testimonials"
                    className="text-sm text-gray-400 hover:text-primary"
                  >
                    Testimonios
                  </a>
                </li>
                <li>
                  <a
                    href="#faq"
                    className="text-sm text-gray-400 hover:text-primary"
                  >
                    Preguntas frecuentes
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-white">Soporte</h4>
              <ul className="mt-3 space-y-2">
                <li>
                  <a
                    href="#contact"
                    className="text-sm text-gray-400 hover:text-primary"
                  >
                    Contacto
                  </a>
                </li>
                <li>
                  <a
                    href="#faq"
                    className="text-sm text-gray-400 hover:text-primary"
                  >
                    Centro de ayuda
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-sm text-gray-400 hover:text-primary"
                  >
                    Documentacion
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-sm text-gray-400 hover:text-primary"
                  >
                    Estado del servicio
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-white">Legal</h4>
              <ul className="mt-3 space-y-2">
                <li>
                  <a
                    href="#"
                    className="text-sm text-gray-400 hover:text-primary"
                  >
                    Privacidad
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-sm text-gray-400 hover:text-primary"
                  >
                    Terminos de servicio
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-sm text-gray-400 hover:text-primary"
                  >
                    Politica de cookies
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-10 border-t border-gray-800 pt-6 text-center">
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
