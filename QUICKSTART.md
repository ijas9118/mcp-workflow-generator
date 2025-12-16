# MCP Workflow Generator - Quick Start

## Server Setup (5 minutes)

### 1. Configure Environment
```bash
cd server/
```

Create `.env` file:
```env
DOMAIN_CONFIG_PATH=config/healthcare.json
GEMINI_API_KEY=your_api_key_here
```

### 2. Start Server
```bash
npm run build
docker compose up -d --build
```

Server URL: `http://localhost:3000`

---

## Client Setup (2 minutes)

### 1. Configure Environment
```bash
cd client/
```

Create `.env` file:
```env
GEMINI_API_KEY=your_api_key_here
MCP_SERVER_URL=http://localhost:3000/sse
```

### 2. Start Client
```bash
npm run build && npm start
```

---

## Try These Prompts

**Healthcare workflows:**
- `Generate a patient admission workflow`
- `Create an emergency room triage process`
- `Build a prescription refill workflow`

**E-commerce workflows:**
- `Generate a checkout workflow`
- `Create an order fulfillment process`

**Generic workflows:**
- `Generate a user authentication workflow`
- `Create an approval workflow with multiple reviewers`

**Utilities:**
- `What tools are available?`
- `Get server info`
- `Export the workflow to Mermaid format`
- `Validate this workflow`

---

## Stop Everything

**Client:** Type `exit` or press `Ctrl+C`

**Server:**
```bash
cd server/
docker compose down
```

---

## Need Help?

See [README.md](./README.md) for full documentation.
