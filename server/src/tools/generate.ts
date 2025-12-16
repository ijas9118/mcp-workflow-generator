import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { parseDescription, convertFormat } from "../utils/workflowUtils.js";
import { config } from "../config.js";
import fs from "fs/promises";

import { generateWorkflowFromLLM } from "../services/geminiService.js";

export function registerGenerateTool(server: McpServer) {
  server.registerTool(
    "generate_workflow_spec",
    {
      title: "Generate Workflow",
      description:
        "Generates a structured workflow blueprint from a natural language description",
      annotations: {
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: false,
        readOnlyHint: true,
      },
      inputSchema: {
        description: z
          .string()
          .describe("Natural language description of the process"),
        format: z
          .enum(["mermaid", "bpmn", "json", "yaml"])
          .describe("Target output format"),
      },
    },
    async ({ description, format }) => {
      let domainConfig = {};
      try {
        const data = await fs.readFile(config.domainConfigPath, "utf-8");
        domainConfig = JSON.parse(data);
      } catch (e) {
          console.error("Failed to load domain config", e);
      }

      let workflow;
      try {
        if (config.geminiApiKey) {
           workflow = await generateWorkflowFromLLM(description);
        } else {
           console.warn("Gemini API Key not found, falling back to heuristic parser");
           workflow = parseDescription(description, domainConfig);
        }
      } catch (error) {
         console.error("LLM Generation failed, falling back to heuristic parser", error);
         workflow = parseDescription(description, domainConfig);
      }

      let content = "";
      if (format === "json") {
        content = JSON.stringify(workflow, null, 2);
      } else {
        content = convertFormat(workflow, "json", format);
      }

      return {
        content: [
          {
            type: "text",
            text: content,
          },
        ],
      };
    },
  );
}
