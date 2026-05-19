/**
 * candela-cline — Cline plugin for Candela LLM observability.
 *
 * Integrates Candela's cost tracking, budget enforcement, and session
 * attribution into the Cline AI coding assistant.
 *
 * ## Integration Approach
 *
 * Cline supports Candela in two complementary ways:
 *
 * 1. **Provider config** (no plugin needed): Select "OpenAI Compatible"
 *    in Cline settings and point Base URL at Candela's proxy.
 *
 * 2. **This plugin** (enhanced): Adds session tracking, cost output,
 *    and budget warnings on top of the provider config.
 *
 * ## How Cline Plugins Work
 *
 * Cline's plugin system uses `@cline/sdk`. Plugins can:
 * - Register custom providers via `registerHandler`
 * - Add domain-specific tools
 * - Hook into lifecycle events
 *
 * This plugin primarily focuses on lifecycle hooks for observability,
 * since Candela's proxy already works as an OpenAI-compatible provider.
 */

import { CandelaClient } from "./candela-client.js";
import type { BudgetInfo, GrantInfo } from "./candela-client.js";
import { discoverCandelaUrl } from "./discover.js";

/** Format USD with appropriate precision */
function formatCost(usd: number): string {
  if (usd < 0.01) return `$${usd.toFixed(4)}`;
  if (usd < 1) return `$${usd.toFixed(3)}`;
  return `$${usd.toFixed(2)}`;
}

/** Format token count with K/M suffixes */
function formatTokens(count: number): string {
  if (count >= 1_000_000) return `${(count / 1_000_000).toFixed(1)}M`;
  if (count >= 1_000) return `${(count / 1_000).toFixed(1)}K`;
  return String(count);
}

/**
 * Candela plugin for Cline.
 *
 * Since Cline's plugin SDK is still evolving, this module exports
 * both:
 * - A plugin initializer for the `@cline/sdk` plugin system
 * - Standalone utility functions that can be used from custom tools
 *   or external scripts
 */

/** Standalone: Get a cost summary string for the current session */
export async function getSessionSummary(
  baseUrl = discoverCandelaUrl(),
  hours = 1
): Promise<string> {
  const client = new CandelaClient(baseUrl);
  const data = await client.getDashboardData(hours);
  if (!data || data.usage.requestCount === 0) {
    return "No LLM usage recorded in the last hour.";
  }

  const usage = data.usage;
  const modelLines = data.models
    .slice(0, 5)
    .map(
      (m) =>
        `  ${m.model} (${m.provider}): ${formatTokens(m.totalTokens)} tokens, ${formatCost(m.totalCostUsd)}`
    )
    .join("\n");

  const lines = [
    `📊 Candela Session Summary (last ${hours}h)`,
    `   Tokens: ${formatTokens(usage.totalTokens)} (${formatTokens(usage.inputTokens)} in / ${formatTokens(usage.outputTokens)} out)`,
    `   Cost: ${formatCost(usage.totalCostUsd)}`,
    `   Requests: ${usage.requestCount}`,
    modelLines ? `\n   Model breakdown:\n${modelLines}` : "",
  ];

  // Budget footer
  if (data.budget) {
    const b = data.budget;
    lines.push(
      `\n   💰 Budget: ${formatCost(b.remainingUsd)} remaining of ${formatCost(b.limitUsd)} (${b.percentUsed.toFixed(0)}% used${b.resetLabel ? `, ${b.resetLabel}` : ""})`
    );
  }

  return lines.filter(Boolean).join("\n");
}

/** Standalone: Get budget status string with grants */
export async function getBudgetStatus(
  baseUrl = discoverCandelaUrl()
): Promise<string> {
  const client = new CandelaClient(baseUrl);
  const data = await client.getDashboardData(24);
  if (!data?.budget) {
    return "Budget information unavailable (Candela may not be running or no budget is configured).";
  }

  const b = data.budget;
  const bar =
    "█".repeat(Math.floor(b.percentUsed / 5)) +
    "░".repeat(20 - Math.floor(b.percentUsed / 5));

  const lines = [
    `💰 Candela Budget Status`,
    `   Daily:  [${bar}] ${b.percentUsed.toFixed(0)}%  ${formatCost(b.spentUsd)} / ${formatCost(b.limitUsd)}${b.resetLabel ? ` (${b.resetLabel})` : ""}`,
  ];

  // Active grants
  for (const g of data.activeGrants) {
    if (g.isExhausted) continue;
    const expiryNote = g.expiresAt
      ? ` (expires ${g.expiresAt.toLocaleDateString("en-US", { month: "short", day: "numeric" })})`
      : "";
    lines.push(
      `   🎁 Grant: ${formatCost(g.remainingUsd)} / ${formatCost(g.amountUsd)} — ${g.reason || "Bonus"}${expiryNote}`
    );
  }

  // Total
  if (data.totalRemainingUsd !== null) {
    lines.push(`   Total available: ${formatCost(data.totalRemainingUsd)}`);
  }

  if (b.isNearLimit) {
    lines.push(`   ⚠️ Budget is running low!`);
  }

  return lines.join("\n");
}

/** Standalone: Check if Candela is alive */
export async function checkCandelaHealth(
  baseUrl = discoverCandelaUrl()
): Promise<string> {
  const client = new CandelaClient(baseUrl);
  const alive = await client.isAlive();
  if (alive) {
    return `✅ Candela is running at ${baseUrl}`;
  }
  return `❌ Candela is not reachable at ${baseUrl}. Start it with: candela start`;
}

/**
 * Cline plugin initializer.
 *
 * When Cline's plugin system stabilizes, this will register lifecycle
 * hooks. For now, this module provides standalone functions that work
 * as Cline custom tools or can be called from .cline/tools/.
 */
export async function initCandelaPlugin(options?: {
  baseUrl?: string;
}): Promise<{
  client: CandelaClient;
  alive: boolean;
  summary: () => Promise<string>;
  budget: () => Promise<string>;
  health: () => Promise<string>;
}> {
  const baseUrl = options?.baseUrl ?? discoverCandelaUrl();
  const client = new CandelaClient(baseUrl);
  const alive = await client.isAlive();

  return {
    client,
    alive,
    summary: () => getSessionSummary(baseUrl),
    budget: () => getBudgetStatus(baseUrl),
    health: () => checkCandelaHealth(baseUrl),
  };
}

export { CandelaClient } from "./candela-client.js";
