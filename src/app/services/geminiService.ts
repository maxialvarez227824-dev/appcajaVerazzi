'use client';

import { GoogleGenerativeAI } from "@google/generative-ai";
// Los dos puntos son vitales porque estamos en src/app/services/ y types está en src/app/
import { DailyReport } from '../types';

const API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY || "";

export const analyzeCashCloseImage = async (base64Data: string, mimeType: string): Promise<DailyReport> => {
  if (!API_KEY) {
    throw new Error("La API Key de Gemini no está configurada. Verifica las variables de entorno en Vercel.");
  }

  const genAI = new GoogleGenerativeAI(API_KEY);
  // Usamos el modelo flash que es rápido y económico para leer texto de imágenes
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  const prompt = `
    Analiza esta imagen de un cierre de caja de una panadería. 
    Extrae los datos y devuélvelos ÚNICAMENTE en este formato JSON:
    {
      "id": "generar-un-id-unico",
      "date": "YYYY-MM-DD",
      "shiftNumber": "Mañana/Tarde",
      "systemTotal": 0,
      "systemBreakdown": { "cash": 0, "electronic": 0, "deliveryApps": 0, "currentAccount": 0, "other": 0 },
      "realTotal": 0,
      "realBreakdown": { "cash": 0, "electronic": 0, "deliveryApps": 0, "currentAccount": 0, "other": 0 },
      "expenses": 0,
      "difference": 0,
      "status": "BALANCED/SHORTAGE/SURPLUS",
      "warnings": []
    }
    Si no encuentras un dato, pon 0.
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
    
    // Buscamos el JSON dentro de la respuesta por si la IA agrega texto extra
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("La IA no devolvió un formato de datos válido.");
    }

    return JSON.parse(jsonMatch[0]) as DailyReport;
  } catch (error) {
    console.error("Error en geminiService:", error);
    throw error;
  }
};

/**
 * Función auxiliar para convertir el archivo de imagen a Base64
 */
export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result.split(',')[1]);
      }
    };
    reader.onerror = error => reject(error);
  });
};