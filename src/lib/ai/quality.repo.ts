/**
 * src/lib/ai/quality.repo.ts
 * Repository for AI reading quality telemetry & outcome tracking (AI_INTELLIGENCE_PLAN W1.1)
 */

import { getAppDB } from "@/lib/platform/db";

export interface ReadingQualityRecord {
  readingId: string;
  provider: string;
  model: string;
  personaId: string;
  spreadId: string;
  cardCount: number;
  category: string;
  promptVersion: string;
  elapsedMs?: number;
  outputTokens?: number;
  hadFailover?: boolean;
  consistencyOk?: boolean | null;
  judgeScore?: number | null;
  outcome?: string | null;
  createdAt?: number;
}

export interface QualitySummary {
  totalReadings: number;
  ratedReadings: number;
  accurateCount: number;
  partialCount: number;
  notHappenedCount: number;
  accurateRate: number;
  notHappenedRate: number;
  avgElapsedMs: number;
  failoverRate: number;
  byVersion: Record<string, { total: number; accurate: number; rate: number }>;
  byProvider: Record<string, { total: number; accurate: number; rate: number }>;
  byPersona: Record<string, { total: number; accurate: number; rate: number }>;
}

export async function recordReadingQuality(record: ReadingQualityRecord): Promise<void> {
  const db = await getAppDB();
  if (!db) return;

  const now = record.createdAt ?? Date.now();
  const hadFailover = record.hadFailover ? 1 : 0;
  const consistencyOk = record.consistencyOk === true ? 1 : record.consistencyOk === false ? 0 : null;

  try {
    await db
      .prepare(
        `INSERT OR REPLACE INTO reading_quality (
          reading_id, provider, model, persona_id, spread_id, card_count,
          category, prompt_version, elapsed_ms, output_tokens, had_failover,
          consistency_ok, judge_score, outcome, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .bind(
        record.readingId,
        record.provider,
        record.model,
        record.personaId,
        record.spreadId,
        record.cardCount,
        record.category,
        record.promptVersion,
        record.elapsedMs ?? null,
        record.outputTokens ?? null,
        hadFailover,
        consistencyOk,
        record.judgeScore ?? null,
        record.outcome ?? null,
        now,
      )
      .run();
  } catch (err) {
    // Non-blocking telemetry — must never break user readings
    console.warn("[reading_quality] Failed to record quality metrics:", err);
  }
}

export async function updateQualityOutcome(readingId: string, outcome: string): Promise<boolean> {
  const db = await getAppDB();
  if (!db) return false;

  try {
    const res = await db
      .prepare(`UPDATE reading_quality SET outcome = ? WHERE reading_id = ?`)
      .bind(outcome, readingId)
      .run();
    return (res.meta?.changes ?? 0) > 0;
  } catch (err) {
    console.warn("[reading_quality] Failed to update outcome:", err);
    return false;
  }
}

export async function getQualityStats(limit = 1000): Promise<QualitySummary> {
  const db = await getAppDB();
  const empty: QualitySummary = {
    totalReadings: 0,
    ratedReadings: 0,
    accurateCount: 0,
    partialCount: 0,
    notHappenedCount: 0,
    accurateRate: 0,
    notHappenedRate: 0,
    avgElapsedMs: 0,
    failoverRate: 0,
    byVersion: {},
    byProvider: {},
    byPersona: {},
  };

  if (!db) return empty;

  try {
    const { results } = await db
      .prepare(
        `SELECT reading_id, provider, model, persona_id, prompt_version,
                elapsed_ms, had_failover, consistency_ok, judge_score, outcome, created_at
         FROM reading_quality
         ORDER BY created_at DESC
         LIMIT ?`,
      )
      .bind(limit)
      .all<any>();

    if (!results || results.length === 0) return empty;

    let totalElapsed = 0;
    let elapsedCount = 0;
    let failoverCount = 0;
    let ratedCount = 0;
    let accurate = 0;
    let partial = 0;
    let notHappened = 0;

    const byVersion: Record<string, { total: number; accurate: number; rate: number }> = {};
    const byProvider: Record<string, { total: number; accurate: number; rate: number }> = {};
    const byPersona: Record<string, { total: number; accurate: number; rate: number }> = {};

    for (const r of results) {
      if (typeof r.elapsed_ms === "number" && r.elapsed_ms > 0) {
        totalElapsed += r.elapsed_ms;
        elapsedCount++;
      }
      if (r.had_failover === 1) failoverCount++;

      const isRated = r.outcome && r.outcome !== "PENDING";
      const isAccurate = r.outcome === "ACCURATE";
      if (isRated) {
        ratedCount++;
        if (r.outcome === "ACCURATE") accurate++;
        else if (r.outcome === "PARTIAL") partial++;
        else if (r.outcome === "NOT_HAPPENED") notHappened++;
      }

      // Aggregate by version
      const v = r.prompt_version || "unknown";
      byVersion[v] = byVersion[v] || { total: 0, accurate: 0, rate: 0 };
      byVersion[v].total++;
      if (isAccurate) byVersion[v].accurate++;

      // Aggregate by provider
      const p = r.provider || "unknown";
      byProvider[p] = byProvider[p] || { total: 0, accurate: 0, rate: 0 };
      byProvider[p].total++;
      if (isAccurate) byProvider[p].accurate++;

      // Aggregate by persona
      const per = r.persona_id || "unknown";
      byPersona[per] = byPersona[per] || { total: 0, accurate: 0, rate: 0 };
      byPersona[per].total++;
      if (isAccurate) byPersona[per].accurate++;
    }

    for (const k of Object.keys(byVersion)) {
      byVersion[k].rate = byVersion[k].total > 0 ? Math.round((byVersion[k].accurate / byVersion[k].total) * 100) : 0;
    }
    for (const k of Object.keys(byProvider)) {
      byProvider[k].rate = byProvider[k].total > 0 ? Math.round((byProvider[k].accurate / byProvider[k].total) * 100) : 0;
    }
    for (const k of Object.keys(byPersona)) {
      byPersona[k].rate = byPersona[k].total > 0 ? Math.round((byPersona[k].accurate / byPersona[k].total) * 100) : 0;
    }

    return {
      totalReadings: results.length,
      ratedReadings: ratedCount,
      accurateCount: accurate,
      partialCount: partial,
      notHappenedCount: notHappened,
      accurateRate: ratedCount > 0 ? Math.round((accurate / ratedCount) * 100) : 0,
      notHappenedRate: ratedCount > 0 ? Math.round((notHappened / ratedCount) * 100) : 0,
      avgElapsedMs: elapsedCount > 0 ? Math.round(totalElapsed / elapsedCount) : 0,
      failoverRate: results.length > 0 ? Math.round((failoverCount / results.length) * 100) : 0,
      byVersion,
      byProvider,
      byPersona,
    };
  } catch (err) {
    console.warn("[reading_quality] Failed to aggregate quality stats:", err);
    return empty;
  }
}
