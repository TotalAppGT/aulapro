import PdfPrinter, { type TDocumentDefinitions, type TFontDictionary } from 'pdfmake';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { R2_ENDPOINT, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET, R2_PUBLIC_URL, R2_REGION } from '../config';
import { prisma } from '../lib/prisma';

const r2 = new S3Client({
  region: R2_REGION,
  endpoint: R2_ENDPOINT,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID,
    secretAccessKey: R2_SECRET_ACCESS_KEY,
  },
});

const fonts: TFontDictionary = {
  Roboto: {
    normal: 'Helvetica',
    bold: 'Helvetica-Bold',
    italics: 'Helvetica-Oblique',
    bolditalics: 'Helvetica-BoldOblique',
  },
};

const printer = new PdfPrinter(fonts);

function formatCurrency(amount: number): string {
  return `Q${amount.toFixed(2)}`;
}

export function generarBoletin(
  alumno: any,
  calificaciones: any[],
  colegio: any,
  bimestre: number,
): Promise<Buffer> {
  const promedioTotal =
    calificaciones.length > 0
      ? calificaciones.reduce((sum: number, c: any) => sum + (c.nota || c.promedio || 0), 0) /
        calificaciones.length
      : 0;

  const tableBody: any[][] = [
    [
      { text: 'No.', style: 'tableHeader', alignment: 'center' },
      { text: 'Materia', style: 'tableHeader', alignment: 'center' },
      { text: 'Nota', style: 'tableHeader', alignment: 'center' },
    ],
  ];

  calificaciones.forEach((cal: any, index: number) => {
    tableBody.push([
      { text: (index + 1).toString(), alignment: 'center' },
      { text: cal.materia || cal.nombre || cal.asignatura || '' },
      { text: (cal.nota ?? cal.promedio ?? 0).toFixed(1), alignment: 'center' },
    ]);
  });

  tableBody.push([
    { text: '', colSpan: 2, border: [false, false, false, false] },
    { text: '' },
    {
      text: `Promedio: ${promedioTotal.toFixed(1)}`,
      style: 'average',
      alignment: 'center',
    },
  ]);

  const docDefinition: TDocumentDefinitions = {
    pageSize: 'LETTER',
    pageMargins: [40, 40, 40, 40] as [number, number, number, number],
    content: [
      {
        columns: [
          {
            width: 80,
            text: '',
          },
          {
            width: '*',
            stack: [
              {
                text: colegio.nombre || 'Colegio',
                style: 'colegioName',
                alignment: 'center',
              },
              {
                text: `Boletin de Calificaciones - ${bimestre}o. Bimestre`,
                style: 'subtitle',
                alignment: 'center',
                margin: [0, 4, 0, 0],
              },
            ],
          },
          { width: 80, text: '' },
        ],
        margin: [0, 0, 0, 16],
      },
      {
        margin: [0, 0, 0, 12],
        canvas: [
          {
            type: 'line',
            x1: 0,
            y1: 0,
            x2: 535,
            y2: 0,
            lineWidth: 1,
            lineColor: '#333333',
          },
        ],
      },
      {
        columns: [
          {
            width: '50%',
            stack: [
              {
                text: `Alumno: ${alumno.nombre || alumno.nombres || ''} ${alumno.apellido || alumno.apellidos || ''}`,
                style: 'infoText',
                margin: [0, 0, 0, 4],
              },
              {
                text: `Codigo: ${alumno.codigo || alumno.id || ''}`,
                style: 'infoText',
                margin: [0, 0, 0, 4],
              },
              { text: `Grado: ${alumno.grado || ''}`, style: 'infoText' },
            ],
          },
          {
            width: '50%',
            stack: [
              {
                text: `Bimestre: ${bimestre}`,
                style: 'infoText',
                alignment: 'right',
                margin: [0, 0, 0, 4],
              },
              {
                text: `Ciclo Escolar: ${colegio.cicloEscolar || new Date().getFullYear().toString()}`,
                style: 'infoText',
                alignment: 'right',
                margin: [0, 0, 0, 4],
              },
              {
                text: `Fecha: ${new Date().toLocaleDateString('es-GT')}`,
                style: 'infoText',
                alignment: 'right',
              },
            ],
          },
        ],
        margin: [0, 0, 0, 16],
      },
      {
        table: {
          headerRows: 1,
          widths: [40, '*', 100],
          body: tableBody,
        },
        layout: {
          hLineWidth: function () {
            return 1;
          },
          vLineWidth: function () {
            return 1;
          },
          hLineColor: function () {
            return '#aaaaaa';
          },
          vLineColor: function () {
            return '#aaaaaa';
          },
          paddingLeft: function () {
            return 6;
          },
          paddingRight: function () {
            return 6;
          },
          paddingTop: function () {
            return 4;
          },
          paddingBottom: function () {
            return 4;
          },
        },
        margin: [0, 0, 0, 24],
      },
      {
        columns: [
          {
            width: '50%',
            stack: [
              { text: '', margin: [0, 20, 0, 0] },
              {
                canvas: [
                  {
                    type: 'line',
                    x1: 0,
                    y1: 0,
                    x2: 200,
                    y2: 0,
                    lineWidth: 0.5,
                    lineColor: '#333333',
                  },
                ],
              },
              {
                text: 'Firma del Maestro(a)',
                style: 'signatureLabel',
                alignment: 'center',
                margin: [0, 4, 0, 0],
              },
            ],
          },
          {
            width: '50%',
            stack: [
              { text: '', margin: [0, 20, 0, 0] },
              {
                canvas: [
                  {
                    type: 'line',
                    x1: 0,
                    y1: 0,
                    x2: 200,
                    y2: 0,
                    lineWidth: 0.5,
                    lineColor: '#333333',
                  },
                ],
              },
              {
                text: 'Firma del Padre/Madre de Familia',
                style: 'signatureLabel',
                alignment: 'center',
                margin: [0, 4, 0, 0],
              },
            ],
          },
        ],
        margin: [0, 20, 0, 0],
      },
    ],
    styles: {
      colegioName: {
        fontSize: 16,
        bold: true,
      },
      subtitle: {
        fontSize: 12,
        bold: true,
      },
      infoText: {
        fontSize: 10,
      },
      tableHeader: {
        fontSize: 10,
        bold: true,
        fillColor: '#e8e8e8',
      },
      average: {
        fontSize: 10,
        bold: true,
      },
      signatureLabel: {
        fontSize: 9,
        italics: true,
      },
    },
    defaultStyle: {
      fontSize: 10,
    },
  };

  const pdfDoc = printer.createPdfKitDocument(docDefinition);

  const chunks: Buffer[] = [];
  return new Promise<Buffer>((resolve, reject) => {
    pdfDoc.on('data', (chunk: Buffer) => chunks.push(chunk));
    pdfDoc.on('end', () => resolve(Buffer.concat(chunks)));
    pdfDoc.on('error', reject);
    pdfDoc.end();
  });
}

