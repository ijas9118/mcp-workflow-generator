
import { McpServer, ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";
import { loadDomainConfig } from "./utils.js";

export function registerStepResources(server: McpServer) {
  // Expose step types list
  server.registerResource(
    "step-types",
    "workflow://components/steps",
    {
      title: "Step Types",
      description: "Available workflow step types",
      mimeType: "application/json",
    },
    async (uri) => {
      const domainConfig = await loadDomainConfig();
      return {
        contents: [
          {
            uri: uri.href,
            text: JSON.stringify(domainConfig.stepTypes || [], null, 2),
            mimeType: "application/json",
          },
        ],
      };
    }
  );

  // Dynamic resource for specific step type details
  server.registerResource(
    "step-details",
    new ResourceTemplate("workflow://components/steps/{type}", { list: undefined }),
    {
       title: "Step Details",
       description: "Details for a specific step type",
       mimeType: "application/json"
    },
    async (uri: any, variables: any) => {
        const type = variables.type;
        const domainConfig = await loadDomainConfig();
        const step = domainConfig.stepTypes?.find((s: any) => s.type === type);

        if (!step) {
            throw new Error(`Step type '${type}' not found`);
        }

        return {
            contents: [
                {
                    uri: uri.href,
                    text: JSON.stringify(step, null, 2),
                    mimeType: "application/json"
                }
            ]
        };
    }
  );
}
