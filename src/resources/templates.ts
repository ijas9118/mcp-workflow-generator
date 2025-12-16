
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { loadDomainConfig } from "./utils.js";

export function registerTemplateResources(server: McpServer) {
  // Expose connector templates
  server.registerResource(
    "templates",
    "workflow://templates/list",
    {
      title: "Workflow Templates",
      description: "Available workflow templates",
      mimeType: "application/json",
    },
    async (uri) => {
        const domainConfig = await loadDomainConfig();
        return {
            contents: [
                {
                    uri: uri.href,
                    text: JSON.stringify(domainConfig.templates || [], null, 2),
                    mimeType: "application/json"
                }
            ]
        };
    }
  );
}
