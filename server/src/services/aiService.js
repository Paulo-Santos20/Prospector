import Groq from "groq-sdk";
import dotenv from 'dotenv';

dotenv.config();
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export const analyzeLeadWithAI = async (htmlContent, businessName) => {
  if (!process.env.GROQ_API_KEY) return null;

  try {
    const cleanContent = htmlContent
      .replace(/<script\b[^>]*>([\s\S]*?)<\/script>/gim, "")
      .replace(/<style\b[^>]*>([\s\S]*?)<\/style>/gim, "")
      .replace(/<[^>]*>?/gm, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .substring(0, 7000);

    const chatCompletion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: `Você é um Brand Designer e Senior UX Auditor.
          Analise a empresa. Se o conteúdo for vazio, foque no nome e nicho para criar uma identidade visual do zero.
          STATUS DO SITE: Se a URL for de rede social (Instagram/FB), ignore-a como site e foque na necessidade de um domínio próprio.
          
          Retorne este JSON:
          { 
            "ownerName": "string", 
            "mainPainPoint": "Foque na falha de conversão ou ausência de site", 
            "featuredItem": "O que eles fazem de melhor",
            "designStrategy": {
              "style": "Minimalista, Industrial, Luxo, etc",
              "primaryColor": "#hex",
              "secondaryColor": "#hex",
              "typography": { "heading": "Fonte", "body": "Fonte" },
              "designReasoning": "Por que essa identidade venderia mais?",
              "referenceSite": "URL de inspiração (Behance/Awwwards)"
            }
          }`
        },
        { role: "user", content: `Empresa: ${businessName}\nConteúdo: ${cleanContent || 'Sem site encontrado'}` }
      ],
      model: "llama-3.3-70b-versatile",
      response_format: { type: "json_object" },
      temperature: 0.6,
    });

    return JSON.parse(chatCompletion.choices[0].message.content);
  } catch (error) {
    return null;
  }
};