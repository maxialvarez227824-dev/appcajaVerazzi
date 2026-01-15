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