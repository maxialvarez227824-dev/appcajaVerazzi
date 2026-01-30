'use client';

import { GoogleGenerativeAI } from "@google/generative-ai";
// Importamos el tipo desde la carpeta superior
import { DailyReport } from '../types';

// La variable de entorno que configuramos en Vercel
const API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY || "";

export const analyzeCashCloseImage = async (base64Data: string, mimeType: string): Promise<DailyReport> => {
  if (!API_KEY) {
    throw new Error("La API Key de Gemini no está configurada. Verificá las variables de entorno en Vercel.");
  }

  const genAI = new GoogleGenerativeAI(API_KEY);
  
  // Usamos el modelo 1.5-flash que es el mejor para leer texto de imágenes (OCR)
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  const prompt = `
    Analizá esta imagen de un cierre de caja de una panadería argentina. 
    Extraé los datos y devolvelos ÚNICAMENTE en este formato JSON, sin texto extra:
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
      "status": "BALANCED",
      "warnings": []
    }
    Importante: 
    - Si hay diferencia negativa, status es 'SHORTAGE'.
    - Si hay diferencia positiva, status es 'SURPLUS'.
    - Si falta algún dato, poné 0.
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
    
    // Limpiamos la respuesta por si la IA pone comillas de bloque (```json ... ```)
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
 * Función para convertir la imagen que subís a un formato que la IA entienda
 */
export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        // Quitamos el encabezado "data:image/jpeg;base64," para enviar solo el contenido
        resolve(reader.result.split(',')[1]);
      }
    };
    reader.onerror = error => reject(error);
  });
};
};
