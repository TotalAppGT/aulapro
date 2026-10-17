import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { planDe } from '../src/lib/planes';

const prisma = new PrismaClient();

const PASS = 'admintotal';
const now = new Date();
const DAY = 86400000;
const addDays = (n: number) => new Date(now.getTime() + n * DAY);
const at = (y: number, m: number, d: number) => new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
const pick = <T>(a: T[], i: number): T => a[((i % a.length) + a.length) % a.length];
const rand = (i: number, mod: number) => ((i * 9301 + 49297) % 233280) % mod; // pseudo-aleatorio determinista

function mesesUltimos(cantidad: number): string[] {
  const out: string[] = [];
  for (let k = cantidad - 1; k >= 0; k--) {
    const d = new Date(now.getFullYear(), now.getMonth() - k, 1);
    out.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
  }
  return out;
}

const NOMBRES = ['Ana', 'Luis', 'Karla', 'Diego', 'Elena', 'Marco', 'Sara', 'Iván', 'Paola', 'Bruno', 'Nadia', 'Hugo', 'Julia', 'Raúl', 'Clara', 'Félix', 'Diana', 'Óscar', 'Mía', 'Leo', 'Rosa', 'Tomás', 'Eva', 'Pablo', 'nora', 'Alan', 'Iris', 'Dante', 'Lía', 'Gael'];
const APELLIDOS = ['Solís', 'Vega', 'Lima', 'Cruz', 'Ortiz', 'Mejía', 'López', 'García', 'Pérez', 'Ramírez', 'Torres', 'Flores', 'Castillo', 'Morales', 'Reyes', 'Hernández'];

interface SeedCfg {
  nombre: string;
  emailAdmin: string;
  emailDomain: string;
  codigoRef: string;
  plan: string;
  estado: string;
  telefono: string;
  direccion: string;
  mensualidad: number;
  grados: { nombre: string; nivel: string }[];
  materias: string[];
  nProfesores: number;
  nPadres: number;
  nAlumnos: number;
  diasAsistencia: number;
  nCursosMaterias: number;
  mesesMensualidad: number;
}

async function resetColegio(colegioId: string): Promise<void> {
  await prisma.curso.deleteMany({ where: { colegioId } });
  await prisma.notificacionProgramada.deleteMany({ where: { colegioId } });
  await prisma.documento.deleteMany({ where: { colegioId } });
  await prisma.mensaje.deleteMany({ where: { colegioId } });
  await prisma.anuncio.deleteMany({ where: { colegioId } });
  await prisma.calificacion.deleteMany({ where: { colegioId } });
  await prisma.asistencia.deleteMany({ where: { colegioId } });
  await prisma.entregaTarea.deleteMany({ where: { colegioId } });
  await prisma.tarea.deleteMany({ where: { colegioId } });
  await prisma.horario.deleteMany({ where: { colegioId } });
  await prisma.mensualidad.deleteMany({ where: { colegioId } });
  await prisma.pagoCheckout.deleteMany({ where: { colegioId } });
  await prisma.comisionAfiliado.deleteMany({ where: { colegioId } });
  await prisma.alumno.deleteMany({ where: { colegioId } });
  await prisma.materia.deleteMany({ where: { colegioId } });
  await prisma.grado.deleteMany({ where: { colegioId } });
  await prisma.usuario.deleteMany({ where: { colegioId } });
  await prisma.colegio.delete({ where: { id: colegioId } });
}

