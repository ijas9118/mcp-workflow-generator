const { GoogleGenerativeAI } = require("@google/generative-ai");
const dotenv = require("dotenv");

dotenv.config();

async function main() {
  if (!process.env.GEMINI_API_KEY) {
    console.error("Please set GEMINI_API_KEY in .env");
    process.exit(1);
  }

  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  
  try {
      // This is not directly exposed on the client instance in some versions, 
      // but let's try to infer or just test a simple generation to 'gemini-2.5-flash' without schema
      // actually, the SDK doesn't have a simple listModels on the main class in Node? 
      // It does if we use the backend API directly, but via SDK...
      
      // Let's try to just generate text with gemini-2.5-flash-latest without schema to see if strict schema is the issue
      console.log("Testing simple text generation with gemini-2.5-flash...");
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
      const result = await model.generateContent("Hello");
      console.log("Response:", result.response.text());
      console.log("Success with gemini-2.5-flash!");
      
  } catch (error) {
    console.error("Simple generation failed:", error.message);
  }
}

main();
