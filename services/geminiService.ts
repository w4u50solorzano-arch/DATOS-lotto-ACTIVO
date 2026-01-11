
import { GoogleGenAI } from "@google/genai";
import { SYSTEM_PROMPT } from "../constants";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const startChatSession = () => {
  return ai.chats.create({
    model: 'gemini-3-flash-preview',
    config: {
      systemInstruction: SYSTEM_PROMPT,
      temperature: 0.9,
    },
  });
};

export const getQuickMotivation = async (): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: "Dame una frase corta y potente de 10 palabras para motivarme a ganar puntos.",
      config: {
        systemInstruction: SYSTEM_PROMPT,
      },
    });
    return response.text || "¡El éxito es para los que no se detienen!";
  } catch (error) {
    return "¡Tú tienes el poder de llegar a la cima!";
  }
};