async function seedColegio(cfg: SeedCfg, passwordHash: string): Promise<void> {
  const colegio = await prisma.colegio.create({
    data: {
      nombre: cfg.nombre, direccion: cfg.direccion, telefono: cfg.telefono,
      emailAdmin: cfg.emailAdmin, plan: cfg.plan, estado: cfg.estado,
      trialEndsAt: cfg.estado === 'TRIAL' ? addDays(10) : null,
      config: { mensualidadDefault: cfg.mensualidad, bimestres: 4, moneda: 'GTQ', cicloEscolar: '2026' },
    },
  });
  const cid = colegio.id;

  const admin = await prisma.usuario.create({ data: { colegioId: cid, email: cfg.emailAdmin, passwordHash, rol: 'ADMIN_COLEGIO', nombre: 'Admin ' + cfg.nombre, telefono: cfg.telefono } });

  const profesores = [];
  const profNombres = ['María', 'Juan', 'Ana', 'Luis', 'Carmen', 'Pedro', 'Silvia', 'Jorge'];
  for (let i = 0; i < cfg.nProfesores; i++) {
    profesores.push(await prisma.usuario.create({ data: { colegioId: cid, email: `profesor${i + 1}@${cfg.emailDomain}`, passwordHash, rol: 'PROFESOR', nombre: `${pick(profNombres, i)} Profesor${i + 1}`, telefono: `+502 5555-${String(1000 + i)}` } }));
  }

  const grados = [];
  for (let i = 0; i < cfg.grados.length; i++) {
    grados.push(await prisma.grado.create({ data: { colegioId: cid, nombre: cfg.grados[i].nombre, nivel: cfg.grados[i].nivel, profesorGuiaId: pick(profesores, i).id } }));
  }

  const materias = [];
  for (let i = 0; i < cfg.materias.length; i++) {
    materias.push(await prisma.materia.create({ data: { colegioId: cid, nombre: cfg.materias[i], profesorId: pick(profesores, i).id } }));
  }

  // Horarios
  const horas = [['07:00', '07:45'], ['07:45', '08:30'], ['08:30', '09:15'], ['09:45', '10:30'], ['10:30', '11:15'], ['11:15', '12:00']];
  const horarioData = [];
  for (let gi = 0; gi < grados.length; gi++) {
    for (let dia = 1; dia <= 5; dia++) {
      for (let p = 0; p < horas.length; p++) {
        horarioData.push({ colegioId: cid, gradoId: grados[gi].id, materiaId: pick(materias, gi + dia * 3 + p).id, diaSemana: dia, horaInicio: horas[p][0], horaFin: horas[p][1], aula: `Aula ${(gi % 6) + 1}` });
      }
    }
  }
  await prisma.horario.createMany({ data: horarioData });

  // Padres
  const padres = [];
  for (let i = 0; i < cfg.nPadres; i++) {
    padres.push(await prisma.usuario.create({ data: { colegioId: cid, email: `padre${i + 1}@${cfg.emailDomain}`, passwordHash, rol: 'PADRE', nombre: `${pick(NOMBRES, i)} ${pick(APELLIDOS, i + 3)}`, telefono: `+502 5550-${String(2000 + i)}` } }));
  }

  // Alumnos
  const alumnos = [];
  for (let i = 0; i < cfg.nAlumnos; i++) {
    const codigo = `${cfg.codigoRef}${String(i + 1).padStart(4, '0')}`;
    alumnos.push(await prisma.alumno.create({
      data: {
        colegioId: cid, codigo, cui: String(24000000000 + i),
        nombre: pick(NOMBRES, i), apellido: pick(APELLIDOS, i + 2),
        gradoId: grados[i % grados.length].id, responsableId: padres[i % padres.length].id,
        fechaNacimiento: at(2010 + (i % 8), 1 + (i % 12), 1 + (i % 27)),
        direccion: `Zona ${1 + (i % 25)}, Ciudad de Guatemala`,
        qrToken: `QR-${codigo}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
      },
    }));
  }

  const alumnoUsers: { u: any; alumno: any }[] = [];
  const nUsers = Math.min(12, alumnos.length);
  for (let i = 0; i < nUsers; i++) {
    const u = await prisma.usuario.create({ data: { colegioId: cid, email: `alumno${i + 1}@${cfg.emailDomain}`, passwordHash, rol: 'ALUMNO', nombre: `${alumnos[i].nombre} ${alumnos[i].apellido}`, alumnoId: alumnos[i].id } });
    alumnoUsers.push({ u, alumno: alumnos[i] });
  }

  // Tareas + entregas
  const tareas = [];
  for (let gi = 0; gi < grados.length; gi++) {
    for (let t = 0; t < 3; t++) {
      const m = pick(materias, gi + t);
      tareas.push(await prisma.tarea.create({
        data: { colegioId: cid, gradoId: grados[gi].id, materia: m.nombre, titulo: `${m.nombre}: actividad ${t + 1} (${grados[gi].nombre})`, descripcion: 'Resuelve los ejercicios y súbelos a la plataforma.', fechaEntrega: addDays((t - 1) * 4 + gi), tipo: t === 2 ? 'proyecto' : 'tarea', archivos: [], creadoPor: m.profesorId ?? profesores[0].id },
      }));
    }
  }
  const estadosEntrega = ['CALIFICADO', 'ENTREGADO', 'PENDIENTE', 'TARDE'];
  const entregasData = [];
  for (let ti = 0; ti < tareas.length; ti++) {
    const t = tareas[ti];
    const acts = alumnos.filter((a) => a.gradoId === t.gradoId);
    for (let k = 0; k < acts.length; k++) {
      const est = pick(estadosEntrega, k + ti);
      entregasData.push({ colegioId: cid, tareaId: t.id, alumnoId: acts[k].id, estado: est, archivos: [], nota: est === 'CALIFICADO' ? 60 + ((k * 7 + ti) % 40) : null, comentario: est === 'TARDE' ? 'Entregado fuera de fecha.' : null, fechaEntrega: est === 'PENDIENTE' ? null : addDays(-1), calificadoAt: est === 'CALIFICADO' ? addDays(-1) : null });
    }
  }
  await prisma.entregaTarea.createMany({ data: entregasData });

  // Asistencias
  const tiposAsist = ['PRESENTE', 'PRESENTE', 'PRESENTE', 'PRESENTE', 'PRESENTE', 'AUSENTE', 'TARDE', 'EXCUSA'];
  const asistData = [];
  let dias = 0;
  for (let back = 1; dias < cfg.diasAsistencia && back < cfg.diasAsistencia * 3 + 10; back++) {
    const d = addDays(-back);
    if (d.getDay() === 0 || d.getDay() === 6) continue;
    dias++;
    const fecha = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    for (let i = 0; i < alumnos.length; i++) {
      const est = pick(tiposAsist, i + back);
      asistData.push({ colegioId: cid, alumnoId: alumnos[i].id, materiaId: null, fecha, estado: est, justificacion: est === 'EXCUSA' ? 'Cita médica' : null, registradoPor: pick(profesores, i).id });
    }
  }
  await prisma.asistencia.createMany({ data: asistData });

  // Calificaciones (todas las materias x 4 bimestres)
  const calData = [];
  for (let i = 0; i < alumnos.length; i++) {
    for (const m of materias) {
      for (let b = 1; b <= 4; b++) {
        calData.push({ colegioId: cid, alumnoId: alumnos[i].id, materiaId: m.id, bimestre: b, nota: 60 + ((i * 3 + b * 7 + m.nombre.length) % 40), tipo: b === 4 ? 'final' : 'parcial', registradoPor: m.profesorId ?? profesores[0].id });
      }
    }
  }
  await prisma.calificacion.createMany({ data: calData });

  // Mensualidades (varios meses, distintos estados para reportes)
  const meses = mesesUltimos(cfg.mesesMensualidad);
  const mensData = [];
  for (let i = 0; i < alumnos.length; i++) {
    for (let j = 0; j < meses.length; j++) {
      const esActual = j === meses.length - 1;
      const esReciente = j === meses.length - 2;
      let estado: string;
      if (esActual) estado = pick(['PENDIENTE', 'PAGADO', 'PAGADO', 'VERIFICANDO', 'VENCIDO'], i + j);
      else if (esReciente) estado = pick(['PAGADO', 'PAGADO', 'VERIFICANDO'], i + j);
      else estado = pick(['PAGADO', 'PAGADO', 'PAGADO', 'PAGADO', 'VENCIDO'], i + j);
      const pagado = estado === 'PAGADO';
      mensData.push({ colegioId: cid, alumnoId: alumnos[i].id, mes: meses[j], monto: cfg.mensualidad, estado, fechaPago: pagado ? at(parseInt(meses[j].slice(0, 4), 10), parseInt(meses[j].slice(5), 10), 5 + (i % 20)) : null, liquidado: pagado && j < meses.length - 2, comisionPlataforma: pagado ? Math.round(cfg.mensualidad * 0.03 * 100) / 100 : null, recurrenteCheckoutId: pagado ? `ch_${cfg.codigoRef}_${i}_${j}` : null });
    }
  }
  await prisma.mensualidad.createMany({ data: mensData });

  await prisma.pagoCheckout.createMany({ data: [
    { colegioId: cid, checkoutId: `ch_${cfg.codigoRef}_001`, metadata: { plan: cfg.plan, periodo: meses[meses.length - 1] }, monto: cfg.mensualidad, estado: 'pagado', recurrenteData: { metodo: 'bank_transfer' } },
    { colegioId: cid, checkoutId: `ch_${cfg.codigoRef}_002`, metadata: { plan: cfg.plan }, monto: cfg.mensualidad, estado: 'pendiente', recurrenteData: {} },
    { colegioId: cid, checkoutId: `ch_${cfg.codigoRef}_003`, metadata: { alumno: alumnos[0]?.codigo }, monto: cfg.mensualidad, estado: 'pagado', recurrenteData: { metodo: 'card' } },
  ] });

  // Anuncios
  const anunciosDef = [
    ['Reunión de padres de familia', 'Se les invita a la reunión general el viernes a las 18:00.', 'GENERAL'],
    ['Suspensión de clases', 'Por mantenimiento, se suspenden las clases el lunes.', 'URGENTE'],
    ['Entrega de boletas', 'La entrega de boletas del bimestre será el próximo lunes.', 'GENERAL'],
    ['Feria científica', 'Los alumnos presentarán sus proyectos en la feria científica.', 'GRADO'],
    ['Jornada de vacunación', 'El ministerio de salud realizará jornada de vacunación.', 'GENERAL'],
    ['Día del deporte', 'Actividades deportivas durante toda la mañana.', 'GENERAL'],
  ];
  for (let i = 0; i < anunciosDef.length; i++) {
    await prisma.anuncio.create({ data: { colegioId: cid, titulo: anunciosDef[i][0], contenido: anunciosDef[i][1], tipo: anunciosDef[i][2], gradoId: anunciosDef[i][2] === 'GRADO' ? grados[grados.length - 1].id : null, enviarWhatsapp: i % 2 === 0, enviarEmail: i % 3 === 0, archivos: [], creadoPor: admin.id } });
  }

  // Mensajes
  const mensajesData = [];
  for (let i = 0; i < Math.min(6, padres.length); i++) {
    mensajesData.push({ colegioId: cid, remitenteId: padres[i].id, destinatarioId: pick(profesores, i).id, contenido: 'Buenos días, ¿cómo va mi hijo en clases?', leido: i % 2 === 0 });
    mensajesData.push({ colegioId: cid, remitenteId: pick(profesores, i).id, destinatarioId: padres[i].id, contenido: 'Muy bien, ha mejorado este bimestre.', leido: i % 2 === 0 });
  }
  await prisma.mensaje.createMany({ data: mensajesData });

  // Documentos
  for (let i = 0; i < 4; i++) {
    await prisma.documento.create({ data: { colegioId: cid, tipo: pick(['BOLETA', 'REPORTE', 'CIRCULAR', 'CONTABILIDAD'], i), titulo: `Documento ${i + 1} - ${cfg.nombre}`, url: `https://cdn.totalappgt.com/demo/doc-${cfg.codigoRef}-${i}.pdf`, tamanoBytes: 200000 + i * 1000, creadoPor: admin.id } });
  }

  // Notificaciones
  await prisma.notificacionProgramada.createMany({ data: [
    { colegioId: cid, titulo: 'Recordatorio de pago', mensaje: 'Recuerda pagar la mensualidad del mes.', canal: 'WHATSAPP', frecuencia: 'MENSUAL', hora: '08:00', diaMes: 5, roles: ['PADRE'], telefonos: [], activa: true, proximoEnvioAt: addDays(2), creadoPor: admin.id },
    { colegioId: cid, titulo: 'Reunión semanal', mensaje: 'Reunión de profesores todos los lunes.', canal: 'WHATSAPP', frecuencia: 'SEMANAL', hora: '07:00', diaSemana: 1, roles: ['PROFESOR'], telefonos: [], activa: true, proximoEnvioAt: addDays(3), creadoPor: admin.id },
    { colegioId: cid, titulo: 'Buenos días', mensaje: 'Que tengas un excelente día.', canal: 'WHATSAPP', frecuencia: 'DIARIA', hora: '06:30', roles: ['ADMIN_COLEGIO'], telefonos: [], activa: false, creadoPor: admin.id },
  ] });

  // Cursos + materiales + muro + sesiones + evaluaciones
  const cursos = [];
  for (let gi = 0; gi < grados.length; gi++) {
    for (let mi = 0; mi < Math.min(cfg.nCursosMaterias, materias.length); mi++) {
      const m = materias[mi];
      cursos.push(await prisma.curso.create({ data: { colegioId: cid, gradoId: grados[gi].id, materiaId: m.id, profesorId: m.profesorId, nombre: `${m.nombre} - ${grados[gi].nombre}`, descripcion: `Curso de ${m.nombre} para ${grados[gi].nombre}`, color: pick(['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#3b82f6', '#8b5cf6'], gi + mi), activo: true } }));
    }
  }
  const matData = [];
  for (const c of cursos) {
    matData.push({ colegioId: cid, cursoId: c.id, titulo: `Guía de ${c.nombre}`, descripcion: 'Material de apoyo.', tipo: 'ARCHIVO', key: null, url: 'https://cdn.totalappgt.com/demo/guia.pdf', creadoPor: c.profesorId });
    matData.push({ colegioId: cid, cursoId: c.id, titulo: 'Video explicativo', descripcion: 'Clase grabada.', tipo: 'VIDEO', key: null, url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', creadoPor: c.profesorId });
  }
  await prisma.material.createMany({ data: matData });

  for (let ci = 0; ci < cursos.length; ci++) {
    const c = cursos[ci];
    const post = await prisma.muroPost.create({ data: { colegioId: cid, cursoId: c.id, autorId: c.profesorId, contenido: `¡Bienvenidos al curso ${c.nombre}! Aquí publicaremos avisos.`, archivos: [] } });
    await prisma.muroComentario.createMany({ data: [
      { postId: post.id, autorId: admin.id, contenido: 'Excelente, cualquier duda la vemos en clase.' },
      { postId: post.id, autorId: pick(padres, ci).id, contenido: '¿Habrá refuerzo?' },
    ] });
  }

  for (let i = 0; i < Math.min(5, cursos.length); i++) {
    await prisma.sesionEnVivo.create({ data: { colegioId: cid, cursoId: cursos[i].id, titulo: `Clase en vivo: ${cursos[i].nombre}`, descripcion: 'Sesión de repaso.', fecha: addDays(i + 1), duracionMin: 60, proveedor: 'JITSI', url: `https://meet.jit.si/aulapro-${cfg.codigoRef}-${i}`, creadoPor: cursos[i].profesorId } });
  }

  for (const c of cursos) {
    const ev = await prisma.evaluacion.create({ data: { colegioId: cid, cursoId: c.id, titulo: `Quiz - ${c.nombre}`, descripcion: 'Evaluación del periodo.', tipo: 'QUIZ', puntajeTotal: 100, intentosMax: 2, publicado: true, creadoPor: c.profesorId } });
    await prisma.pregunta.createMany({ data: [
      { evaluacionId: ev.id, orden: 1, enunciado: '¿Cuánto es 7 x 8?', tipo: 'OPCION_MULTIPLE', opciones: ['54', '56', '48', '64'], respuestaCorrecta: '56', puntaje: 25 },
      { evaluacionId: ev.id, orden: 2, enunciado: 'La Tierra es plana.', tipo: 'VERDADERO_FALSO', opciones: ['Verdadero', 'Falso'], respuestaCorrecta: 'Falso', puntaje: 25 },
      { evaluacionId: ev.id, orden: 3, enunciado: 'Proceso de las plantas para producir alimento:', tipo: 'RESPUESTA_CORTA', opciones: [], respuestaCorrecta: 'Fotosíntesis', puntaje: 25 },
      { evaluacionId: ev.id, orden: 4, enunciado: '¿Capital de Guatemala?', tipo: 'OPCION_MULTIPLE', opciones: ['Xela', 'Guatemala', 'Antigua'], respuestaCorrecta: 'Guatemala', puntaje: 25 },
    ] });
    for (const au of alumnoUsers) {
      if (au.alumno.gradoId !== c.gradoId) continue;
      await prisma.intentoEvaluacion.create({ data: { colegioId: cid, evaluacionId: ev.id, usuarioId: au.u.id, respuestas: { '1': '56', '2': 'Falso', '3': 'Fotosíntesis', '4': 'Guatemala' }, nota: 70 + rand(parseInt(au.alumno.codigo.slice(-2), 10) || 1, 30), estado: 'CALIFICADO', finalizadoAt: addDays(-2) } });
    }
  }

  console.log(`  ✓ ${cfg.nombre}: ${grados.length} grados, ${alumnos.length} alumnos, ${cursos.length} cursos, ${tareas.length} tareas, ${mensData.length} mensualidades`);
}

const MAIN: SeedCfg = {
  nombre: 'Colegio Demo Las Rosas', emailAdmin: 'totalappgt@gmail.com', emailDomain: 'demo.edu.gt', codigoRef: 'A',
  plan: 'PRO', estado: 'ACTIVE', telefono: '+502 5555-0001', direccion: '15 Av. 20-45, Zona 10, Ciudad de Guatemala',
  mensualidad: 350,
  grados: [
    { nombre: '1ro Primaria A', nivel: 'Primaria' }, { nombre: '1ro Primaria B', nivel: 'Primaria' },
    { nombre: '2do Primaria A', nivel: 'Primaria' }, { nombre: '2do Primaria B', nivel: 'Primaria' },
    { nombre: '3ro Primaria A', nivel: 'Primaria' }, { nombre: '3ro Primaria B', nivel: 'Primaria' },
    { nombre: '4to Primaria A', nivel: 'Primaria' }, { nombre: '5to Primaria A', nivel: 'Primaria' },
    { nombre: '6to Primaria A', nivel: 'Primaria' },
  ],
  materias: ['Matemáticas', 'Lenguaje', 'Ciencias Naturales', 'Ciencias Sociales', 'Inglés', 'Tecnología', 'Educación Física', 'Artes Plásticas', 'Formación Ciudadana', 'Música'],
  nProfesores: 6, nPadres: 24, nAlumnos: 90, diasAsistencia: 20, nCursosMaterias: 5, mesesMensualidad: 10,
};

const SECUNDARIO: SeedCfg = {
  nombre: 'Instituto Demo El Roble', emailAdmin: 'admin@roble.edu.gt', emailDomain: 'roble.edu.gt', codigoRef: 'R',
  plan: 'STARTER', estado: 'TRIAL', telefono: '+502 5555-9000', direccion: 'Km 12 Carretera a El Salvador',
  mensualidad: 425,
  grados: [
    { nombre: '4to Bachillerato A', nivel: 'Diversificado' }, { nombre: '4to Bachillerato B', nivel: 'Diversificado' },
    { nombre: '5to Bachillerato A', nivel: 'Diversificado' }, { nombre: '6to Bachillerato A', nivel: 'Diversificado' },
  ],
  materias: ['Matemáticas', 'Física', 'Química', 'Biología', 'Literatura', 'Historia', 'Inglés', 'Estadística'],
  nProfesores: 5, nPadres: 14, nAlumnos: 48, diasAsistencia: 16, nCursosMaterias: 4, mesesMensualidad: 8,
};

async function main() {
  console.log('=== AulaPro · seed de auditoria ===');

  for (const email of [MAIN.emailAdmin, SECUNDARIO.emailAdmin]) {
    const existente = await prisma.colegio.findFirst({ where: { emailAdmin: email } });
    if (existente) {
      console.log(`Reseteando datos de ${email}...`);
      await resetColegio(existente.id);
    }
  }

  const passwordHash = await bcrypt.hash(PASS, 10);
  await seedColegio(MAIN, passwordHash);
  await seedColegio(SECUNDARIO, passwordHash);

  // Programa de afiliados (demo)
  const afiliado = await prisma.afiliado.upsert({
    where: { email: 'afiliado@totalappgt.com' },
    update: { nombre: 'Afiliado Demo', codigo: 'TOTALAPP', activo: true },
    create: { nombre: 'Afiliado Demo', email: 'afiliado@totalappgt.com', passwordHash, codigo: 'TOTALAPP', comisionPct: 25 },
  });

  const nowD = new Date();
  const periodo = `${nowD.getFullYear()}-${String(nowD.getMonth() + 1).padStart(2, '0')}`;
  for (const email of [MAIN.emailAdmin, SECUNDARIO.emailAdmin]) {
    const col = await prisma.colegio.findFirst({ where: { emailAdmin: email } });
    if (!col) continue;
    await prisma.colegio.update({ where: { id: col.id }, data: { afiliadoId: afiliado.id } });
    const monto = Math.round(planDe(col.plan).precio * (afiliado.comisionPct / 100) * 100) / 100;
    await prisma.comisionAfiliado.create({
      data: { afiliadoId: afiliado.id, colegioId: col.id, periodo, monto },
    });
  }

  console.log('=== Seed completado ===');
  const counts: Record<string, number> = {
    Colegios: await prisma.colegio.count(),
    Usuarios: await prisma.usuario.count(),
    Alumnos: await prisma.alumno.count(),
    Grados: await prisma.grado.count(),
    Materias: await prisma.materia.count(),
    Horarios: await prisma.horario.count(),
    Tareas: await prisma.tarea.count(),
    Entregas: await prisma.entregaTarea.count(),
    Asistencias: await prisma.asistencia.count(),
    Calificaciones: await prisma.calificacion.count(),
    Mensualidades: await prisma.mensualidad.count(),
    Cursos: await prisma.curso.count(),
    Materiales: await prisma.material.count(),
    Evaluaciones: await prisma.evaluacion.count(),
    Intentos: await prisma.intentoEvaluacion.count(),
  };
  for (const [k, v] of Object.entries(counts)) console.log(`  ${k}: ${v}`);
  console.log('\nCredenciales (password: ' + PASS + '):');
  console.log('  Admin principal:  totalappgt@gmail.com');
  console.log('  Admin secundario: admin@roble.edu.gt');
  console.log('  Profesor:         profesor1@demo.edu.gt');
  console.log('  Padre:            padre1@demo.edu.gt');
  console.log('  Alumno:           alumno1@demo.edu.gt');
  console.log('  Afiliado demo:    afiliado@totalappgt.com / admintotal  (codigo: TOTALAPP)');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
