import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { SSEClientTransport } from "@modelcontextprotocol/sdk/client/sse.js";
import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";
import readline from "readline";
import EventSource from "eventsource";

// Polyfill EventSource for Node.js
global.EventSource = EventSource as any;

dotenv.config();

const API_KEY = process.env.GEMINI_API_KEY;
if (!API_KEY) {
  console.error("Error: GEMINI_API_KEY is not set in .env file");
  process.exit(1);
}

const genAI = new GoogleGenerativeAI(API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

async function main() {
  const transport = new SSEClientTransport(
    new URL(process.env.MCP_SERVER_URL!)
  );

  const client = new Client(
    {
      name: "mcp-client",
      version: "1.0.0",
    },
    {
      capabilities: {},
    }
  );

  console.log("Connecting to MCP server...");
  try {
    await client.connect(transport);
    console.log("Connected to MCP server");
  } catch (error) {
    console.error("Failed to connect to MCP server:", error);
    process.exit(1);
  }

  // List available tools
  const tools = await client.listTools();
  console.log("Available tools:", tools.tools.map((t) => t.name).join(", "));

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const chat = model.startChat({
    history: [
      {
        role: "user",
        parts: [{ text: `You are an AI assistant interacting with an MCP server. 
Here are the available tools: ${JSON.stringify(tools.tools)}
When a user asks you to do something that requires a tool, respond with a JSON object in this format:
{ "tool": "tool_name", "arguments": { ... } }
If no tool is needed, just respond with the answer.
If you need to call multiple tools or chaining one after another, do it one by one.
` }],
      },
      {
        role: "model",
        parts: [{ text: "Understood. I am ready to assist using the available tools." }],
      },
    ],
  });

  const processInput = async () => {
    rl.question("\nYou: ", async (input) => {
      if (input.toLowerCase() === "exit") {
        rl.close();
        process.exit(0);
      }

      try {
        const result = await chat.sendMessage(input);
        const responseText = result.response.text();
        
        let toolCall;
        try {
            // Attempt to find JSON in the response
            const jsonMatch = responseText.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                toolCall = JSON.parse(jsonMatch[0]);
            }
        } catch (e) {
            // Not a JSON response
        }

        if (toolCall && toolCall.tool) {
            console.log(`\nCalling tool: ${toolCall.tool}`);
            try {
                const toolResult = await client.callTool({
                    name: toolCall.tool,
                    arguments: toolCall.arguments,
                });
                console.log("Tool Result:", JSON.stringify(toolResult, null, 2));

                // Feed result back to Gemini
                const followUp = await chat.sendMessage(`Tool '${toolCall.tool}' returned: ${JSON.stringify(toolResult)}`);
                console.log("\nGemini:", followUp.response.text());
            } catch (err: any) {
                console.error("Tool execution failed:", err.message);
                const errorResponse = await chat.sendMessage(`Tool execution failed: ${err.message}`);
                console.log("\nGemini:", errorResponse.response.text());
            }

        } else {
            console.log("\nGemini:", responseText);
        }

      } catch (error: any) {
        console.error("Error during interaction:", error.message);
      }

      processInput();
    });
  };

  processInput();
}

main().catch(console.error);