export function generarReportePagos(
  colegio: any,
  pagos: any[],
  mes: string,
): Promise<Buffer> {
  const tableBody: any[][] = [
    [
      { text: 'No.', style: 'tableHeader', alignment: 'center' },
      { text: 'Alumno', style: 'tableHeader', alignment: 'center' },
      { text: 'Grado', style: 'tableHeader', alignment: 'center' },
      { text: 'Monto', style: 'tableHeader', alignment: 'center' },
      { text: 'Estado', style: 'tableHeader', alignment: 'center' },
      { text: 'Fecha de Pago', style: 'tableHeader', alignment: 'center' },
    ],
  ];

  let totalPagado = 0;
  let totalPendiente = 0;

  pagos.forEach((pago: any, index: number) => {
    const estado = pago.estado || pago.status || 'pendiente';
    const monto = pago.monto || 0;
    const fechaPago = pago.fechaPago || pago.paidAt || '';

    if (estado === 'completado' || estado === 'paid') {
      totalPagado += monto;
    } else {
      totalPendiente += monto;
    }

    tableBody.push([
      { text: (index + 1).toString(), alignment: 'center' },
      { text: pago.alumnoNombre || pago.studentName || '' },
      { text: pago.grado || pago.grade || '', alignment: 'center' },
      { text: formatCurrency(monto), alignment: 'right' },
      {
        text: estado === 'completado' || estado === 'paid' ? 'Pagado' : 'Pendiente',
        alignment: 'center',
        fillColor: estado === 'completado' || estado === 'paid' ? '#d4edda' : '#f8d7da',
      },
      {
        text: fechaPago ? new Date(fechaPago).toLocaleDateString('es-GT') : '-',
        alignment: 'center',
      },
    ]);
  });

  tableBody.push([
    { text: '', colSpan: 3, border: [false, false, false, false] },
    { text: '' },
    { text: '' },
    { text: 'Totales:', style: 'average', alignment: 'right' },
    { text: '', border: [false, false, false, false] },
    { text: '', border: [false, false, false, false] },
  ]);

  tableBody.push([
    { text: '', colSpan: 3, border: [false, false, false, false] },
    { text: '' },
    { text: '' },
    { text: `Pagado: ${formatCurrency(totalPagado)}`, alignment: 'right', fillColor: '#d4edda' },
    { text: '', border: [false, false, false, false] },
    { text: '', border: [false, false, false, false] },
  ]);

  tableBody.push([
    { text: '', colSpan: 3, border: [false, false, false, false] },
    { text: '' },
    { text: '' },
    { text: `Pendiente: ${formatCurrency(totalPendiente)}`, alignment: 'right', fillColor: '#f8d7da' },
    { text: '', border: [false, false, false, false] },
    { text: '', border: [false, false, false, false] },
  ]);

  const docDefinition: TDocumentDefinitions = {
    pageSize: 'LETTER',
    pageOrientation: 'landscape',
    pageMargins: [30, 30, 30, 30] as [number, number, number, number],
    content: [
      {
        text: colegio.nombre || 'Colegio',
        style: 'colegioName',
        alignment: 'center',
        margin: [0, 0, 0, 4],
      },
      {
        text: `Reporte de Pagos - ${mes}`,
        style: 'subtitle',
        alignment: 'center',
        margin: [0, 0, 0, 12],
      },
      {
        margin: [0, 0, 0, 12],
        canvas: [
          {
            type: 'line',
            x1: 0,
            y1: 0,
            x2: 715,
            y2: 0,
            lineWidth: 1,
            lineColor: '#333333',
          },
        ],
      },
      {
        text: `Fecha de generacion: ${new Date().toLocaleDateString('es-GT')}`,
        style: 'infoText',
        alignment: 'right',
        margin: [0, 0, 0, 12],
      },
      {
        table: {
          headerRows: 1,
          widths: [30, 200, 80, 100, 100, 120],
          body: tableBody,
        },
        layout: {
          hLineWidth: function () {
            return 1;
          },
          vLineWidth: function () {
            return 1;
          },
          hLineColor: function () {
            return '#aaaaaa';
          },
          vLineColor: function () {
            return '#aaaaaa';
          },
          paddingLeft: function () {
            return 6;
          },
          paddingRight: function () {
            return 6;
          },
          paddingTop: function () {
            return 4;
          },
          paddingBottom: function () {
            return 4;
          },
        },
      },
    ],
    styles: {
      colegioName: {
        fontSize: 14,
        bold: true,
      },
      subtitle: {
        fontSize: 12,
        bold: true,
      },
      infoText: {
        fontSize: 9,
      },
      tableHeader: {
        fontSize: 9,
        bold: true,
        fillColor: '#e8e8e8',
      },
      average: {
        fontSize: 9,
        bold: true,
      },
    },
    defaultStyle: {
      fontSize: 9,
    },
  };

  const pdfDoc = printer.createPdfKitDocument(docDefinition);

  const chunks: Buffer[] = [];
  return new Promise<Buffer>((resolve, reject) => {
    pdfDoc.on('data', (chunk: Buffer) => chunks.push(chunk));
    pdfDoc.on('end', () => resolve(Buffer.concat(chunks)));
    pdfDoc.on('error', reject);
    pdfDoc.end();
  });
}

