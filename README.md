# candela-cline

Cline plugin for [Candela](https://github.com/candelahq/candela) — LLM cost tracking, session attribution, and budget enforcement.

[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](LICENSE)

## Quick Start: Provider Config (No Plugin Needed)

The fastest way to route Cline through Candela — just configure the provider:

1. Open Cline settings (gear icon in sidebar)
2. Select **"OpenAI Compatible"** as API Provider
3. Set **Base URL**: `http://localhost:8181/proxy/anthropic/v1`
4. Set **API Key**: `candela` (placeholder — Candela injects ADC for Vertex AI)
5. Set **Model ID**: `claude-sonnet-4-20250514`

That's it. Every Cline request now goes through Candela with full observability.

### Provider URLs

| Provider | Base URL |
|----------|----------|
| Anthropic (via Vertex AI) | `http://localhost:8181/proxy/anthropic/v1` |
| OpenAI | `http://localhost:8181/proxy/openai/v1` |
| Gemini | `http://localhost:8181/proxy/gemini-oai/v1` |

## Plugin Features (Enhanced)

On top of provider routing, this plugin adds:

| Feature | Description |
|---------|-------------|
| **Session cost summary** | Query Candela for token/cost breakdown |
| **Budget status** | Visual budget meter with warnings |
| **Health check** | Verify Candela is running |

### Usage as Custom Tools

Until Cline's plugin SDK stabilizes, use the exported functions as custom tools:

```typescript
import { getSessionSummary, getBudgetStatus, checkCandelaHealth } from "candela-cline";

// Get cost summary for the last hour
const summary = await getSessionSummary();
console.log(summary);
// 📊 Candela Session Summary (last 1h)
//    Tokens: 142.3K (98.2K in / 44.1K out)
//    Cost: $0.47
//    Requests: 12
//
//    Model breakdown:
//      claude-sonnet-4 (anthropic): 98.2K tokens, $0.31
//      gemini-2.5-pro (google): 44.1K tokens, $0.16

// Check budget
const budget = await getBudgetStatus();
console.log(budget);
// 💰 Candela Budget Status
//    [████████████████░░░░] 80%
//    Used: $40.00 of $50.00
//    Remaining: $10.00
//    ⚠️ Budget is running low!

// Health check
const health = await checkCandelaHealth();
console.log(health);
// ✅ Candela is running at http://localhost:8181
```

### Programmatic API

```typescript
import { initCandelaPlugin } from "candela-cline";

const candela = await initCandelaPlugin();

if (candela.alive) {
  console.log(await candela.summary());
  console.log(await candela.budget());
}
```

## Custom Headers

If using Cline's OpenAI-compatible provider settings, add these custom headers for session attribution:

| Header | Value | Purpose |
|--------|-------|---------|
| `X-Session-Id` | Auto-generated UUID | Groups requests in Candela dashboard |
| `User-Agent` | `Cline/1.0` | Identifies traffic source |

## Prerequisites

1. **Candela running locally**: `candela start` or `go run ./cmd/candela-server`
2. **GCP ADC** (for Anthropic): `gcloud auth application-default login`

## Related

- [Candela](https://github.com/candelahq/candela) — OTel-native LLM observability platform
- [opencode-candela](https://github.com/candelahq/opencode-candela) — OpenCode plugin
- [candela-vscode](https://github.com/candelahq/candela-vscode) — VS Code extension

## License

Apache License 2.0. See [LICENSE](LICENSE) for details.
