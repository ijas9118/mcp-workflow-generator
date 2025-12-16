import Ajv from "ajv";
import yaml from "js-yaml";
import { WORKFLOW_SCHEMA, BPMN_SCHEMA } from "../schemas.js";

const ajv = new Ajv({ strict: false }); // Relax strict mode for additional properties

export interface WorkflowStep {
  id: string;
  type: "start" | "end" | "task" | "gateway" | "event";
  name?: string;
  next?: string[];
}

export interface Workflow {
  name: string;
  description?: string;
  steps: WorkflowStep[];
}

export async function validateContent(
  content: any,
  schemaType: "json" | "bpmn" | "yaml"
): Promise<{ valid: boolean; errors?: string[] }> {
  try {
    // For YAML, we first parse it to JSON then validate against the workflow schema logic
    let contentToValidate = content;
    if (schemaType === "yaml" && typeof content === "string") {
        try {
            contentToValidate = yaml.load(content);
        } catch (e: any) {
             return { valid: false, errors: [`YAML Parse Error: ${e.message}`] };
        }
        // Validate against the JSON schema (assuming internal structure matches)
        schemaType = "json"; 
    }

    const schema = schemaType === "bpmn" ? BPMN_SCHEMA : WORKFLOW_SCHEMA;
    const validate = ajv.compile(schema);
    const valid = validate(contentToValidate);

    if (!valid) {
      return {
        valid: false,
        errors: validate.errors?.map((e) => e.message || "Unknown error"),
      };
    }

    return { valid: true };
  } catch (error: any) {
    return { valid: false, errors: [error.message] };
  }
}

export function parseDescription(description: string, domainConfig?: any): Workflow {
  // Simple heuristic parser for demonstration
  // uses domain config to match step types based on description keywords
  const steps: WorkflowStep[] = [];
  
  // Split by period, comma, or common transition words to better isolate steps
  const splitRegex = /[.,]|(\s+then\s+)|(\s+followed by\s+)|(\s+and\s+(?=then|finally|end))|(\s+next\s+)/i;
  // Basic cleaning of the input
  const rawSegments = description.split(splitRegex);
  
  const lines = rawSegments
    .map(s => s ? s.trim() : "")
    .filter(s => s.length > 5 && !s.toLowerCase().startsWith("user application process")); // Filter out noise phrases

  // Determine start step type if available in config
  const startType = domainConfig?.stepTypes?.find((s: any) => s.type === "start") ? "start" : "start";

  steps.push({ id: "start", type: startType as any, name: "Start", next: ["step-1"] });

  lines.forEach((line, index) => {
    const id = `step-${index + 1}`;
    const nextId = index < lines.length - 1 ? `step-${index + 2}` : "end_node";
    
    // Attempt to match line content to a known step type
    let stepType = "task";
    if (domainConfig?.stepTypes) {
        const input = line.toLowerCase();
        // Naive matching: check if step type or description is in the line
        const matched = domainConfig.stepTypes.find((s: any) => 
            s.type !== 'start' && s.type !== 'end' && 
            (input.includes(s.type.replace("-", " ").toLowerCase()) || 
             (s.description && input.includes(s.description.toLowerCase()))
            )
        );
        if (matched) {
            stepType = matched.type;
        }
    }

    steps.push({
      id,
      type: stepType as any,
      name: line,
      next: [nextId],
    });
  });

  const endType = domainConfig?.stepTypes?.find((s: any) => s.type === "end") ? "end" : "end";
  steps.push({ id: "end_node", type: endType as any, name: "End" });

  return {
    name: "Generated Workflow",
    description,
    steps,
  };
}

