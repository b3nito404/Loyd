#!/usr/bin/env tsx

import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

interface BenchTask {
  name: string;
  hz: number;
}

interface BenchSuite {
  name: string;
  tasks: BenchTask[];
}

const LIBS = ["Loyd compiled", "AJV", "Valibot", "Zod"] as const;
type Lib = (typeof LIBS)[number];

const COLORS: Record<Lib, string> = {
  "Loyd compiled": "#6366f1",
  AJV: "#f59e0b",
  Valibot: "#10b981",
  Zod: "#ef4444",
};

const SUITE_LABELS: Record<string, string> = {
  "string — minLength + maxLength (valid)": "String minLength + max",
  "number — min + max + int (valid)": "Number min + max + int",
  "object flat — 3 fields (valid)": "Object flat 3 fields",
  "object deep nested — 5 levels (valid)": "Object deep 5 levels",
  "array — 1000 valid items": "Array 1K valid",
  "array — 1000 items with ~30% invalid": "Array 1K 30% invalid",
  "union — 3 variants discriminated (valid — last variant)": "Union last variant",
  "stress  deep nested repeated 1k times": "Stress deep ×1000",
};

function fmt(v: number): string {
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `${(v / 1_000).toFixed(0)}K`;
  return v.toFixed(0);
}

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

function wrapLabel(text: string, maxLen: number): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    const next = current ? `${current} ${word}` : word;

    if (next.length <= maxLen) {
      current = next;
    } else {
      if (current) lines.push(current);
      current = word;
    }
  }

  if (current) lines.push(current);

  return lines.slice(0, 3);
}

