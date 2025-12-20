
import { GoogleGenAI } from "@google/genai";
import { StyleType, CategoryType } from "./types";

export const transformSketch = async (
  base64Image: string,
  style: StyleType,
  category: CategoryType,
  promptExtra: string = "",
  aspectRatio: string = "1:1"
): Promise<string> => {
  const apiKey = process.env.API_KEY;

  if (!apiKey) {
    throw new Error("API Key tidak terdeteksi.");
  }

  const ai = new GoogleGenAI({ apiKey });
  
  // Extract proper mimeType and base64 data
  const match = base64Image.match(/^data:(.+);base64,(.+)$/);
  const mimeType = match ? match[1] : 'image/png';
  const base64Data = match ? match[2] : base64Image.split(',')[1];
  
  // Prompt diperbarui untuk menekankan konsistensi wajah
  const prompt = `Transform this sketch into a highly detailed ${category} masterpiece.
    
    CRITICAL INSTRUCTION FOR HUMANS/CHARACTERS:
    - MAINTAIN FACIAL IDENTITY: The face in the output MUST look exactly like the same person across different generations.
    - ACCURATE REFERENCE: Use the sketch as the ground truth for facial structure (eyes, nose, mouth placement).
    - If it's a human, ensure skin texture and features are photorealistic and consistent.
    
    STYLE: ${style}. 
    DETAILS: ${promptExtra || 'High quality, 8k resolution, cinematic lighting.'}
    
    TECHNICAL:
    - Preserve the original pose and composition.
    - Remove all sketch artifacts (pencil lines, paper texture).
    - Final output must be a finished 3D/Real render, NOT a drawing.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          {
            inlineData: {
              data: base64Data,
              mimeType: mimeType,
            },
          },
          { text: prompt },
        ],
      },
      config: {
        // Seed dihapus karena menyebabkan error INVALID_ARGUMENT pada model ini
        imageConfig: {
          aspectRatio: aspectRatio
        }
      }
    });

    if (response.candidates && response.candidates[0].content.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          return `data:image/png;base64,${part.inlineData.data}`;
        }
      }
    }

    throw new Error(`Gagal generate rasio ${aspectRatio}.`);
  } catch (error: any) {
    console.error(`Gemini API Error (${aspectRatio}):`, error);
    
    const errorMessage = error.message?.toLowerCase() || "";
    // Menangani error spesifik
    if (errorMessage.includes("invalid argument") || errorMessage.includes("400")) {
       // Fallback message untuk error 400
       throw new Error(`Parameter tidak valid untuk rasio ${aspectRatio}.`);
    }
    if (errorMessage.includes("quota") || errorMessage.includes("429")) {
      throw new Error("Sistem sedang sibuk (Limit API). Tunggu sebentar lalu coba lagi.");
    }
    
    throw new Error("Gagal memproses sketsa.");
  }
};
