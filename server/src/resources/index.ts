import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerStepResources } from "./steps.js";
import { registerActorResources } from "./actors.js";
import { registerTemplateResources } from "./templates.js";

export function registerResources(server: McpServer) {
  registerStepResources(server);
  registerActorResources(server);
  registerTemplateResources(server);
}
