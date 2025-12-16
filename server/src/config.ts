import dotenv from "dotenv";

dotenv.config();

export const config = {
  port: process.env.PORT ? parseInt(process.env.PORT) : 3000,
  domainConfigPath: process.env.DOMAIN_CONFIG_PATH || "./config/default.json",
  geminiApiKey: process.env.GEMINI_API_KEY,
  supportedFormats: ["mermaid", "bpmn", "json", "yaml"],
};

