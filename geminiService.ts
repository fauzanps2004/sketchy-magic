
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { StyleType, CategoryType } from "./types";

export const transformSketch = async (
  base64Image: string,
  style: StyleType,
  category: CategoryType,
  promptExtra: string = ""
): Promise<string> => {
  const apiKey = process.env.API_KEY || (process.env as any).GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error("Sistem belum siap. API Key tidak terdeteksi di server.");
  }

  const ai = new GoogleGenAI({ apiKey });
  const base64Data = base64Image.split(',')[1];
  
  const prompt = `
    Transformasi sketsa kasar ini menjadi gambar 3D ${category} profesional yang sangat detail.
    GAYA VISUAL: ${style}
    
    ATURAN UTAMA:
    1. Pertahankan POSE dan BENTUK dasar dari sketsa secara akurat.
    2. Tambahkan tekstur material yang nyata, pencahayaan studio, dan kedalaman ruang.
    3. Hasil akhir harus terlihat seperti render 3D high-end atau foto berkualitas tinggi.
    4. Hilangkan tekstur kertas, garis pensil, atau noda dari gambar asli.
    5. Jangan ada teks, watermark, atau logo.
    
    DETAIL TAMBAHAN DARI PENGGUNA: ${promptExtra || 'Buatlah terlihat mengagumkan.'}
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

    const imagePart = response.candidates?.[0]?.content?.parts.find(p => p.inlineData);
    
    if (imagePart?.inlineData?.data) {
      return `data:image/png;base64,${imagePart.inlineData.data}`;
    }

    throw new Error("AI tidak menghasilkan gambar. Coba ganti gaya atau gunakan sketsa yang lebih jelas.");
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    
    const errorMessage = error.message?.toLowerCase() || "";
    if (errorMessage.includes("quota") || errorMessage.includes("429")) {
      throw new Error("Waduh, kuota harian API gratis Anda sudah habis atau terlalu cepat menekan tombol. Mohon tunggu 1-2 menit sebelum mencoba lagi.");
    } else if (errorMessage.includes("safety")) {
      throw new Error("Maaf, sketsa atau permintaan Anda terdeteksi melanggar aturan keamanan konten AI. Coba sketsa yang lebih umum.");
    }
    
    throw new Error("Terjadi gangguan pada koneksi sihir AI. Silakan coba lagi.");
  }
};
