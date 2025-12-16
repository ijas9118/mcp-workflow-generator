
export const WORKFLOW_SCHEMA = {
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "Workflow",
  "type": "object",
  "properties": {
    "name": {
      "type": "string"
    },
    "description": {
      "type": "string"
    },
    "steps": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "id": {
            "type": "string"
          },
          "type": {
            "type": "string",
            "enum": ["start", "end", "task", "gateway", "event", "kyc-check", "credit-score", "risk-assessment", "triage", "insurance-verify"] 
          },
          "name": {
            "type": "string"
          },
          "next": {
            "type": "array",
            "items": {
              "type": "string"
            }
          }
        },
        "required": ["id", "type"]
      }
    }
  },
  "required": ["name", "steps"]
};

export const BPMN_SCHEMA = {
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "BPMN Process",
  "type": "object",
  "properties": {
    "definitions": {
      "type": "object",
      "properties": {
        "process": {
          "type": "object",
          "properties": {
            "id": { "type": "string" },
            "name": { "type": "string" },
            "isExecutable": { "type": "boolean" },
            "flowElements": {
              "type": "array",
              "items": {
                "type": "object",
                "properties": {
                  "id": { "type": "string" },
                  "name": { "type": "string" },
                  "type": { "type": "string" },
                  "incoming": { "type": "array", "items": { "type": "string" } },
                  "outgoing": { "type": "array", "items": { "type": "string" } }
                },
                "required": ["id", "type"]
              }
            }
          },
          "required": ["id", "isExecutable"]
        }
      }
    }
  }
};
