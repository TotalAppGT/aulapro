import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const PASS = 'admintotal';
const now = new Date();
const DAY = 86400000;
const addDays = (n: number) => new Date(now.getTime() + n * DAY);
const at = (y: number, m: number, d: number) => new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
const pick = <T>(a: T[], i: number): T => a[((i % a.length) + a.length) % a.length];

const DEMO_PRINCIPAL = 'totalappgt@gmail.com';
const DEMO_SECUNDARIO = 'admin@roble.edu.gt';

// Borra SOLO los datos de un colegio (sin TRUNCATE; no toca otros colegios).
// El borrado de Curso arrastra (cascade) Material, MuroPost(+comentarios),
// SesionEnVivo y Evaluacion(+Pregunta+IntentoEvaluacion).
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
  await prisma.alumno.deleteMany({ where: { colegioId } });
  await prisma.materia.deleteMany({ where: { colegioId } });
  await prisma.grado.deleteMany({ where: { colegioId } });
  await prisma.usuario.deleteMany({ where: { colegioId } });
  await prisma.colegio.delete({ where: { id: colegioId } });
}

async function main() {
  console.log('=== AulaPro · seed de auditoria ===');

  for (const email of [DEMO_PRINCIPAL, DEMO_SECUNDARIO]) {
    const existente = await prisma.colegio.findFirst({ where: { emailAdmin: email } });
    if (existente) {
      console.log(`Reseteando datos de ${email}...`);
      await resetColegio(existente.id);
    }
  }

  const passwordHash = await bcrypt.hash(PASS, 10);

  // ============================================================
  // COLEGIO PRINCIPAL
  // ============================================================
  const colegio = await prisma.colegio.create({
    data: {
      nombre: 'Colegio Demo Las Rosas',
      direccion: '15 Av. 20-45, Zona 10, Ciudad de Guatemala',
      telefono: '+502 5555-0001',
      emailAdmin: 'totalappgt@gmail.com',
      plan: 'PRO',
      estado: 'ACTIVE',
      recurrenteAccountId: 'ac_demo_aulapro',
      config: { mensualidadDefault: 350, bimestres: 4, moneda: 'GTQ', cicloEscolar: '2026' },
    },
  });
  const cid = colegio.id;

  const admin = await prisma.usuario.create({
    data: { colegioId: cid, email: 'totalappgt@gmail.com', passwordHash, rol: 'ADMIN_COLEGIO', nombre: 'Carlos Admin', telefono: '+502 5555-0001' },
  });

  const profNombres = ['María Profesora', 'Juan Profesor', 'Ana Profesora', 'Luis Profesor'];
  const profesores = [];
  for (let i = 0; i < profNombres.length; i++) {
    profesores.push(await prisma.usuario.create({
      data: { colegioId: cid, email: `profesor${i + 1}@demo.edu.gt`, passwordHash, rol: 'PROFESOR', nombre: profNombres[i], telefono: `+502 5555-000${i + 2}` },
    }));
  }

  const gradosDef = [
    { nombre: '1ro Primaria A', nivel: 'Primaria' },
    { nombre: '1ro Primaria B', nivel: 'Primaria' },
    { nombre: '2do Primaria A', nivel: 'Primaria' },
    { nombre: '2do Primaria B', nivel: 'Primaria' },
    { nombre: '3ro Primaria A', nivel: 'Primaria' },
    { nombre: '3ro Primaria B', nivel: 'Primaria' },
  ];
  const grados = [];
  for (let i = 0; i < gradosDef.length; i++) {
    grados.push(await prisma.grado.create({
      data: { colegioId: cid, nombre: gradosDef[i].nombre, nivel: gradosDef[i].nivel, profesorGuiaId: pick(profesores, i).id },
    }));
  }

  const materiasDef = ['Matemáticas', 'Lenguaje', 'Ciencias Naturales', 'Ciencias Sociales', 'Inglés', 'Tecnología', 'Educación Física', 'Artes Plásticas'];
  const materias = [];
  for (let i = 0; i < materiasDef.length; i++) {
    materias.push(await prisma.materia.create({
      data: { colegioId: cid, nombre: materiasDef[i], profesorId: pick(profesores, i).id },
    }));
  }

  // Horarios: 6 grados x 5 días x 6 periodos
  const horas = [['07:00', '07:45'], ['07:45', '08:30'], ['08:30', '09:15'], ['09:45', '10:30'], ['10:30', '11:15'], ['11:15', '12:00']];
  const horarioData = [];
  for (let gi = 0; gi < grados.length; gi++) {
    for (let dia = 1; dia <= 5; dia++) {
      for (let p = 0; p < horas.length; p++) {
        horarioData.push({ colegioId: cid, gradoId: grados[gi].id, materiaId: pick(materias, gi + dia * 3 + p).id, diaSemana: dia, horaInicio: horas[p][0], horaFin: horas[p][1], aula: `Aula ${grados[gi].nombre.slice(0, 1)}${(gi % 3) + 1}` });
      }
    }
  }
  await prisma.horario.createMany({ data: horarioData });

  const padresDef = [
    ['Ana López', '+502 5550-1001'], ['Roberto García', '+502 5550-1002'], ['María Pérez', '+502 5550-1003'],
    ['José Hernández', '+502 5550-1004'], ['Carmen Morales', '+502 5550-1005'], ['Pedro Castillo', '+502 5550-1006'],
    ['Rosa Ramírez', '+502 5550-1007'], ['Miguel Torres', '+502 5550-1008'], ['Silvia Flores', '+502 5550-1009'],
    ['Diego Reyes', '+502 5550-1010'],
  ];
  const padres = [];
  for (let i = 0; i < padresDef.length; i++) {
    padres.push(await prisma.usuario.create({
      data: { colegioId: cid, email: `padre${i + 1}@demo.edu.gt`, passwordHash, rol: 'PADRE', nombre: padresDef[i][0], telefono: padresDef[i][1] },
    }));
  }

  const alumnoNombres = [
    ['Pedro', 'López'], ['Sofía', 'López'], ['Diego', 'Martínez'], ['Valeria', 'García'], ['Mateo', 'Pérez'],
    ['Camila', 'Hernández'], ['Sebastián', 'Morales'], ['Isabella', 'Castillo'], ['Nicolás', 'Ramírez'], ['Daniela', 'Torres'],
    ['Andrés', 'Flores'], ['Gabriela', 'Reyes'], ['Emilio', 'López'], ['Renata', 'García'], ['Santiago', 'Pérez'],
    ['Ximena', 'Hernández'], ['Alejandro', 'Morales'], ['Fernanda', 'Castillo'], ['Ricardo', 'Ramírez'], ['Paula', 'Torres'],
    ['Javier', 'Flores'], ['Andrea', 'Reyes'], ['Diego', 'López'], ['Natalia', 'García'], ['Rodrigo', 'Pérez'],
    ['Emma', 'Hernández'], ['Tomás', 'Morales'], ['Lucía', 'Castillo'], ['Bruno', 'Ramírez'], ['María', 'Torres'],
  ];
  const alumnos = [];
  const alumnoData = [];
  for (let i = 0; i < alumnoNombres.length; i++) {
    const codigo = '2026' + String(i + 1).padStart(3, '0');
    alumnoData.push({
      colegioId: cid, codigo, cui: String(24000000000 + i),
      nombre: alumnoNombres[i][0], apellido: alumnoNombres[i][1],
      gradoId: grados[i % grados.length].id, responsableId: padres[i % padres.length].id,
      fechaNacimiento: at(2015 + (i % 6), 1 + (i % 12), 1 + (i % 27)),
      direccion: `Zona ${1 + (i % 25)}, Ciudad de Guatemala`,
      qrToken: `AL-${codigo}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
    });
  }
  for (const d of alumnoData) alumnos.push(await prisma.alumno.create({ data: d }));

  const alumnoUsers: { u: any; alumno: any }[] = [];
  for (let i = 0; i < 8; i++) {
    const u = await prisma.usuario.create({
      data: { colegioId: cid, email: `alumno${i + 1}@demo.edu.gt`, passwordHash, rol: 'ALUMNO', nombre: `${alumnos[i].nombre} ${alumnos[i].apellido}` },
    });
    alumnoUsers.push({ u, alumno: alumnos[i] });
  }

  // Tareas + entregas
  const tareas = [];
  for (let gi = 0; gi < grados.length; gi++) {
    const g = grados[gi];
    for (let t = 0; t < 3; t++) {
      const m = pick(materias, gi + t);
      tareas.push(await prisma.tarea.create({
        data: {
          colegioId: cid, gradoId: g.id, materia: m.nombre,
          titulo: `${m.nombre}: actividad ${t + 1} (${g.nombre})`,
          descripcion: 'Resuelve los ejercicios indicados y súbelos a la plataforma.',
          fechaEntrega: addDays((t - 1) * 4 + gi), tipo: t === 2 ? 'proyecto' : 'tarea', archivos: [],
          creadoPor: m.profesorId ?? profesores[0].id,
        },
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
      entregasData.push({
        colegioId: cid, tareaId: t.id, alumnoId: acts[k].id, estado: est, archivos: [],
        nota: est === 'CALIFICADO' ? 60 + ((k * 7 + ti) % 40) : null,
        comentario: est === 'TARDE' ? 'Entregado fuera de fecha.' : null,
        fechaEntrega: est === 'PENDIENTE' ? null : addDays(-1),
        calificadoAt: est === 'CALIFICADO' ? addDays(-1) : null,
      });
    }
  }
  await prisma.entregaTarea.createMany({ data: entregasData });

  // Asistencias (últimos 12 días hábiles)
  const tiposAsist = ['PRESENTE', 'PRESENTE', 'PRESENTE', 'PRESENTE', 'AUSENTE', 'TARDE', 'EXCUSA'];
  const asistData = [];
  let diasHabiles = 0;
  for (let back = 1; diasHabiles < 12 && back < 40; back++) {
    const d = addDays(-back);
    const dow = d.getDay();
    if (dow === 0 || dow === 6) continue;
    diasHabiles++;
    const fecha = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    for (let i = 0; i < alumnos.length; i++) {
      const est = pick(tiposAsist, i + back);
      asistData.push({ colegioId: cid, alumnoId: alumnos[i].id, materiaId: null, fecha, estado: est, justificacion: est === 'EXCUSA' ? 'Cita médica' : null, registradoPor: pick(profesores, i).id });
    }
  }
  await prisma.asistencia.createMany({ data: asistData });

  // Calificaciones (6 materias x 4 bimestres)
  const calData = [];
  for (let i = 0; i < alumnos.length; i++) {
    for (const m of materias.slice(0, 6)) {
      for (let b = 1; b <= 4; b++) {
        calData.push({ colegioId: cid, alumnoId: alumnos[i].id, materiaId: m.id, bimestre: b, nota: 60 + ((i * 3 + b * 7 + m.nombre.length) % 40), tipo: b === 4 ? 'final' : 'parcial', registradoPor: m.profesorId ?? profesores[0].id });
      }
    }
  }
  await prisma.calificacion.createMany({ data: calData });

  // Mensualidades
  const meses = ['2026-05', '2026-06', '2026-07', '2026-08', '2026-09', '2026-10'];
  const mensData = [];
  for (let i = 0; i < alumnos.length; i++) {
    for (let j = 0; j < meses.length; j++) {
      const pagado = j < 4;
      mensData.push({ colegioId: cid, alumnoId: alumnos[i].id, mes: meses[j], monto: 350, estado: pagado ? 'PAGADO' : j === 4 ? 'VERIFICANDO' : 'PENDIENTE', fechaPago: pagado ? at(2026, 5 + j, 5) : null, liquidado: j < 3, comisionPlataforma: pagado ? 10.5 : null, recurrenteCheckoutId: pagado ? `ch_demo_${i}_${j}` : null });
    }
  }
  await prisma.mensualidad.createMany({ data: mensData });

  await prisma.pagoCheckout.createMany({
    data: [
      { colegioId: cid, checkoutId: 'ch_demo_001', metadata: { plan: 'PRO', periodo: '2026-10' }, monto: 349, estado: 'pagado', recurrenteData: { metodo: 'bank_transfer' } },
      { colegioId: cid, checkoutId: 'ch_demo_002', metadata: { plan: 'PRO', periodo: '2026-11' }, monto: 349, estado: 'pendiente', recurrenteData: {} },
      { colegioId: cid, checkoutId: 'ch_demo_003', metadata: { alumno: alumnos[0].codigo, mes: '2026-10' }, monto: 350, estado: 'pagado', recurrenteData: { metodo: 'card' } },
    ],
  });

  // Anuncios
  const anunciosDef = [
    ['Reunión de padres de familia', 'Se les invita a la reunión general el viernes 15 a las 18:00 en el salón de usos múltiples.', 'GENERAL'],
    ['Suspensión de clases', 'Por mantenimiento del plantel, se suspenden las clases el lunes.', 'URGENTE'],
    ['Entrega de boletas', 'La entrega de boletas del tercer bimestre será el próximo lunes.', 'GENERAL'],
    ['Feria científica', 'Los alumnos de 3ro presentarán sus proyectos en la feria científica.', 'GRADO'],
    ['Jornada de vacunación', 'El ministerio de salud realizará jornada de vacunación en el colegio.', 'GENERAL'],
  ];
  for (let i = 0; i < anunciosDef.length; i++) {
    await prisma.anuncio.create({
      data: { colegioId: cid, titulo: anunciosDef[i][0], contenido: anunciosDef[i][1], tipo: anunciosDef[i][2], gradoId: anunciosDef[i][2] === 'GRADO' ? grados[4].id : null, enviarWhatsapp: i % 2 === 0, enviarEmail: i % 3 === 0, archivos: [], creadoPor: admin.id },
    });
  }

  // Mensajes
  const conversaciones: [any, any, string][] = [
    [padres[0], profesores[0], 'Buenos días, ¿cómo va Pedro en matemáticas?'],
    [profesores[0], padres[0], 'Muy bien, ha mejorado bastante este bimestre.'],
    [padres[1], profesores[1], '¿Habrá refuerzo los sábados?'],
    [profesores[1], padres[1], 'Sí, iniciamos el próximo sábado a las 9:00.'],
    [admin, profesores[2], 'Necesito el reporte de asistencia del mes.'],
    [profesores[2], admin, 'Lo envío hoy por la tarde.'],
  ];
  for (const [rem, dest, contenido] of conversaciones) {
    await prisma.mensaje.create({ data: { colegioId: cid, remitenteId: rem.id, destinatarioId: dest.id, contenido, leido: false } });
  }

  // Documentos
  const docsDef = [['BOLETA', 'Boleta 3er bimestre - Pedro López'], ['REPORTE', 'Reporte de asistencia - Junio'], ['CIRCULAR', 'Circular de inicio de ciclo escolar'], ['CONTABILIDAD', 'Estado de cuenta plataforma - Septiembre']];
  for (const [tipo, titulo] of docsDef) {
    await prisma.documento.create({ data: { colegioId: cid, tipo, titulo, url: 'https://cdn.totalappgt.com/demo/documento.pdf', tamanoBytes: 245760, creadoPor: admin.id } });
  }

  // Notificaciones programadas
  await prisma.notificacionProgramada.createMany({
    data: [
      { colegioId: cid, titulo: 'Recordatorio de pago', mensaje: 'Recuerda pagar la mensualidad del mes.', canal: 'WHATSAPP', frecuencia: 'MENSUAL', hora: '08:00', diaMes: 5, roles: ['PADRE'], telefonos: [], activa: true, proximoEnvioAt: addDays(2), creadoPor: admin.id },
      { colegioId: cid, titulo: 'Reunión semanal', mensaje: 'Reunión de profesores todos los lunes.', canal: 'WHATSAPP', frecuencia: 'SEMANAL', hora: '07:00', diaSemana: 1, roles: ['PROFESOR'], telefonos: [], activa: true, proximoEnvioAt: addDays(3), creadoPor: admin.id },
      { colegioId: cid, titulo: 'Buenos días', mensaje: 'Que tengas un excelente día.', canal: 'WHATSAPP', frecuencia: 'DIARIA', hora: '06:30', roles: ['ADMIN_COLEGIO'], telefonos: ['+502 5550-1099'], activa: false, creadoPor: admin.id },
    ],
  });

  // Cursos (cada grado x 4 materias)
  const cursos = [];
  for (let gi = 0; gi < grados.length; gi++) {
    for (let mi = 0; mi < 4; mi++) {
      const m = materias[mi];
      cursos.push(await prisma.curso.create({
        data: { colegioId: cid, gradoId: grados[gi].id, materiaId: m.id, profesorId: m.profesorId, nombre: `${m.nombre} - ${grados[gi].nombre}`, descripcion: `Curso de ${m.nombre} para ${grados[gi].nombre}`, color: pick(['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#3b82f6', '#8b5cf6'], gi + mi), activo: true },
      }));
    }
  }

  // Materiales
  const matData = [];
  for (const c of cursos) {
    matData.push({ colegioId: cid, cursoId: c.id, titulo: `Guía de ${c.nombre}`, descripcion: 'Material de apoyo para el bimestre.', tipo: 'ARCHIVO', key: null, url: 'https://cdn.totalappgt.com/demo/guia.pdf', creadoPor: c.profesorId });
    matData.push({ colegioId: cid, cursoId: c.id, titulo: 'Video explicativo', descripcion: 'Clase grabada de repaso.', tipo: 'VIDEO', key: null, url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', creadoPor: c.profesorId });
    matData.push({ colegioId: cid, cursoId: c.id, titulo: 'Presentación del tema', descripcion: 'Diapositivas de la unidad.', tipo: 'ENLACE', key: null, url: 'https://cdn.totalappgt.com/demo/presentacion.pdf', creadoPor: c.profesorId });
  }
  await prisma.material.createMany({ data: matData });

  // Muro de clase + comentarios
  for (let ci = 0; ci < cursos.length; ci++) {
    const c = cursos[ci];
    const post = await prisma.muroPost.create({
      data: { colegioId: cid, cursoId: c.id, autorId: c.profesorId, contenido: `¡Bienvenidos al curso ${c.nombre}! Aquí publicaremos avisos y resolveremos dudas.`, archivos: [] },
    });
    await prisma.muroComentario.createMany({
      data: [
        { postId: post.id, autorId: admin.id, contenido: 'Excelente, cualquier duda la vemos en clase.' },
        { postId: post.id, autorId: pick(padres, ci).id, contenido: '¿Habrá refuerzo los sábados?' },
        { postId: post.id, autorId: pick(alumnoUsers.map((x) => x.u), ci).id, contenido: 'Profesor, ¿la tarea es individual?' },
      ],
    });
  }

  // Sesiones en vivo
  await prisma.sesionEnVivo.createMany({
    data: [
      { colegioId: cid, cursoId: cursos[0].id, titulo: 'Clase en vivo: repaso de fracciones', descripcion: 'Repaso general para el examen.', fecha: addDays(1), duracionMin: 60, proveedor: 'JITSI', url: 'https://meet.jit.si/aulapro-repaso-fracciones', creadoPor: cursos[0].profesorId },
      { colegioId: cid, cursoId: cursos[5].id, titulo: 'Clase en vivo: comprensión lectora', descripcion: 'Lectura guiada.', fecha: addDays(2), duracionMin: 45, proveedor: 'JITSI', url: 'https://meet.jit.si/aulapro-comprension', creadoPor: cursos[5].profesorId },
      { colegioId: cid, cursoId: cursos[12].id, titulo: 'Clase en vivo: el sistema solar', descripcion: 'Introducción a la astronomía.', fecha: addDays(3), duracionMin: 60, proveedor: 'JITSI', url: 'https://meet.jit.si/aulapro-solar', creadoPor: cursos[12].profesorId },
    ],
  });

  // Evaluaciones + preguntas + intentos
  for (const c of cursos) {
    const ev = await prisma.evaluacion.create({
      data: { colegioId: cid, cursoId: c.id, titulo: `Quiz 1 - ${c.nombre}`, descripcion: 'Evaluación diagnóstica del primer periodo.', tipo: 'QUIZ', puntajeTotal: 100, intentosMax: 2, publicado: true, creadoPor: c.profesorId },
    });
    await prisma.pregunta.createMany({
      data: [
        { evaluacionId: ev.id, orden: 1, enunciado: '¿Cuánto es 7 x 8?', tipo: 'OPCION_MULTIPLE', opciones: ['54', '56', '48', '64'], respuestaCorrecta: '56', puntaje: 25 },
        { evaluacionId: ev.id, orden: 2, enunciado: 'La Tierra es plana.', tipo: 'VERDADERO_FALSO', opciones: ['Verdadero', 'Falso'], respuestaCorrecta: 'Falso', puntaje: 25 },
        { evaluacionId: ev.id, orden: 3, enunciado: 'Proceso por el cual las plantas producen su alimento:', tipo: 'RESPUESTA_CORTA', opciones: [], respuestaCorrecta: 'Fotosíntesis', puntaje: 25 },
        { evaluacionId: ev.id, orden: 4, enunciado: '¿Cuál es la capital de Guatemala?', tipo: 'OPCION_MULTIPLE', opciones: ['Quetzaltenango', 'Guatemala', 'Antigua', 'Escuintla'], respuestaCorrecta: 'Guatemala', puntaje: 25 },
      ],
    });
    for (const au of alumnoUsers) {
      if (au.alumno.gradoId !== c.gradoId) continue;
      await prisma.intentoEvaluacion.create({
        data: { colegioId: cid, evaluacionId: ev.id, usuarioId: au.u.id, respuestas: { '1': '56', '2': 'Falso', '3': 'Fotosíntesis', '4': 'Guatemala' }, nota: 70 + (parseInt(au.alumno.codigo.slice(-2), 10) % 30), estado: 'CALIFICADO', finalizadoAt: addDays(-2) },
      });
    }
  }

  // ============================================================
  // SEGUNDO COLEGIO (prueba de aislamiento multi-tenant)
  // ============================================================
  const colegio2 = await prisma.colegio.create({
    data: { nombre: 'Instituto Demo El Roble', direccion: 'Km 12 Carretera a El Salvador', telefono: '+502 5555-9000', emailAdmin: 'admin@roble.edu.gt', plan: 'STARTER', estado: 'TRIAL', trialEndsAt: addDays(10) },
  });
  const c2 = colegio2.id;
  const admin2 = await prisma.usuario.create({ data: { colegioId: c2, email: 'admin@roble.edu.gt', passwordHash, rol: 'ADMIN_COLEGIO', nombre: 'Roberto Roble' } });
  await prisma.usuario.create({ data: { colegioId: c2, email: 'profesor.roble@demo.edu.gt', passwordHash, rol: 'PROFESOR', nombre: 'Elena Roble' } });
  await prisma.materia.create({ data: { colegioId: c2, nombre: 'Matemáticas' } });
  const grado2 = await prisma.grado.create({ data: { colegioId: c2, nombre: '4to Bachillerato A', nivel: 'Diversificado', profesorGuiaId: admin2.id } });
  for (let i = 0; i < 4; i++) {
    await prisma.alumno.create({ data: { colegioId: c2, codigo: `R00${i + 1}`, nombre: `Alumno Roble ${i + 1}`, apellido: 'Demo', gradoId: grado2.id, qrToken: `RB-R00${i + 1}` } });
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
  console.log('  Admin:    totalappgt@gmail.com');
  console.log('  Profesor: profesor1@demo.edu.gt');
  console.log('  Padre:    padre1@demo.edu.gt');
  console.log('  Alumno:   alumno1@demo.edu.gt');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
