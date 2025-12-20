
import { GoogleGenAI } from "@google/genai";
import { StyleType, CategoryType } from "./types";

const aiInstance = () => new GoogleGenAI({ apiKey: process.env.API_KEY || "" });

/**
 * Fungsi Voice-to-Sketch: Menghasilkan sketsa referensi yang akurat secara anatomi.
 */
export const generateAIsimpleSketch = async (promptText: string): Promise<string> => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) throw new Error("API Key tidak ditemukan.");

  const ai = aiInstance();
  
  // Prompt yang lebih teknis untuk akurasi karakter
  const systemPrompt = `Task: Professional Character/Object Underdrawing.
    Subject: ${promptText}.
    
    CRITICAL QUALITY GUIDELINES:
    - For Characters: Use professional anatomical structure, clear silhouette, and correct proportions. Focus on the core landmarks (eyes, nose, limb placement).
    - Style: Clean rough pencil line art, architectural sketching style. 
    - Technical: STARK BLACK lines on PURE WHITE background (#FFFFFF).
    - No colors, no heavy shading, no background details.
    - It must look like a high-quality initial drawing base for a master artist.
    - Keep lines thin and precise enough for reference.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [{ text: systemPrompt }],
      },
      config: {
        imageConfig: {
          aspectRatio: "1:1"
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
    throw new Error("AI gagal menggambar sketsa.");
  } catch (error: any) {
    console.error("Voice-to-Sketch Error:", error);
    throw new Error("Gagal membuat sketsa otomatis.");
  }
};

export const transformSketch = async (
  base64Image: string,
  style: StyleType,
  category: CategoryType,
  promptExtra: string = "",
  aspectRatio: string = "1:1"
): Promise<string> => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) throw new Error("API Key tidak terdeteksi.");

  const ai = aiInstance();
  
  const match = base64Image.match(/^data:(.+);base64,(.+)$/);
  const mimeType = match ? match[1] : 'image/png';
  const base64Data = match ? match[2] : base64Image.split(',')[1];
  
  const prompt = `Advanced Image Transformation from Sketch.
    Target Object: ${category}.
    Style: ${style}. 
    Details: ${promptExtra || '8k resolution, cinematic lighting, masterpiece.'}
    
    STRICT COMPLIANCE RULES:
    1. POSE & STRUCTURE: You MUST strictly follow the anatomical structure, pose, and silhouette of the input sketch.
    2. CHARACTER IDENTITY: If this is a character, the facial structure and proportions from the sketch are the absolute ground truth. Do not invent new poses.
    3. TEXTURE: Replace pencil lines with photorealistic ${style} materials (skin, metal, cloth, etc.).
    4. BACKGROUND: Integrate the subject into a fitting environment based on the style.`;

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

    throw new Error(`Gagal memproses gambar.`);
  } catch (error: any) {
    console.error(`Gemini API Error:`, error);
    throw new Error("Gagal memproses sketsa ke hasil final.");
  }
};
