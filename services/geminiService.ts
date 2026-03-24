
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Analyse les tendances de vente pour suggérer des optimisations de stock
 */
export const getBusinessIntelligence = async (salesContext: string, drugsContext: string) => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Analyse ces données de vente : ${salesContext} et ce stock : ${drugsContext}. 
      Identifie les 3 médicaments les plus vendus et ceux qui risquent une rupture. 
      Retourne un résumé exécutif court pour le pharmacien.`,
    });
    return response.text;
  } catch (error) {
    console.error("BI Error:", error);
    return "Analyse indisponible.";
  }
};

export const getChatResponse = async (history: any[], message: string, context: string) => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: message,
      config: {
        systemInstruction: `Tu es le cerveau de Fasopharm. 
        Données : ${context}. 
        Réponds de manière technique et précise. Aide pour les dosages, les prix ou les ruptures.`
      }
    });
    return response.text;
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Erreur système.";
  }
};

export const analyzePrescriptionImage = async (base64Image: string) => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [
        {
          inlineData: {
            mimeType: "image/jpeg",
            data: base64Image.split(',')[1]
          }
        },
        { text: "Analyse l'ordonnance. Retourne un JSON: { \"medications\": [{\"name\": \"\", \"dosage\": \"\", \"instructions\": \"\"}], \"notes\": \"\" }" }
      ],
      config: { responseMimeType: "application/json" }
    });
    return JSON.parse(response.text || "{}");
  } catch (error) {
    return null;
  }
};
