
import { GoogleGenAI, Type } from "@google/genai";
import { GeoLocation, SalonResult, ShoppingResult } from "../types";
import { SAFETY_INSTRUCTION } from "../constants";

// Helper to safely get the AI client or throw if key is missing
const getAiClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API_KEY is missing. Please set it in your environment variables.");
  }
  return new GoogleGenAI({ apiKey });
};

/**
 * Encodes a base64 string from a Blob/File
 */
export const fileToGenerativePart = async (file: File | Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      // Remove the data URL prefix (e.g., "data:image/jpeg;base64,")
      const base64Data = base64String.split(',')[1];
      resolve(base64Data);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

/**
 * Generates a new style (Hair or Fashion) based on the input image.
 */
export const generateStyleImage = async (
  base64Image: string,
  promptText: string,
  mimeType: string = 'image/jpeg'
): Promise<string> => {
  try {
    const ai = getAiClient();
    const fullPrompt = `${promptText}. ${SAFETY_INSTRUCTION}. High quality, photorealistic.`;
    
    // Using gemini-2.5-flash-image for image editing capabilities
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          {
            inlineData: {
              data: base64Image,
              mimeType: mimeType,
            },
          },
          {
            text: fullPrompt,
          },
        ],
      },
      // Note: responseMimeType is not supported for nano banana series (flash-image)
    });

    // Extract image from response
    if (response.candidates?.[0]?.content?.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData && part.inlineData.data) {
          return `data:image/png;base64,${part.inlineData.data}`;
        }
      }
    }
    
    throw new Error("No image generated.");
  } catch (error) {
    console.error("Error generating style:", error);
    throw error;
  }
};

/**
 * Finds nearby salons using Google Maps Grounding
 */
export const findNearbySalons = async (
  location: GeoLocation,
  hairStyleDescription: string
): Promise<SalonResult[]> => {
  try {
    const ai = getAiClient();
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Find 3 highly rated hair salons near me that specialize in ${hairStyleDescription}. Provide links.`,
      config: {
        tools: [{ googleMaps: {} }],
        toolConfig: {
          retrievalConfig: {
            latLng: {
              latitude: location.latitude,
              longitude: location.longitude
            }
          }
        }
      },
    });

    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    const results: SalonResult[] = [];

    if (chunks) {
      chunks.forEach((chunk) => {
        if (chunk.web?.uri && chunk.web?.title) {
             results.push({ title: chunk.web.title, uri: chunk.web.uri });
        }
        // Accessing maps specific structure if available, fallback to web
      });
    }

    return results;
  } catch (error) {
    console.error("Error finding salons:", error);
    return [];
  }
};

/**
 * Finds shopping links using Google Search Grounding
 */
export const findShoppingLinks = async (
  fashionDescription: string
): Promise<ShoppingResult[]> => {
  try {
    const ai = getAiClient();
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Find 3 online stores where I can buy a ${fashionDescription}. Provide direct product search links.`,
      config: {
        tools: [{ googleSearch: {} }],
      },
    });

    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    const results: ShoppingResult[] = [];

    if (chunks) {
      chunks.forEach((chunk) => {
        if (chunk.web?.uri && chunk.web?.title) {
          results.push({ title: chunk.web.title, uri: chunk.web.uri });
        }
      });
    }

    return results;
  } catch (error) {
    console.error("Error finding shopping links:", error);
    return [];
  }
};

/**
 * Generates more style suggestions when the user requests them
 */
export const getMoreStyleSuggestions = async (
  currentStyles: string[],
  type: 'hair' | 'fashion'
): Promise<string[]> => {
  try {
    const ai = getAiClient();
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Suggest 4 new, trendy, and distinct ${type} styles that are NOT in this list: ${currentStyles.join(', ')}. Return only the names.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.STRING
          }
        }
      }
    });

    const text = response.text;
    if (!text) return [];
    return JSON.parse(text) as string[];
  } catch (error) {
    console.error("Error getting suggestions:", error);
    return [];
  }
};
