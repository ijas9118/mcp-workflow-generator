const { generateWorkflowFromLLM } = require('../dist/services/geminiService.js');
const dotenv = require('dotenv');

dotenv.config();

async function main() {
  if (!process.env.GEMINI_API_KEY) {
    console.error("Please set GEMINI_API_KEY in .env");
    process.exit(1);
  }

  const description = "A user applies for a job. HR reviews the resume. If approved, schedule interview. If rejected, send email.";
  
  console.log("Testing generation with description:", description);
  
  try {
    const workflow = await generateWorkflowFromLLM(description);
    console.log("Generated Workflow:");
    console.log(JSON.stringify(workflow, null, 2));
    
    if (workflow.steps && workflow.steps.length > 0) {
        console.log("SUCCESS: Workflow generated with steps.");
    } else {
        console.error("FAILURE: Workflow generated but has no steps.");
    }
  } catch (error) {
    console.error("FAILURE: Error generating workflow:", error);
  }
}

main();
