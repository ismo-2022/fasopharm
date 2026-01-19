
import { GoogleGenAI, Type } from "@google/genai";
import { PrescriptionAnalysis, Drug } from "../types";

// The API key must be obtained exclusively from the environment variable process.env.API_KEY.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Using gemini-3-flash-preview for general text tasks and gemini-3-pro-preview for complex reasoning if needed.
const MODEL_TEXT = 'gemini-3-flash-preview';
const MODEL_VISION = 'gemini-3-flash-preview';

// Chat Assistant
export const getChatResponse = async (history: string[], newMessage: string, pharmacyContext: string): Promise<string> => {
  try {
    const systemInstruction = `Vous êtes "Fasopharm AI", l'assistant intelligent de la pharmacie Fasopharm au Burkina Faso.
    
    VOICI LES DONNÉES EN TEMPS RÉEL DE LA PHARMACIE (Format JSON) :
    ${pharmacyContext}

    VOTRE MISSION :
    1. Utilisez ces données pour répondre précisément aux questions sur :
       - Les stocks disponibles (quantités, prix, emplacement/catégorie).
       - Les dates de péremption des produits.
       - Les fournisseurs (coordonnées).
       - Les assurances partenaires (taux de couverture).
       - L'historique récent des ventes.
    2. Si un produit est demandé et qu'il est en stock faible (<20), signalez-le.
    3. Si on vous demande un avis médical, donnez des conseils généraux mais rappelez que le pharmacien décide.

    RÈGLES DE SÉCURITÉ STRICTES (PRIVACY) :
    - Vous n'avez AUCUN accès aux données des utilisateurs (mots de passe, comptes admin/agent).
    - Si l'utilisateur demande des informations sur les comptes, les mots de passe ou les administrateurs, répondez FERMEMENT : "Je n'ai pas accès aux informations confidentielles des utilisateurs."
    
    Répondez toujours en français, de manière professionnelle et concise.`;

    // Always use ai.models.generateContent to query GenAI with both the model name and prompt.
    // Use .text property on GenerateContentResponse object.
    const response = await ai.models.generateContent({
      model: MODEL_TEXT,
      contents: [
        ...history.map((msg, index) => ({
          role: index % 2 === 0 ? 'user' : 'model',
          parts: [{ text: msg }],
        })),
        { role: 'user', parts: [{ text: newMessage }] }
      ],
      config: {
        systemInstruction: systemInstruction,
      }
    });

    return response.text || "Désolé, je n'ai pas pu générer de réponse.";
  } catch (error) {
    console.error("Gemini Chat Error:", error);
    return "Erreur de connexion au service IA.";
  }
};

// Prescription Scanner
export const analyzePrescriptionImage = async (base64Image: string): Promise<PrescriptionAnalysis | null> => {
  try {
    // Clean the base64 string if it contains the header
    const cleanBase64 = base64Image.replace(/^data:image\/(png|jpeg|jpg);base64,/, "");

    const response = await ai.models.generateContent({
      model: MODEL_VISION,
      contents: {
        parts: [
          {
            inlineData: {
              data: cleanBase64,
              mimeType: 'image/jpeg', 
            },
          },
          {
            text: `Analyse cette ordonnance médicale. Extrais la liste des médicaments prescrits avec leurs dosages si visibles.
            Retourne le résultat STRICTEMENT au format JSON suivant :
            {
              "medications": [
                { "name": "Nom du médicament", "dosage": "Dosage", "instructions": "Instructions si visibles" }
              ],
              "notes": "Toute remarque pertinente sur la lisibilité ou des interactions potentielles évidentes."
            }`
          },
        ],
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            medications: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  dosage: { type: Type.STRING },
                  instructions: { type: Type.STRING }
                }
              }
            },
            notes: { type: Type.STRING }
          }
        }
      }
    });

    const jsonText = response.text;
    if (!jsonText) return null;
    return JSON.parse(jsonText.trim()) as PrescriptionAnalysis;

  } catch (error) {
    console.error("Gemini Vision Error:", error);
    return null;
  }
};

// Product Box Scanner (For Inventory)
export const analyzeMedicineBox = async (base64Image: string): Promise<Partial<Drug> | null> => {
  try {
    const cleanBase64 = base64Image.replace(/^data:image\/(png|jpeg|jpg);base64,/, "");

    const response = await ai.models.generateContent({
      model: MODEL_VISION,
      contents: {
        parts: [
          {
            inlineData: {
              data: cleanBase64,
              mimeType: 'image/jpeg',
            },
          },
          {
            text: `Analyse cette photo d'une boîte de médicament. Extrais les informations pour l'inventaire.
            Déduis la catégorie (ex: Antibiotique, Douleur, Vitamine, etc.).
            Extrais le nom, le dosage, et une courte description.
            Retourne le résultat STRICTEMENT au format JSON.`
          },
        ],
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            description: { type: Type.STRING },
            category: { type: Type.STRING },
            dosage: { type: Type.STRING }
          }
        }
      }
    });

    const jsonText = response.text;
    if (!jsonText) return null;
    return JSON.parse(jsonText.trim()) as Partial<Drug>;

  } catch (error) {
    console.error("Gemini Box Scan Error:", error);
    return null;
  }
};

// Interaction Checker
export const checkDrugInteractions = async (drugNames: string[]): Promise<string> => {
  try {
    if (drugNames.length < 2) return "Veuillez sélectionner au moins deux médicaments pour vérifier les interactions.";

    const prompt = `Vérifie les interactions médicamenteuses potentielles entre les médicaments suivants : ${drugNames.join(', ')}.
    Sois bref et alerte sur les dangers majeurs (contre-indications absolues) et les précautions d'emploi.
    Formate la réponse avec des puces pour la lisibilité.`;

    const response = await ai.models.generateContent({
      model: MODEL_TEXT,
      contents: [{ parts: [{ text: prompt }] }],
    });

    return response.text || "Aucune information trouvée.";
  } catch (error) {
    console.error("Gemini Interaction Error:", error);
    return "Erreur lors de l'analyse des interactions.";
  }
};
