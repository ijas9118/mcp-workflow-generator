import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { convertFormat } from "../utils/workflowUtils.js";

export function registerExportTool(server: McpServer) {
  server.registerTool(
    "export_to_format",
    {
      description: "Exports a workflow from one format to another",
      inputSchema: {
        source_content: z.string().describe("Source workflow definition"),
        source_format: z
          .enum(["mermaid", "bpmn", "json", "yaml"])
          .describe("Source format"),
        target_format: z
          .enum(["mermaid", "bpmn", "json", "yaml"])
          .describe("Target format"),
      },
    },

    async ({ source_content, source_format, target_format }) => {
      const transformedContent = convertFormat(source_content, source_format, target_format);

      return {
        content: [
          {
            type: "text",
            text: transformedContent,
          },
        ],
      };
    },
  );
}
