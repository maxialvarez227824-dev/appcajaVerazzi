import { sql } from '@vercel/postgres';
import { DailyReport } from './types';

export const saveReportToDB = async (report: DailyReport) => {
  try {
    // Esto guarda el reporte como un texto JSON en la tabla
    await sql`
      INSERT INTO chats (pregunta, respuesta)
      VALUES (${report.date}, ${JSON.stringify(report)})
      ON CONFLICT DO NOTHING; 
    `;
    return { success: true };
  } catch (error) {
    console.error('Error en DB:', error);
    return { success: false, error };
  }
};

// Agrega esta función al final de tu archivo dbService.ts
export const getReportsFromDB = async () => {
  try {
    const { rows } = await sql`SELECT respuesta FROM chats ORDER BY fecha DESC`;
    // Convertimos los textos guardados de nuevo en objetos de reporte
    return rows.map(row => JSON.parse(row.respuesta) as DailyReport);
  } catch (error) {
    console.error('Error al leer de DB:', error);
    return [];
  }
};
