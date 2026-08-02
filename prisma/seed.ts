import { PrismaClient, RolUsuario, PlanColegio, EstadoColegio } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  const passwordHash = await bcrypt.hash('admintotal', 10);

  const colegio = await prisma.colegio.create({
    data: {
      nombre: 'Colegio Demo Las Rosas',
      direccion: 'Zona 10, Ciudad de Guatemala',
      telefono: '+502 5555-0001',
      emailAdmin: 'totalappgt@gmail.com',
      plan: PlanColegio.PRO,
      estado: EstadoColegio.ACTIVE,
      config: {
        mensualidadDefault: 300,
        bimestres: 4,
        logoUrl: null,
      },
      recurrenteAccountId: 'ac_demo123',
    },
  });

  const admin = await prisma.usuario.create({
    data: {
      colegioId: colegio.id,
      email: 'totalappgt@gmail.com',
      passwordHash,
      rol: RolUsuario.ADMIN_COLEGIO,
      nombre: 'Carlos Admin',
      telefono: '+502 5555-0001',
    },
  });

  const profesor1 = await prisma.usuario.create({
    data: {
      colegioId: colegio.id,
      email: 'profesor1@demo.edu.gt',
      passwordHash,
      rol: RolUsuario.PROFESOR,
      nombre: 'Maria Profesora',
      telefono: '+502 5555-0002',
    },
  });

  const profesor2 = await prisma.usuario.create({
    data: {
      colegioId: colegio.id,
      email: 'profesor2@demo.edu.gt',
      passwordHash,
      rol: RolUsuario.PROFESOR,
      nombre: 'Juan Profesor',
      telefono: '+502 5555-0003',
    },
  });

  const grado1 = await prisma.grado.create({
    data: {
      colegioId: colegio.id,
      nombre: '1ro Primaria A',
      nivel: 'Primaria',
      profesorGuiaId: profesor1.id,
    },
  });

  const grado2 = await prisma.grado.create({
    data: {
      colegioId: colegio.id,
      nombre: '2do Primaria A',
      nivel: 'Primaria',
      profesorGuiaId: profesor2.id,
    },
  });

  const materia1 = await prisma.materia.create({
    data: { colegioId: colegio.id, nombre: 'Matematicas', profesorId: profesor1.id },
  });

  const materia2 = await prisma.materia.create({
    data: { colegioId: colegio.id, nombre: 'Lenguaje', profesorId: profesor2.id },
  });

  const materia3 = await prisma.materia.create({
    data: { colegioId: colegio.id, nombre: 'Ciencias Naturales', profesorId: profesor1.id },
  });

  const padre = await prisma.usuario.create({
    data: {
      colegioId: colegio.id,
      email: 'padre@demo.edu.gt',
      passwordHash,
      rol: RolUsuario.PADRE,
      nombre: 'Ana Padre de Familia',
      telefono: '+502 5555-0010',
    },
  });

  const alumno1 = await prisma.alumno.create({
    data: {
      colegioId: colegio.id,
      codigo: '2026001',
      nombre: 'Pedro',
      apellido: 'Lopez',
      gradoId: grado1.id,
      responsableId: padre.id,
    },
  });

  const alumno2 = await prisma.alumno.create({
    data: {
      colegioId: colegio.id,
      codigo: '2026002',
      nombre: 'Sofia',
      apellido: 'Lopez',
      gradoId: grado2.id,
      responsableId: padre.id,
    },
  });

  const alumno3 = await prisma.alumno.create({
    data: {
      colegioId: colegio.id,
      codigo: '2026003',
      nombre: 'Diego',
      apellido: 'Martinez',
      gradoId: grado1.id,
    },
  });

  const alumnoUser1 = await prisma.usuario.create({
    data: {
      colegioId: colegio.id,
      email: 'pedro@demo.edu.gt',
      passwordHash,
      rol: RolUsuario.ALUMNO,
      nombre: 'Pedro Lopez',
    },
  });

  const alumnoUser2 = await prisma.usuario.create({
    data: {
      colegioId: colegio.id,
      email: 'sofia@demo.edu.gt',
      passwordHash,
      rol: RolUsuario.ALUMNO,
      nombre: 'Sofia Lopez',
    },
  });

  const horarios = [
    { gradoId: grado1.id, materiaId: materia1.id, diaSemana: 1, horaInicio: '07:00', horaFin: '08:00' },
    { gradoId: grado1.id, materiaId: materia2.id, diaSemana: 1, horaInicio: '08:00', horaFin: '09:00' },
    { gradoId: grado1.id, materiaId: materia3.id, diaSemana: 2, horaInicio: '07:00', horaFin: '08:00' },
    { gradoId: grado1.id, materiaId: materia1.id, diaSemana: 2, horaInicio: '08:00', horaFin: '09:00' },
    { gradoId: grado2.id, materiaId: materia2.id, diaSemana: 1, horaInicio: '07:00', horaFin: '08:00' },
    { gradoId: grado2.id, materiaId: materia3.id, diaSemana: 1, horaInicio: '08:00', horaFin: '09:00' },
  ];

  for (const h of horarios) {
    await prisma.horario.create({
      data: { colegioId: colegio.id, ...h },
    });
  }

  const meses = ['2026-03', '2026-04', '2026-05'];
  const montos = [300, 300, 300];

  for (const alumno of [alumno1, alumno2, alumno3]) {
    for (let i = 0; i < meses.length; i++) {
      await prisma.mensualidad.create({
        data: {
          colegioId: colegio.id,
          alumnoId: alumno.id,
          mes: meses[i],
          monto: montos[i],
          estado: i === 0 ? 'PAGADO' : i === 1 ? 'PAGADO' : 'PENDIENTE',
          fechaPago: i < 2 ? new Date(`2026-0${3 + i}-15`) : null,
        },
      });
    }
  }

  for (let bimestre = 1; bimestre <= 2; bimestre++) {
    await prisma.calificacion.createMany({
      data: [
        { colegioId: colegio.id, alumnoId: alumno1.id, materiaId: materia1.id, bimestre, nota: 85 + bimestre, tipo: 'final', registradoPor: profesor1.id },
        { colegioId: colegio.id, alumnoId: alumno1.id, materiaId: materia2.id, bimestre, nota: 90 - bimestre, tipo: 'final', registradoPor: profesor2.id },
        { colegioId: colegio.id, alumnoId: alumno2.id, materiaId: materia1.id, bimestre, nota: 78 + bimestre, tipo: 'final', registradoPor: profesor1.id },
        { colegioId: colegio.id, alumnoId: alumno2.id, materiaId: materia3.id, bimestre, nota: 92 - bimestre, tipo: 'final', registradoPor: profesor1.id },
      ],
    });
  }

  await prisma.tarea.create({
    data: {
      colegioId: colegio.id,
      gradoId: grado1.id,
      materia: 'Matematicas',
      titulo: 'Ejercicios de suma y resta',
      descripcion: 'Resolver paginas 45-47 del libro de texto.',
      fechaEntrega: new Date('2026-08-15'),
      tipo: 'tarea',
      archivos: [],
      creadoPor: profesor1.id,
    },
  });

  await prisma.anuncio.create({
    data: {
      colegioId: colegio.id,
      titulo: 'Reunion de padres de familia',
      contenido: 'Se les invita a la reunion general el proximo viernes 15 a las 18:00 horas en el salon de usos multiples.',
      tipo: 'GENERAL',
      enviarWhatsapp: true,
      archivos: [],
      creadoPor: admin.id,
    },
  });

  console.log('Seed completed!');
  console.log(`  Colegio: ${colegio.nombre} (${colegio.id})`);
  console.log(`  Admin: totalappgt@gmail.com / admintotal`);
  console.log(`  Profesor: profesor1@demo.edu.gt / admintotal`);
  console.log(`  Padre: padre@demo.edu.gt / admintotal`);
  console.log(`  Alumno: pedro@demo.edu.gt / admintotal`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