function generateSvg(suites: BenchSuite[]): string {
  const nGroups = suites.length;
  const nBars = LIBS.length;

  const MARGIN_TOP = 96;
  const MARGIN_BOTTOM = 100;
  const MARGIN_LEFT = 60;
  const MARGIN_RIGHT = 32;

  const GROUP_W = nGroups <= 4 ? 170 : nGroups <= 8 ? 150 : nGroups <= 12 ? 132 : 118;

  const GROUP_GAP = nGroups <= 4 ? 52 : nGroups <= 8 ? 40 : nGroups <= 12 ? 30 : 22;

  const BAR_GAP = 6;

  const CHART_H = 280;
  const LABEL_H = 92;

  const barW = (GROUP_W - BAR_GAP * (nBars - 1)) / nBars;

  const WIDTH =
    MARGIN_LEFT + nGroups * GROUP_W + Math.max(0, nGroups - 1) * GROUP_GAP + MARGIN_RIGHT;

  const HEIGHT = MARGIN_TOP + CHART_H + LABEL_H + MARGIN_BOTTOM;

  const chartLeft = MARGIN_LEFT;
  const chartTop = MARGIN_TOP;

  const o: string[] = [];

  o.push(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}">`,
  );

  o.push(`<rect width="${WIDTH}" height="${HEIGHT}" fill="#f5f7fb"/>`);

  o.push(
    `<rect x="${chartLeft - 14}" y="${chartTop - 14}" width="${WIDTH - chartLeft - MARGIN_RIGHT + 28}" height="${CHART_H + LABEL_H + 28}" fill="#ffffff" stroke="#e2e8f0" stroke-width="1"/>`,
  );

  o.push(
    `<text x="${WIDTH / 2}" y="32" text-anchor="middle" font-family="-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif" font-size="18" font-weight="700" fill="#0f172a">Loydjs | Performance Benchmarks</text>`,
  );

  o.push(
    `<text x="${WIDTH / 2}" y="54" text-anchor="middle" font-family="-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif" font-size="11" fill="#64748b">ops/sec · Node.js 22 · higher is better</text>`,
  );

  const legendY = 74;
  const legendItemW = 118;
  const legendTotalW = LIBS.length * legendItemW;

  let legendX = (WIDTH - legendTotalW) / 2;

  for (const lib of LIBS) {
    o.push(
      `<rect x="${legendX}" y="${legendY - 10}" width="13" height="13" fill="${COLORS[lib]}"/>`,
    );

    o.push(
      `<text x="${legendX + 19}" y="${legendY}" font-family="-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif" font-size="11" fill="#475569">${lib}</text>`,
    );

    legendX += legendItemW;
  }

  const gridLines = [0, 25, 50, 75, 100];

  for (const pct of gridLines) {
    const gy = chartTop + CHART_H - (pct / 100) * CHART_H;

    o.push(
      `<line x1="${chartLeft - 4}" y1="${gy}" x2="${WIDTH - MARGIN_RIGHT}" y2="${gy}" stroke="${pct === 0 ? "#94a3b8" : "#e2e8f0"}" stroke-width="${pct === 0 ? 1.4 : 0.8}"/>`,
    );

    if (pct > 0) {
      o.push(
        `<text x="${chartLeft - 10}" y="${gy + 4}" text-anchor="end" font-family="-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif" font-size="9" fill="#94a3b8">${pct}%</text>`,
      );
    }
  }

  suites.forEach((suite, si) => {
    const groupX = chartLeft + si * (GROUP_W + GROUP_GAP);

    const maxHz = Math.max(...suite.tasks.map((t) => t.hz));

    if (si > 0) {
      o.push(
        `<line x1="${groupX - GROUP_GAP / 2}" y1="${chartTop - 6}" x2="${groupX - GROUP_GAP / 2}" y2="${chartTop + CHART_H + LABEL_H}" stroke="#eef2f7" stroke-width="1"/>`,
      );
    }

    LIBS.forEach((lib, li) => {
      const task = suite.tasks.find((t) => t.name === lib);

      if (!task) return;

      const pct = task.hz / maxHz;

      const bh = Math.max(6, pct * CHART_H);

      const bx = groupX + li * (barW + BAR_GAP);

      const by = chartTop + CHART_H - bh;

      const isFastest = task.hz === maxHz;

      o.push(
        `<rect x="${bx.toFixed(1)}" y="${by.toFixed(1)}" width="${barW.toFixed(1)}" height="${bh.toFixed(1)}" fill="${COLORS[lib]}" opacity="${isFastest ? "1" : "0.82"}"/>`,
      );

      const value = fmt(task.hz);

      const labelW = Math.max(34, value.length * 6.8 + 12);

      const labelH = 14;

      const labelX = bx + barW / 2;

      const labelY = clamp(by - 8, chartTop + 14, chartTop + CHART_H - 10);

      o.push(
        `<rect x="${(labelX - labelW / 2).toFixed(1)}" y="${(labelY - labelH + 2).toFixed(1)}" width="${labelW.toFixed(1)}" height="${labelH}" fill="#ffffff" stroke="#dbe4ee" stroke-width="0.8"/>`,
      );

      o.push(
        `<text x="${labelX.toFixed(1)}" y="${labelY.toFixed(1)}" text-anchor="middle" font-family="-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif" font-size="8.5" font-weight="${isFastest ? "700" : "600"}" fill="${isFastest ? COLORS[lib] : "#334155"}">${value}</text>`,
      );
    });

    const rawLabel = SUITE_LABELS[suite.name] ?? suite.name;

    const lines = wrapLabel(rawLabel, nGroups > 10 ? 11 : 14);

    const lx = groupX + GROUP_W / 2;

    const baseY = chartTop + CHART_H + 30;

    const lineGap = 16;

    lines.forEach((line, idx) => {
      o.push(
        `<text x="${lx.toFixed(1)}" y="${(baseY + idx * lineGap).toFixed(1)}" text-anchor="middle" font-family="-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif" font-size="10" font-weight="500" fill="#475569">${line}</text>`,
      );
    });
  });

  o.push(
    `<text x="${WIDTH / 2}" y="${HEIGHT - 16}" text-anchor="middle" font-family="-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif" font-size="9" fill="#94a3b8">github.com/b3nito404/Loyd · pnpm --filter @loydjs/compiler exec vitest bench</text>`,
  );

  o.push("</svg>");

  return o.join("\n");
}

const jsonPath = join(__dirname, "bench-results.json");
const svgPath = join(__dirname, "bench.svg");

const raw = JSON.parse(readFileSync(jsonPath, "utf8")) as BenchSuite[];

const svg = generateSvg(raw);

writeFileSync(svgPath, svg, "utf8");

console.log(`Generated ${svgPath} (${(svg.length / 1024).toFixed(1)} kb)`);
