import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { SSEClientTransport } from "@modelcontextprotocol/sdk/client/sse.js";
import dotenv from "dotenv";
import EventSource from "eventsource";

// Polyfill EventSource for Node.js
global.EventSource = EventSource as any;

dotenv.config();

async function testMCPServer() {
  const transport = new SSEClientTransport(
    new URL(process.env.MCP_SERVER_URL!)
  );

  const client = new Client(
    {
      name: "mcp-test-client",
      version: "1.0.0",
    },
    {
      capabilities: {},
    }
  );

  console.log("🔌 Connecting to MCP server...");
  try {
    await client.connect(transport);
    console.log("✅ Connected to MCP server\n");
  } catch (error) {
    console.error("❌ Failed to connect to MCP server:", error);
    process.exit(1);
  }

  // Test 1: List available tools
  console.log("📋 Test 1: Listing available tools");
  const tools = await client.listTools();
  console.log(`Found ${tools.tools.length} tools:`);
  tools.tools.forEach((tool, idx) => {
    console.log(`  ${idx + 1}. ${tool.name}: ${tool.description}`);
  });
  console.log();

  // Test 2: List available resources
  console.log("📦 Test 2: Listing available resources");
  try {
    const resources = await client.listResources();
    console.log(`Found ${resources.resources.length} resources:`);
    resources.resources.forEach((resource, idx) => {
      console.log(`  ${idx + 1}. ${resource.name}: ${resource.description}`);
    });
  } catch (error: any) {
    console.log(`  ⚠️  Resources not available: ${error.message}`);
  }
  console.log();

  // Test 3: Call generate_workflow_spec tool
  console.log("🔧 Test 3: Calling generate_workflow_spec tool");
  try {
    const result = await client.callTool({
      name: "generate_workflow_spec",
      arguments: {
        description: "A simple user authentication workflow with login and logout",
        domain: "default",
        format: "json"
      },
    });
    console.log("✅ Tool call successful!");
    console.log("Response:", JSON.stringify(result, null, 2));
  } catch (error: any) {
    console.error("❌ Tool call failed:", error.message);
  }
  console.log();

  // Test 4: Call validate_workflow tool
  console.log("🔧 Test 4: Calling validate_workflow tool");
  try {
    const testWorkflow = {
      name: "Test Workflow",
      steps: [
        { id: "step1", name: "Start", type: "start" },
        { id: "step2", name: "End", type: "end" }
      ],
      transitions: [
        { from: "step1", to: "step2" }
      ]
    };
    
    const result = await client.callTool({
      name: "validate_workflow",
      arguments: {
        workflow_content: JSON.stringify(testWorkflow),
        format: "json"
      },
    });
    console.log("✅ Tool call successful!");
    console.log("Response:", JSON.stringify(result, null, 2));
  } catch (error: any) {
    console.error("❌ Tool call failed:", error.message);
  }
  console.log();

  // Test 5: Call get_server_info tool
  console.log("🔧 Test 5: Calling get_server_info tool");
  try {
    const result = await client.callTool({
      name: "get_server_info",
      arguments: {},
    });
    console.log("✅ Tool call successful!");
    console.log("Response:", JSON.stringify(result, null, 2));
  } catch (error: any) {
    console.error("❌ Tool call failed:", error.message);
  }
  console.log();

  console.log("🎉 All tests completed!");
  process.exit(0);
}

testMCPServer().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
