'use client';

import { GoogleGenerativeAI } from "@google/generative-ai";
// Los dos puntos indican que subimos a la carpeta 'app' para buscar 'types'
//import { DailyReport } from '../types';
import { DailyReport } from '../types'; // LOS DOS PUNTOS SON VITALES
// Cargamos la API Key desde las variables de entorno de Vercel
const API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY || "";

export const analyzeCashCloseImage = async (base64Data: string, mimeType: string): Promise<DailyReport> => {
  if (!API_KEY) {
    throw new Error("La API Key de Gemini no está configurada en Vercel.");
  }

  const genAI = new GoogleGenerativeAI(API_KEY);
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  const prompt = `
    Analiza esta imagen de un cierre de caja de una panadería. 
    Extrae los datos y devuélvelos ESTRICTAMENTE en este formato JSON:
    {
      "id": "generar-un-uuid-o-timestamp",
      "date": "YYYY-MM-DD",
      "shiftNumber": "Mañana/Tarde/Noche",
      "systemTotal": 0,
      "systemBreakdown": { "cash": 0, "electronic": 0, "deliveryApps": 0, "currentAccount": 0, "other": 0 },
      "realTotal": 0,
      "realBreakdown": { "cash": 0, "electronic": 0, "deliveryApps": 0, "currentAccount": 0, "other": 0 },
      "expenses": 0,
      "difference": 0,
      "status": "BALANCED/SHORTAGE/SURPLUS",
      "warnings": []
    }
  `;

  try {
    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: base64Data,
          mimeType: mimeType
        }
      }
    ]);

    const response = await result.response;
    const text = response.text();
    
    // Limpiamos el texto por si Gemini devuelve markdown (```json ... ```)
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("No se pudo encontrar un formato JSON válido en la respuesta de la IA.");
    }

    return JSON.parse(jsonMatch[0]) as DailyReport;
  } catch (error) {
    console.error("Error en analyzeCashCloseImage:", error);
    throw error;
  }
};

/**
 * Convierte un archivo (File) a cadena Base64 para enviarlo a la API
 */
export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        // Quitamos el prefijo "data:image/png;base64,"
        resolve(reader.result.split(',')[1]);
      }
    };
    reader.onerror = error => reject(error);
  });
};
