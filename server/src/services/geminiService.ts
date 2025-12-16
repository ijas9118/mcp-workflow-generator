import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import { config } from "../config.js";
import { Workflow } from "../utils/workflowUtils.js";

// Define schema explicitly for Gemini to avoid mismatch with standard JSON schema
const GEMINI_WORKFLOW_SCHEMA = {
  type: SchemaType.OBJECT,
  properties: {
    name: { type: SchemaType.STRING },
    description: { type: SchemaType.STRING },
    steps: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          id: { type: SchemaType.STRING },
          type: { 
            type: SchemaType.STRING, 
            enum: ["start", "end", "task", "gateway", "event", "kyc-check", "credit-score", "risk-assessment", "triage", "insurance-verify"] 
          },
          name: { type: SchemaType.STRING },
          next: {
            type: SchemaType.ARRAY,
            items: { type: SchemaType.STRING }
          }
        },
        required: ["id", "type"]
      }
    }
  },
  required: ["name", "steps"]
};

export async function generateWorkflowFromLLM(description: string): Promise<Workflow> {
  if (!config.geminiApiKey) {
    throw new Error("GEMINI_API_KEY is not configured");
  }

  const genAI = new GoogleGenerativeAI(config.geminiApiKey);
  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: GEMINI_WORKFLOW_SCHEMA as any,
    },
  });

  const prompt = `
    You are an expert business process analyst.
    Your task is to convert the following natural language description into a structured workflow specification.
    
    Description: "${description}"
    
    Ensure the workflow is logical, with a clear start and end.
    Use appropriate step types (task, gateway, event, etc.).
    Connect steps correctly using the 'next' array.
  `;

  try {
    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    
    if (!responseText) {
      throw new Error("Empty response from Gemini");
    }

    const workflow = JSON.parse(responseText) as Workflow;
    return workflow;
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw new Error("Failed to generate workflow from LLM");
  }
}
