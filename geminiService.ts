
import { GoogleGenAI } from "@google/genai";
import { StyleType, CategoryType } from "./types";

export const transformSketch = async (
  base64Image: string,
  style: StyleType,
  category: CategoryType,
  promptExtra: string = ""
): Promise<string> => {
  const apiKey = process.env.API_KEY;

  if (!apiKey) {
    throw new Error("API Key tidak terdeteksi.");
  }

  const ai = new GoogleGenAI({ apiKey });
  const base64Data = base64Image.split(',')[1];
  
  const prompt = `Convert this sketch into a high-quality ${category} image.
    STYLE: ${style}. 
    MANDATORY: Preserve shape/pose. Realistic textures. Studio lighting. 
    REMOVE: Paper texture/pencil lines.
    USER DETAIL: ${promptExtra || 'Cinematic look.'}`;

  try {
    const response = await ai.models.generateContent({
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

    // Model flash kadang mengembalikan gambar di parts yang berbeda, kita cari yang ada inlineData-nya
    if (response.candidates && response.candidates[0].content.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          return `data:image/png;base64,${part.inlineData.data}`;
        }
      }
    }

    throw new Error("AI tidak menghasilkan gambar. Silakan coba sketsa yang lebih tebal.");
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    
    const errorMessage = error.message?.toLowerCase() || "";
    if (errorMessage.includes("quota") || errorMessage.includes("429")) {
      throw new Error("Sistem sedang sibuk (Limit API). Tunggu sebentar lalu coba lagi.");
    }
    
    throw new Error("Gagal memproses sketsa. Pastikan sketsa terlihat jelas.");
  }
};