export function convertFormat(
  workflow: Workflow | any,
  sourceFormat: string,
  targetFormat: string
): string {
    // Input normalization
    let wfObj: any = workflow;
    if (typeof workflow === 'string') {
        if (sourceFormat === 'json') {
            try { wfObj = JSON.parse(workflow); } catch {}
        } else if (sourceFormat === 'yaml') {
            try { wfObj = yaml.load(workflow); } catch {}
        } else if (sourceFormat === 'mermaid') {
             wfObj = parseMermaidToWorkflow(workflow);
        }
    }

    // Target conversion
    if (targetFormat === "mermaid") {
         // Convert internal JSON structure to Mermaid
         const w = wfObj as Workflow;
         // Basic check if it looks like our workflow
         if (!w.steps) return "Invalid workflow structure for Mermaid conversion";

         // Create a mapping for safe IDs
         const idMap = new Map<string, string>();
         w.steps.forEach(s => {
             // Handle reserved keywords in Mermaid
             const safeId = s.id === 'end' ? 'end_node' : s.id;
             idMap.set(s.id, safeId);
         });

         let m = "graph TD\n";
         w.steps.forEach(s => {
             // Node definition
             const safeId = idMap.get(s.id) || s.id;
             const label = (s.name || s.type).replace(/["()]/g, '');
             const shapeStart = s.type === 'start' || s.type === 'end' ? '([' : (s.type === 'gateway' ? '{' : '[');
             const shapeEnd = s.type === 'start' || s.type === 'end' ? '])' : (s.type === 'gateway' ? '}' : ']');
             m += `  ${safeId}${shapeStart}${label}${shapeEnd}\n`;
             
             if (s.next) {
                 s.next.forEach(n => {
                     const safeNext = idMap.get(n) || (n === 'end' ? 'end_node' : n);
                     m += `  ${safeId} --> ${safeNext}\n`;
                 });
             }
         });
         return m;
    }

    if (targetFormat === "json") {
         return JSON.stringify(wfObj, null, 2);
    }
    
    if (targetFormat === "yaml") {
        return yaml.dump(wfObj);
    }

    if (targetFormat === "bpmn") {
        return generateBPMN(wfObj as Workflow);
    }

  return `Conversion from ${sourceFormat} to ${targetFormat} not fully implemented.`;
}

function parseMermaidToWorkflow(mermaid: string): Workflow {
    // Very basic parsing for demo purposes
    // Extracts "A[Label] --> B"
    const steps: WorkflowStep[] = [];
    const lines = mermaid.split('\n');
    const connections: {from: string, to: string}[] = [];
    
    lines.forEach(line => {
        const trimmed = line.trim();
        if (trimmed.startsWith('graph') || trimmed.length === 0) return;

        // Match node definitions: ID[Label] or ID{Label} or ID([Label])
        // We look for the ID at the start
        const nodeMatch = trimmed.match(/^([a-zA-Z0-9_\-]+)\s*(?:(\[|\{|\(\[|\[\[)(.*?)(?:\]|\}|\)\]|\]\]))?/);
        if (nodeMatch) {
            const id = nodeMatch[1];
            const label = nodeMatch[3] || id;
            let type: any = 'task';
            if (nodeMatch[2]?.includes('{')) type = 'gateway';
            if (nodeMatch[2]?.includes('([')) type = 'start'; // or end, simplistic
            
            if (!steps.find(s => s.id === id)) {
                steps.push({ id, name: label, type });
            }
        }

        // Match connections: A --> B or A -->|Label| B
        if (trimmed.includes('-->')) {
            const parts = trimmed.split('-->');
            const fromPart = parts[0].trim();
            const toPart = parts[1].trim();
            
            // Extract IDs from complex strings if needed, for now assume ID is at start
            const fromId = fromPart.split(/[^a-zA-Z0-9_\-]/)[0];
            // To ID might have label or be simple
            // We need to parse valid ID from 'toPart'. 
            // If toPart is "|Label| B", split by |
            let toId = toPart;
            if (toPart.startsWith('|')) {
                const pipeParts = toPart.split('|');
                if (pipeParts.length > 2) {
                    toId = pipeParts[2].trim().split(/[^a-zA-Z0-9_\-]/)[0];
                }
            } else {
                toId = toPart.split(/[^a-zA-Z0-9_\-]/)[0];
            }

            if (fromId && toId) {
                connections.push({ from: fromId, to: toId });
            }
        }
    });

    // Populate next pointers
    connections.forEach(conn => {
        const step = steps.find(s => s.id === conn.from);
        if (step) {
            if (!step.next) step.next = [];
            step.next.push(conn.to);
        }
        // Ensure destination exists if implicitly defined
         if (!steps.find(s => s.id === conn.to)) {
             steps.push({ id: conn.to, name: conn.to, type: 'task' });
        }
    });
    
    // Attempt to distinguish end events (no outgoing connections)
    steps.forEach(s => {
        if (!s.next || s.next.length === 0) {
            s.type = 'end';
        }
    });

    return { name: "Imported from Mermaid", steps };
}

function generateBPMN(workflow: Workflow): string {
    const processId = "Process_" + Math.random().toString(36).substr(2, 9);
    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL" xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI" xmlns:dc="http://www.omg.org/spec/DD/20100524/DC" id="Definitions_1" targetNamespace="http://bpmn.io/schema/bpmn">
  <bpmn:process id="${processId}" isExecutable="false">\n`;

    workflow.steps.forEach(step => {
        const tag = step.type === 'start' ? 'bpmn:startEvent' : 
                    step.type === 'end' ? 'bpmn:endEvent' : 
                    step.type === 'gateway' ? 'bpmn:exclusiveGateway' : 'bpmn:task';
        
        xml += `    <${tag} id="${step.id}" name="${step.name}">\n`;
        if (step.next) {
            step.next.forEach(n => {
                xml += `      <bpmn:outgoing>Flow_${step.id}_${n}</bpmn:outgoing>\n`;
            });
        }
        // Incoming? BPMN requires incoming refs too ideally, but for visualization tools, outgoing often suffices or they auto-layout.
        // But strictly, we need sequence flows defined separately.
        xml += `    </${tag}>\n`;
    });

    // Sequence Flows
    workflow.steps.forEach(step => {
        if (step.next) {
            step.next.forEach(n => {
                xml += `    <bpmn:sequenceFlow id="Flow_${step.id}_${n}" sourceRef="${step.id}" targetRef="${n}" />\n`;
            });
        }
    });

    xml += `  </bpmn:process>
  <bpmndi:BPMNDiagram id="BPMNDiagram_1">
    <bpmndi:BPMNPlane id="BPMNPlane_1" bpmnElement="${processId}">
      <!-- Diagram layouting omitted for brevity -->
    </bpmndi:BPMNPlane>
  </bpmndi:BPMNDiagram>
</bpmn:definitions>`;

    return xml;
}
