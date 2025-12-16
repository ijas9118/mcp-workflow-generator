import { registerGenerateTool } from "./generate.js";
import { registerValidateTool } from "./validate.js";
import { registerExportTool } from "./export.js";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

export function registerTools(server: McpServer) {
  registerGenerateTool(server);
  registerValidateTool(server);
  registerExportTool(server);
  
  server.registerTool(
    "get_server_info",
    {
      description: "Returns information about this MCP server",
    },
    async () => {
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              name: "Workflow Blueprint Generator",
              version: "1.0.0",
              status: "Running",
            }, null, 2),
          },
        ],
      };
    }
  );
}
