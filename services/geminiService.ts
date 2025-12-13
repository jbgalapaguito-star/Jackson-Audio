import { GoogleGenAI, Type } from "@google/genai";
import { AnalysisResult } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Converts a File object to a Base64 string suitable for the Gemini API (Inline).
 * Used for smaller files to reduce latency.
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
 * Uploads a large file to Gemini Files API and waits for it to be processed.
 */
const uploadLargeFile = async (file: File): Promise<{ fileData: { fileUri: string; mimeType: string } }> => {
  console.log("Iniciando carga de archivo grande a Gemini Files API...");
  
  // 1. Upload the file
  // Note: The SDK returns the 'file' object directly in the response
  const uploadResponse = await ai.files.upload({
    file: file,
    config: { 
      displayName: file.name,
      mimeType: file.type 
    }
  });

  const fileName = uploadResponse.name;
  console.log(`Archivo subido: ${fileName}. Esperando procesamiento...`);

  // 2. Poll until the file is active
  let fileInfo = await ai.files.get({ name: fileName });
  let attempts = 0;
  
  // Note: The SDK returns the 'file' object directly
  while (fileInfo.state === 'PROCESSING') {
    attempts++;
    if (attempts > 60) { // Timeout after ~2 minutes
        throw new Error("El procesamiento del archivo tardó demasiado tiempo.");
    }
    await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds
    fileInfo = await ai.files.get({ name: fileName });
    console.log(`Estado del archivo: ${fileInfo.state}`);
  }

  if (fileInfo.state === 'FAILED') {
    throw new Error("El procesamiento del audio falló en los servidores de Google.");
  }

  return {
    fileData: {
      fileUri: fileInfo.uri,
      mimeType: fileInfo.mimeType
    }
  };
};

/**
 * Analyzes the audio file using Gemini Flash.
 * Automatically switches strategy based on file size.
 */
export const analyzeAudioFile = async (file: File): Promise<AnalysisResult> => {
  try {
    const INLINE_LIMIT_BYTES = 20 * 1024 * 1024; // 20MB
    let audioPart;

    // Strategy selection: Inline for speed on small files, Files API for heavy lifting
    if (file.size < INLINE_LIMIT_BYTES) {
      console.log("Modo: Inline (Archivo pequeño)");
      audioPart = await fileToGenerativePart(file);
    } else {
      console.log("Modo: Files API (Archivo grande)");
      audioPart = await uploadLargeFile(file);
    }

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        parts: [
          audioPart,
          {
            text: `Actúa como un secretario experto redactando un Acta de Reunión formal basada en este audio.
            
            Necesito extraer la información para llenar un formato de acta específico. Extrae los siguientes campos en español:
            
            1. **Participantes (Asistentes):** Lista de nombres detectados.
            2. **Datos de la reunión:** 
               - Fecha (si se menciona, sino "Por definir").
               - Hora (si se menciona, sino "Por definir").
               - Lugar (si se menciona, sino "Reunión Virtual").
            3. **Objetivo General:** El propósito principal de la reunión.
            4. **Antecedentes:** Contexto previo o temas revisados al inicio.
            5. **Desarrollo:** Un resumen detallado de la discusión principal.
            6. **Compromisos (Resoluciones):** Una lista estructurada de acuerdos. Para cada uno identifica:
               - Resolución (Qué se acordó).
               - Responsable (Quién lo hará).
               - Fecha límite (Cuándo).
            7. **Próxima Reunión:** Fecha tentativa o detalles si se mencionan.

            Asegúrate de ser preciso y formal. Si no se menciona algún dato específico, infiérelo del contexto o usa "No especificado".`
          }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            participants: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Lista de nombres de los asistentes.",
            },
            meetingDate: { type: Type.STRING, description: "Fecha de la reunión (DD/MM/AAAA) o texto." },
            meetingTime: { type: Type.STRING, description: "Hora de la reunión." },
            meetingLocation: { type: Type.STRING, description: "Lugar o medio de la reunión." },
            generalObjective: { type: Type.STRING, description: "Objetivo general de la sesión." },
            background: { type: Type.STRING, description: "Antecedentes o contexto previo." },
            development: { type: Type.STRING, description: "Resumen del desarrollo de la reunión." },
            commitments: {
              type: Type.ARRAY,
              description: "Lista de compromisos/acuerdos.",
              items: {
                type: Type.OBJECT,
                properties: {
                  resolution: { type: Type.STRING, description: "Descripción del acuerdo o tarea." },
                  responsible: { type: Type.STRING, description: "Persona responsable." },
                  date: { type: Type.STRING, description: "Fecha de cumplimiento." }
                },
                required: ["resolution", "responsible", "date"]
              }
            },
            nextMeeting: { type: Type.STRING, description: "Detalles sobre la próxima reunión." }
          },
          required: ["participants", "meetingDate", "meetingTime", "meetingLocation", "generalObjective", "background", "development", "commitments", "nextMeeting"],
        },
      },
    });

    const text = response.text;
    if (!text) {
      throw new Error("No response text received from Gemini.");
    }

    const data = JSON.parse(text) as AnalysisResult;
    return data;

  } catch (error) {
    console.error("Error analyzing audio:", error);
    throw error;
  }
};