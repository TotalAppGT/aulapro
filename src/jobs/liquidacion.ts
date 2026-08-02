import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

type PagoLiquidacion = Awaited<ReturnType<typeof prisma.mensualidad.findMany>>[number];

async function liquidarPagos() {
  console.log(`[${new Date().toISOString()}] Iniciando liquidacion...`);

  const pagos = await prisma.mensualidad.findMany({
    where: { estado: 'PAGADO', liquidado: false },
    include: { colegio: true, alumno: true },
  });

  if (pagos.length === 0) {
    console.log('No hay pagos para liquidar.');
    return;
  }

  const porColegio = new Map<string, { pagos: PagoLiquidacion[]; total: number }>();

  for (const p of pagos) {
    if (!porColegio.has(p.colegioId)) {
      porColegio.set(p.colegioId, { pagos: [], total: 0 });
    }
    const grupo = porColegio.get(p.colegioId)!;
    grupo.pagos.push(p);
    grupo.total += p.monto;
  }

  const batchId = `LOTE-${Date.now()}`;

  for (const [colegioId, grupo] of porColegio) {
    const comision = Math.round(grupo.total * 0.03 * 100) / 100;
    const aTransferir = grupo.total - comision;

    console.log(`  Colegio ${colegioId}: Total Q${grupo.total}, Comision Q${comision}, Neto Q${aTransferir}`);

    await prisma.mensualidad.updateMany({
      where: { id: { in: grupo.pagos.map((p) => p.id) } },      data: {
        liquidado: true,
        comisionPlataforma: comision / grupo.pagos.length,
        payoutBatchId: batchId,
      },
    });
  }

  console.log(`[${new Date().toISOString()}] Liquidacion completada. Batch: ${batchId}`);
  console.log(`  ${pagos.length} pagos liquidados en ${porColegio.size} colegios.`);
}

liquidarPagos()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
