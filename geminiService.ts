
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { StyleType, CategoryType } from "./types";

export const transformSketch = async (
  base64Image: string,
  style: StyleType,
  category: CategoryType,
  promptExtra: string = ""
): Promise<string> => {
  // Mencoba mengambil dari API_KEY (standar) atau GEMINI_API_KEY (seperti di screenshot Anda)
  const apiKey = process.env.API_KEY || (process.env as any).GEMINI_API_KEY;

  if (!apiKey || apiKey === "undefined" || apiKey === "") {
    throw new Error("Kunci Sihir (API Key) tidak terdeteksi. Pastikan variabel di Vercel bernama 'API_KEY' atau 'GEMINI_API_KEY', lalu lakukan Re-deploy aplikasi Anda.");
  }

  const ai = new GoogleGenAI({ apiKey });
  
  // Ambil data base64 murni tanpa prefix
  const base64Data = base64Image.split(',')[1];
  
  const prompt = `
    TASK: Transform this hand-drawn sketch into a photorealistic 3D ${category} in a ${style} style.
    
    INSTRUCTIONS:
    1. Preserve the EXACT pose, proportions, and silhouette from the original sketch.
    2. Add highly detailed textures appropriate for a ${category}.
    3. Use professional ${style} lighting and a clean background.
    4. Result must look like a high-end 3D render.
    5. DO NOT include any text, labels, or the original sketch lines in the output.
    
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
    const parts = response.candidates?.[0]?.content?.parts || [];
    for (const part of parts) {
      if (part.inlineData) {
        imageUrl = `data:image/png;base64,${part.inlineData.data}`;
        break;
      }
    }

    if (!imageUrl) {
      throw new Error("AI berhasil memproses tapi tidak mengirimkan gambar. Coba ganti gaya atau kategori.");
    }

    return imageUrl;
  } catch (error: any) {
    console.error("Gemini Error:", error);
    
    const msg = error.message?.toLowerCase() || "";
    if (msg.includes("api key") || msg.includes("401") || msg.includes("unauthorized")) {
      throw new Error("API Key Anda tidak valid atau salah ketik. Cek kembali di Google AI Studio.");
    } else if (msg.includes("quota") || msg.includes("429")) {
      throw new Error("Batas pemakaian (Quota) habis. Tunggu sebentar lalu coba lagi.");
    } else if (msg.includes("safety") || msg.includes("blocked")) {
      throw new Error("Gambar diblokir karena dianggap tidak aman oleh AI. Coba sketsa lain.");
    } else if (msg.includes("fetch failed")) {
      throw new Error("Koneksi gagal. Cek internet Anda atau status server Google.");
    }
    
    throw new Error(error.message || "Terjadi kesalahan saat memproses gambar magic.");
  }
};
