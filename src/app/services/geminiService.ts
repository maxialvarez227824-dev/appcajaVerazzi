'use client';
import { GoogleGenerativeAI } from "@google/generative-ai";
// IMPORTANTE: Agregamos '../' para que suba un nivel de carpeta y encuentre types
import { DailyReport } from '../types'; 

const API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY || "";
const genAI = new GoogleGenerativeAI(API_KEY);

export const analyzeCashCloseImage = async (base64Data: string, mimeType: string): Promise<DailyReport> => {
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  const prompt = `Analiza este cierre de caja de panadería y extrae los datos en formato JSON...`;

  const result = await model.generateContent([
    prompt,
    { inlineData: { data: base64Data, mimeType } }
  ]);

  const response = await result.response;
  const text = response.text();
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  
  if (!jsonMatch) throw new Error("No se pudo extraer JSON");
  return JSON.parse(jsonMatch[0]);
};

export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const base64 = reader.result as string;
      resolve(base64.split(',')[1]);
    };
    reader.onerror = error => reject(error);
  });
};