export async function generateBoletinPDF(
  alumnoId: string,
  colegioId: string,
  bimestre: number
): Promise<string> {
  const alumno = await prisma.alumno.findFirst({
    where: { id: alumnoId, colegioId },
    include: { grado: true, colegio: true },
  });

  if (!alumno) {
    throw new Error('Alumno no encontrado');
  }

  const calificaciones = await prisma.calificacion.findMany({
    where: { alumnoId, colegioId, bimestre },
    include: { materia: true },
    orderBy: { materia: { nombre: 'asc' } },
  });

  const materiasMap = new Map<
    string,
    { nombre: string; notas: { tipo: string; nota: number }[] }
  >();
  for (const cal of calificaciones) {
    if (!materiasMap.has(cal.materiaId)) {
      materiasMap.set(cal.materiaId, { nombre: cal.materia.nombre, notas: [] });
    }
    materiasMap.get(cal.materiaId)!.notas.push({ tipo: cal.tipo, nota: cal.nota });
  }

  const materiasData = Array.from(materiasMap.values()).map((m) => ({
    materia: m.nombre,
    nota: m.notas.length > 0
      ? m.notas.reduce((s: number, n: { nota: number }) => s + n.nota, 0) / m.notas.length
      : 0,
  }));

  const pdfBuffer = await generarBoletin(
    {
      nombre: alumno.nombre,
      apellido: alumno.apellido,
      codigo: alumno.codigo,
      grado: alumno.grado?.nombre || 'No asignado',
    },
    materiasData,
    {
      nombre: alumno.colegio.nombre,
      cicloEscolar: String(new Date().getFullYear()),
    },
    bimestre
  );

  const key = `boletines/${colegioId}/${alumnoId}/bimestre-${bimestre}.pdf`;

  await r2.send(
    new PutObjectCommand({
      Bucket: R2_BUCKET,
      Key: key,
      Body: pdfBuffer,
      ContentType: 'application/pdf',
    })
  );

  return `${R2_PUBLIC_URL}/${key}`;
}
