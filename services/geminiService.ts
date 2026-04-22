import { GoogleGenAI, Type } from "@google/genai";
import { AnalysisResult } from "../types";

const apiKey = process.env.API_KEY || "";
if (!apiKey) {
  console.warn("GEMINI_API_KEY no configurado. El análisis no funcionará.");
}
const ai = new GoogleGenAI({ apiKey });

/**
 * Convierte un archivo a Base64 para envío inline (archivos menores a 20MB).
 */
const fileToGenerativePart = async (file: File): Promise<{ inlineData: { data: string; mimeType: string } }> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      const base64Data = base64String.split(',')[1];
      resolve({
        inlineData: {
          data: base64Data,
          mimeType: file.type,
        },
      });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

/**
 * Sube archivos grandes a Gemini Files API.
 */
const uploadLargeFile = async (file: File) => {
  console.log("Cargando archivo pesado a Gemini Files API...");
  const uploadResponse = await ai.files.upload({
    file: file,
    config: { 
      displayName: file.name,
      mimeType: file.type 
    }
  });

  const fileName = uploadResponse.name;
  let fileInfo = await ai.files.get({ name: fileName });
  let attempts = 0;
  
  while (fileInfo.state === 'PROCESSING') {
    attempts++;
    if (attempts > 60) throw new Error("Tiempo de espera agotado en el procesamiento.");
    await new Promise(resolve => setTimeout(resolve, 2000));
    fileInfo = await ai.files.get({ name: fileName });
  }

  if (fileInfo.state === 'FAILED') throw new Error("Error en el procesamiento del servidor.");
  return fileInfo;
};

export const analyzeAudioFile = async (file: File): Promise<AnalysisResult> => {
  try {
    const INLINE_LIMIT = 20 * 1024 * 1024;
    let audioPart;

    if (file.size < INLINE_LIMIT) {
      audioPart = await fileToGenerativePart(file);
    } else {
      const fileData = await uploadLargeFile(file);
      audioPart = {
        fileData: {
          fileUri: fileData.uri,
          mimeType: fileData.mimeType
        }
      };
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: {
        parts: [
          audioPart,
          {
            text: `Eres un secretario ejecutivo experto en transcripción y redacción de actas. Tu tarea es:
            
            1. **ACTA FORMAL**: Genera un acta detallada (Participantes, Objetivo, Antecedentes, Desarrollo y Compromisos).
            2. **TRANSCRIPCIÓN COMPLETA POR PÁRRAFOS**: Proporciona el texto íntegro de la grabación organizado estrictamente por intervenciones. 
               - Cada párrafo debe comenzar con el nombre del hablante (o "HABLANTE X" si es desconocido) en mayúsculas, seguido de dos puntos.
               - Ejemplo: "JUAN PÉREZ: Buenos días a todos, comenzamos la sesión..."
               - Usa saltos de línea dobles entre cada cambio de hablante para que la estructura sea clara.
               - No omitas ninguna parte del discurso, debe ser literal.

            Idioma: Español. Responde estrictamente en formato JSON.`
          }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            participants: { type: Type.ARRAY, items: { type: Type.STRING } },
            meetingDate: { type: Type.STRING },
            meetingTime: { type: Type.STRING },
            meetingLocation: { type: Type.STRING },
            generalObjective: { type: Type.STRING },
            background: { type: Type.STRING },
            development: { type: Type.STRING },
            commitments: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  resolution: { type: Type.STRING },
                  responsible: { type: Type.STRING },
                  date: { type: Type.STRING }
                },
                required: ["resolution", "responsible", "date"]
              }
            },
            nextMeeting: { type: Type.STRING },
            fullTranscription: { type: Type.STRING, description: "Transcripción literal organizada por párrafos con identificación de hablante." }
          },
          required: ["participants", "meetingDate", "meetingTime", "meetingLocation", "generalObjective", "background", "development", "commitments", "nextMeeting", "fullTranscription"],
        },
      },
    });

    return JSON.parse(response.text) as AnalysisResult;
  } catch (error) {
    console.error("Error:", error);
    throw error;
  }
};