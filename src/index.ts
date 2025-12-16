import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import express from "express";
import { registerTools } from "./tools/index.js";
import { registerResources } from "./resources/index.js";
import { config } from "./config.js";

// Create an MCP server instance
const server = new McpServer({
  name: "Workflow Blueprint Generator",
  version: "1.0.0",
});

// Register tools
registerTools(server);
registerResources(server);

// Start the server
async function main() {
  const transportType = process.env.TRANSPORT || "stdio";

  if (transportType === "sse") {
    const app = express();
    const port = config.port;

    // Single-client SSE implementation for Inspector/Docker usage
    // Note: robust multi-client support requires session management
    let transport: SSEServerTransport | null = null;

    app.get("/sse", async (req, res) => {
      console.log("New SSE connection established");
      transport = new SSEServerTransport("/messages", res);
      await server.connect(transport);
    });

    app.post("/messages", async (req, res) => {
      if (transport) {
        await transport.handlePostMessage(req, res);
      } else {
        res.status(400).send("No active transport");
      }
    });

    app.listen(port, () => {
      console.error(`Workflow Blueprint Generator MCP Server running on SSE at http://localhost:${port}/sse`);
    });

  } else {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("Workflow Blueprint Generator MCP Server running on stdio");
  }
}

main().catch((error) => {
  console.error("Fatal error in main():", error);
  process.exit(1);
});
