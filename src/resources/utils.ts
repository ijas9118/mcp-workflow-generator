
import { config } from "../config.js";
import fs from "fs/promises";

export async function loadDomainConfig() {
     try {
         const data = await fs.readFile(config.domainConfigPath, "utf-8");
         return JSON.parse(data);
     } catch (e) {
         console.error("Failed to load domain config, using fallback", e);
         return { stepTypes: [], actors: [], templates: [] };
     }
}
