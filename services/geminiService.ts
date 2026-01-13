import { GoogleGenAI, Type } from "@google/genai";
import { DailyReport, MoneyBreakdown } from "../types";

// Helper to convert file to base64
export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      let encoded = reader.result?.toString().replace(/^data:(.*,)?/, "");
      if (encoded && (encoded.length % 4) > 0) {
        encoded += "=".repeat(4 - (encoded.length % 4));
      }
      resolve(encoded || "");
    };
    reader.onerror = (error) => reject(error);
  });
};

const validateReportData = (data: any): string[] => {
  const warnings: string[] = [];
  const today = new Date().toISOString().split('T')[0];

  // 1. Date Validation
  if (!data.date || isNaN(Date.parse(data.date))) {
    warnings.push("La fecha extraída no es válida.");
  } else if (data.date > today) {
    warnings.push("La fecha del reporte es futura.");
  }

  // 2. Math Consistency (System)
  const sysCalc = (data.systemBreakdown?.cash || 0) + 
                  (data.systemBreakdown?.electronic || 0) + 
                  (data.systemBreakdown?.deliveryApps || 0) + 
                  (data.systemBreakdown?.currentAccount || 0) + 
                  (data.systemBreakdown?.other || 0);
  
  // Allow small margin of error (floating point)
  if (Math.abs(sysCalc - data.systemTotal) > 5) {
    warnings.push(`Inconsistencia en Sistema: La suma de partes (${sysCalc}) no coincide con el Total Sistema (${data.systemTotal}).`);
  }

  // 3. Math Consistency (Real)
  // Real Total usually = Cash + Electronics + Delivery + CtaCte + Expenses (Expenses are usually paid out of cash drawer, so they count towards "what was there")
  // However, often "Real Total" in bakery sheets implies "Total Sales Counted". 
  // Let's assume Real Total = Sum of all Money found + Expenses receipts found.
  const realCalc = (data.realBreakdown?.cash || 0) + 
                   (data.realBreakdown?.electronic || 0) + 
                   (data.realBreakdown?.deliveryApps || 0) + 
                   (data.realBreakdown?.currentAccount || 0) + 
                   (data.expenses || 0); // Expenses often part of the daily accountability

  if (Math.abs(realCalc - data.realTotal) > 5) {
     // Warning optional here depending on how strict the accounting is, sometimes RealTotal excludes expenses in some systems.
     // We will flag it for review just in case.
     warnings.push(`Revisar Arqueo: La suma de efectivo, tarjetas, gastos, etc. (${realCalc}) difiere del Total Real ingresado (${data.realTotal}).`);
  }

  // 4. Critical Data Missing
  if ((data.realBreakdown?.cash || 0) === 0 && data.realTotal > 0) {
    warnings.push("Alerta: El efectivo en Arqueo Real es 0. ¿Es correcto?");
  }

  // 5. Large Discrepancy
  if (Math.abs(data.difference) > 1000) {
    warnings.push("Alerta: Existe una diferencia muy grande entre Sistema y Real (> $1000).");
  }

  return warnings;
};

export const analyzeCashCloseImage = async (base64Data: string, mimeType: string): Promise<DailyReport> => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API Key is missing. Please set it in the environment.");
  }

  const ai = new GoogleGenAI({ apiKey });

  const prompt = `
    Analiza esta imagen de un cierre de caja de panadería (Z-Cut / Arqueo).
    
    Necesito que extraigas los datos comparativos entre:
    1. "Cierre de Caja / Predeterminada" (Sistema).
    2. "Arqueo Real" (Físico).

    IMPORTANTE - Desglose de Medios de Pago:
    - Identifica "Efectivo".
    - Identifica "Medios Electrónicos" (Tarjetas, QR, Posnet local).
    - Identifica "Delivery / Apps" (PedidosYa, Rappi, Uber Eats) por separado.
    - Identifica "Cuentas Corrientes".

    Extrae gastos, totales y calcula la diferencia.
    
    Devuelve estrictamente un JSON válido.
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: {
      parts: [
        {
          inlineData: {
            mimeType: mimeType,
            data: base64Data
          }
        },
        { text: prompt }
      ]
    },
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          date: { type: Type.STRING, description: "YYYY-MM-DD" },
          shiftNumber: { type: Type.STRING, description: "Número de cierre o turno" },
          systemTotal: { type: Type.NUMBER, description: "Total de ventas según sistema" },
          systemBreakdown: {
            type: Type.OBJECT,
            properties: {
              cash: { type: Type.NUMBER },
              electronic: { type: Type.NUMBER },
              deliveryApps: { type: Type.NUMBER, description: "Ventas por PedidosYa, Rappi, etc." },
              currentAccount: { type: Type.NUMBER },
              other: { type: Type.NUMBER }
            }
          },
          realTotal: { type: Type.NUMBER, description: "Total encontrado en arqueo" },
          realBreakdown: {
             type: Type.OBJECT,
             properties: {
               cash: { type: Type.NUMBER },
               electronic: { type: Type.NUMBER },
               deliveryApps: { type: Type.NUMBER },
               currentAccount: { type: Type.NUMBER },
               other: { type: Type.NUMBER }
             }
          },
          expenses: { type: Type.NUMBER, description: "Gastos pagados con dinero de la caja" },
          difference: { type: Type.NUMBER, description: "Diferencia: Real Total - System Total" },
          notes: { type: Type.STRING }
        }
      }
    }
  });

  const text = response.text;
  if (!text) throw new Error("No response from AI");

  try {
    const data = JSON.parse(text);
    const warnings = validateReportData(data);
    
    let status: DailyReport['status'] = 'BALANCED';
    
    if (warnings.length > 0) {
        status = 'REVIEW_REQUIRED';
    } else {
        if (data.difference < -50) status = 'SHORTAGE'; // Allow small tolerance
        else if (data.difference > 50) status = 'SURPLUS';
    }

    return {
      id: crypto.randomUUID(),
      date: data.date,
      shiftNumber: data.shiftNumber || "N/A",
      systemTotal: data.systemTotal || 0,
      systemBreakdown: {
        cash: data.systemBreakdown?.cash || 0,
        electronic: data.systemBreakdown?.electronic || 0,
        deliveryApps: data.systemBreakdown?.deliveryApps || 0,
        currentAccount: data.systemBreakdown?.currentAccount || 0,
        other: data.systemBreakdown?.other || 0,
      },
      realTotal: data.realTotal || 0,
      realBreakdown: {
        cash: data.realBreakdown?.cash || 0,
        electronic: data.realBreakdown?.electronic || 0,
        deliveryApps: data.realBreakdown?.deliveryApps || 0,
        currentAccount: data.realBreakdown?.currentAccount || 0,
        other: data.realBreakdown?.other || 0,
      },
      expenses: data.expenses || 0,
      difference: data.difference || 0,
      status: status,
      warnings: warnings,
      notes: data.notes || ""
    };
  } catch (e) {
    console.error("Failed to parse Gemini response", e);
    throw new Error("Could not parse the report data.");
  }
};