import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { validateContent } from "../utils/workflowUtils.js";

export function registerValidateTool(server: McpServer) {
  server.registerTool(
    "validate_workflow",
    {
      description:
        "Validates a workflow definition against the supported schemas",
      inputSchema: {
        workflow_content: z
          .string()
          .describe("The workflow definition to validate (JSON, YAML, etc.)"),
        format: z
          .enum(["mermaid", "bpmn", "json", "yaml"])
          .describe("The format of the workflow"),
      },
    },
    async ({ workflow_content, format }) => {
      let contentToValidate = workflow_content;
      try {
        if (format === "json") {
             contentToValidate = JSON.parse(workflow_content);
        }
      } catch (e) {
          return {
              content: [{ type: "text", text: JSON.stringify({ valid: false, errors: ["Invalid JSON format"]}) }]
          }
      }

      // Support validating JSON, BPMN, and YAML
      if (format === "json" || format === "bpmn" || format === "yaml") {
         const result = await validateContent(contentToValidate, format as "json" | "bpmn" | "yaml");
         return {
            content: [{ type: "text", text: JSON.stringify(result, null, 2) }]
         };
      }

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                valid: true,
                errors: [],
                note: `Validation for ${format} is not fully implemented, assuming valid.`
              },
              null,
              2,
            ),
          },
        ],
      };
    },
  );
}
