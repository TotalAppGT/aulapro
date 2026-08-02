# AulaPro

Sistema de gestion escolar multi-tenant con cobros automaticos para colegios en Guatemala.

## Stack

| Capa | Tecnologia |
|------|-----------|
| Frontend | React 18 + Vite + TailwindCSS + Shadcn/ui |
| Backend | Express + Prisma + TypeScript |
| Base de datos | PostgreSQL |
| Pagos | Recurrente API (checkouts, split automatico, webhooks) |
| Archivos | Cloudflare R2 (S3-compatible, egress gratis) |
| Mensajeria | WhatsApp Cloud API (Meta) |
| Auth | JWT (bcrypt + jsonwebtoken) |
| Hosting | Railway |
| Dominio | totalappgt.online (Cloudflare) |

## Estructura

```
aulapro/
├── prisma/
│   ├── schema.prisma          # Schema multi-tenant (20 tablas)
│   └── seed.ts                # Datos de prueba
├── src/
│   ├── index.ts               # Servidor Express
│   ├── config.ts              # Variables de entorno
│   ├── middleware/
│   │   ├── auth.ts            # JWT authentication
│   │   ├── tenant.ts          # Aislamiento multi-colegio
│   │   └── error.ts           # Manejo de errores
│   ├── routes/
│   │   ├── auth.routes.ts     # Registro/login
│   │   ├── colegio.routes.ts  # Configuracion del colegio
│   │   ├── pago.routes.ts     # Cobros y checkouts
│   │   ├── calificacion.routes.ts
│   │   ├── tarea.routes.ts
│   │   └── webhooks/recurrente.ts
│   ├── services/
│   │   ├── recurrente.service.ts   # API de pagos
│   │   ├── whatsapp.service.ts     # Notificaciones
│   │   ├── storage.service.ts      # Cloudflare R2
│   │   └── pdf.service.ts          # Boletines y reportes
│   └── jobs/
│       └── liquidacion.ts     # Cron de liquidacion quincenal
├── web/                       # Frontend React
│   └── src/
│       ├── pages/
│       │   ├── landing/       # Landing page de venta
│       │   ├── auth/          # Login y registro
│       │   ├── admin/         # Dashboard del colegio
│       │   ├── profesor/      # Portal del profesor
│       │   ├── padre/         # Portal de padres
│       │   └── alumno/        # Portal del alumno
│       └── components/
│           ├── ui/            # Componentes Shadcn
│           └── layout/        # Sidebar, header
└── landing/                   # Landing page Astro
```

## Instalacion

```bash
cd aulapro
npm install
cd web && npm install
cd ../landing && npm install
cd ..
```

## Configuracion

Copia `.env.example` a `.env` y configura:

```env
DATABASE_URL="postgresql://..."
JWT_SECRET="secreto-largo"
RECURRENTE_SECRET_KEY="sk_live_xxx"
RECURRENTE_ACCOUNT_ID="ac_iryxdatc"
WHATSAPP_TOKEN="EAAxxx"
R2_ACCESS_KEY_ID="xxx"
```

## Base de datos

```bash
npx prisma migrate dev --name init
npm run db:seed
```

## Desarrollo

```bash
npm run dev          # API (puerto 3000) + Frontend (puerto 5173)
npm run dev:api      # Solo API
npm run dev:web      # Solo Frontend
```

## Landing page

```bash
cd landing
npm run dev
```

## Modelo de negocio

- **Suscripcion SaaS:** Q149-Q599/mes segun plan
- **Comision por cobro:** 3% automatico via Recurrente `transfer_setups`
- **Prueba gratis:** 14 dias sin tarjeta

## Roles

- ADMIN_COLEGIO: Control total del colegio
- PROFESOR: Calificar, crear tareas, pasar asistencia
- PADRE: Ver notas, pagar, mensajes con profesores
- ALUMNO: Ver tareas, entregar, ver horario
