
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { loadDomainConfig } from "./utils.js";

export function registerActorResources(server: McpServer) {
  // Expose actors/roles
  server.registerResource(
    "actors",
    "workflow://components/actors",
    {
      title: "Workflow Actors",
      description: "Available workflow actors/roles",
      mimeType: "application/json",
    },
    async (uri) => {
      const domainConfig = await loadDomainConfig();
      return {
        contents: [
            {
                uri: uri.href,
                text: JSON.stringify(domainConfig.actors || [], null, 2),
                mimeType: "application/json"
            }
        ]
      };
    }
  );
}
