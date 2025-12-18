
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { StyleType, CategoryType } from "./types";

export const transformSketch = async (
  base64Image: string,
  style: StyleType,
  category: CategoryType,
  promptExtra: string = ""
): Promise<string> => {
  // Inisialisasi langsung menggunakan process.env.API_KEY yang sudah ada di environment
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  // Ambil data base64 murni
  const base64Data = base64Image.split(',')[1];
  
  const prompt = `
    TASK: Transform this hand-drawn sketch into a photorealistic 3D ${category} in a ${style} style.
    
    INSTRUCTIONS:
    1. Maintain the EXACT pose, proportions, and silhouette from the original sketch.
    2. Add highly detailed textures appropriate for a ${category}.
    3. Use professional ${style} lighting.
    4. Clean, studio-like background.
    5. Result must look like a high-end 3D render.
    6. No text or labels.
    
    ADDITIONAL CONTEXT: ${promptExtra}
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

    let imageUrl = '';
    // Iterasi semua bagian untuk menemukan gambar sesuai panduan SDK
    if (response.candidates?.[0]?.content?.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          imageUrl = `data:image/png;base64,${part.inlineData.data}`;
          break;
        }
      }
    }

    if (!imageUrl) {
      throw new Error("AI tidak memberikan hasil gambar. Coba ganti gaya atau kategori.");
    }

    return imageUrl;
  } catch (error: any) {
    console.error("Gemini Error:", error);
    
    // Memberikan pesan yang lebih spesifik berdasarkan error dari Google API
    const msg = error.message?.toLowerCase() || "";
    if (msg.includes("api key") || msg.includes("401") || msg.includes("unauthorized")) {
      throw new Error("API Key tidak valid atau belum terbaca di Vercel. Pastikan sudah Re-deploy setelah isi Environment Variable.");
    } else if (msg.includes("quota") || msg.includes("429")) {
      throw new Error("Wah, terlalu banyak yang pakai! Tunggu sebentar ya, kuota limit tercapai.");
    } else if (msg.includes("region") || msg.includes("not available")) {
      throw new Error("Maaf, fitur ini belum tersedia di wilayah server ini.");
    }
    
    throw new Error(error.message || "Terjadi kesalahan saat memproses gambar.");
  }
};
