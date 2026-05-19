# candela-cline

Cline plugin for [Candela](https://github.com/candelahq/candela) — LLM cost tracking, session attribution, and budget enforcement for Cline users.

[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](LICENSE)

---

## Quick Start: Provider Config (No Plugin Needed)

The fastest way to route Cline through Candela — just configure the provider:

1. Open Cline settings (gear icon in sidebar)
2. Select **"OpenAI Compatible"** as API Provider
3. Set **Base URL**: `http://localhost:8181/proxy/anthropic/v1`
4. Set **API Key**: `candela` (placeholder — Candela injects ADC credentials for Vertex AI)
5. Set **Model ID**: `claude-sonnet-4-20250514`

Every Cline request now routes through Candela with full observability.

### Provider URLs

| Provider | Base URL |
|----------|----------|
| Anthropic (via Vertex AI) | `http://localhost:8181/proxy/anthropic/v1` |
| Anthropic Vertex (native) | `http://localhost:8181/proxy/anthropic-vertex/v1` |
| Anthropic Direct | `http://localhost:8181/proxy/anthropic-direct/v1` |
| Anthropic (via AWS Bedrock) | `http://localhost:8181/proxy/anthropic-bedrock/v1` |
| OpenAI | `http://localhost:8181/proxy/openai/v1` |
| Gemini (OpenAI-compat) | `http://localhost:8181/proxy/gemini-oai/v1` |

---

## Plugin Features (Enhanced)

On top of provider routing, this plugin adds:

| Feature | Description |
|---------|-------------|
| **Session cost summary** | Token/cost breakdown for the current session |
| **Rich budget status** | Daily spend, active grants, reset countdowns, color-coded urgency |
| **Health check** | Verify Candela is reachable |

### Usage as Custom Tools

```typescript
import { getSessionSummary, getBudgetStatus, checkCandelaHealth } from "candela-cline";

// Get cost summary for the last hour
const summary = await getSessionSummary();
// 📊 Candela Session Summary (last 1h)
//    Tokens: 142.3K (98.2K in / 44.1K out)
//    Cost: $0.47 · Cache savings: $0.12
//    Requests: 12
//
//    Model breakdown:
//      claude-sonnet-4 (anthropic): 98.2K tokens, $0.31
//      gemini-2.5-pro (google): 44.1K tokens, $0.16

// Check budget (includes grants and reset countdown)
const budget = await getBudgetStatus();
// 💰 Candela Budget Status
//    [████████████████░░░░] 80%
//    Used: $40.00 of $50.00 daily limit
//    Active grants: +$10.00 (resets in 3d 14h)
//    Remaining (waterfall): $20.00
//    ⚠️ Budget is running low!

// Health check
const health = await checkCandelaHealth();
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

---

## Custom Headers

Add these headers for session attribution in Cline's OpenAI-compatible provider settings:

| Header | Value | Purpose |
|--------|-------|---------|
| `X-Session-Id` | Auto-generated UUID | Groups requests in Candela dashboard |
| `User-Agent` | `Cline/1.0` | Identifies traffic source |

---

## Prerequisites

1. **Candela running locally** — `candela start` (recommends [candela](https://github.com/candelahq/candela) v0.4.6+ for optimized performance; older versions supported via legacy fallback)
2. **Authentication** — run `candela auth login` once to set up Google OAuth credentials (no `gcloud` CLI required)

---

## Related

- [Candela](https://github.com/candelahq/candela) — OTel-native LLM observability platform
- [candela-desktop](https://github.com/candelahq/candela-desktop) — macOS desktop app
- [opencode-candela](https://github.com/candelahq/opencode-candela) — OpenCode plugin
- [candela-vscode](https://github.com/candelahq/candela-vscode) — VS Code extension

---

## License

Apache License 2.0. See [LICENSE](LICENSE) for details.
