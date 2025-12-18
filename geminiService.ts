
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { StyleType, CategoryType } from "./types";

export const transformSketch = async (
  base64Image: string,
  style: StyleType,
  category: CategoryType,
  promptExtra: string = ""
): Promise<string> => {
  // Directly use the environment variable as per system instructions
  const apiKey = process.env.API_KEY;

  if (!apiKey) {
    throw new Error("Sistem belum siap. API Key tidak ditemukan di server.");
  }

  const ai = new GoogleGenAI({ apiKey });
  
  // Extract pure base64 data
  const base64Data = base64Image.split(',')[1];
  
  const prompt = `
    Transform this hand-drawn sketch into a high-quality, professional 3D ${category}.
    STYLE: ${style}
    
    CRITICAL RULES:
    1. Maintain the EXACT pose and silhouette of the drawing.
    2. Add realistic textures, professional studio lighting, and depth.
    3. The output must look like a finished 3D render or a high-quality photograph.
    4. Remove all paper textures, pencil marks, and grid lines from the original.
    5. No text, watermark, or labels in the final image.
    
    ${promptExtra ? `EXTRA DETAIL: ${promptExtra}` : ''}
  `;

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          {
            inlineData: {
              data: base64Data,
              mimeType: 'image/png',
            },
          },
          { text: prompt },
        ],
      },
      config: {
        imageConfig: {
          aspectRatio: "1:1"
        }
      }
    });

    // Extract the generated image from response parts
    const imagePart = response.candidates?.[0]?.content?.parts.find(p => p.inlineData);
    
    if (imagePart?.inlineData?.data) {
      return `data:image/png;base64,${imagePart.inlineData.data}`;
    }

    throw new Error("AI tidak menghasilkan gambar. Coba ganti gaya atau gunakan sketsa yang lebih jelas.");
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    
    const errorMessage = error.message?.toLowerCase() || "";
    if (errorMessage.includes("quota") || errorMessage.includes("429")) {
      throw new Error("Server sedang sibuk (Quota limit). Mohon tunggu 1 menit lalu coba lagi.");
    } else if (errorMessage.includes("safety")) {
      throw new Error("Sketsa diblokir oleh filter keamanan. Coba gambar sesuatu yang berbeda.");
    }
    
    throw new Error("Terjadi gangguan pada tongkat sihir AI. Silakan coba sesaat lagi.");
  }
};
