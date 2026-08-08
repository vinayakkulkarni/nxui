import type { H3Event } from 'h3';
import { createError, defineEventHandler, getRouterParam, setHeader } from 'h3';

interface FlatContribution {
  date: string;
  count: number;
  level: number;
}

interface FlatContributionData {
  total: Record<string, number>;
  contributions: FlatContribution[];
}

function isFlatContributionData(value: unknown): value is FlatContributionData {
  if (!value || typeof value !== 'object') return false;
  const record = value as Record<string, unknown>;
  return (
    typeof record.total === 'object' &&
    record.total !== null &&
    Array.isArray(record.contributions)
  );
}

const LEVELS = [
  'NONE',
  'FIRST_QUARTILE',
  'SECOND_QUARTILE',
  'THIRD_QUARTILE',
  'FOURTH_QUARTILE',
] as const;

/**
 * Same-origin proxy for GitHub contribution data, normalized to the
 * week-column shape GithubCalendar renders. Proxying keeps the component
 * working even when the public API's CORS policy or hosting changes —
 * the previous upstream (Deno Deploy Classic) was sunset entirely.
 */
export default defineEventHandler(async (event: H3Event) => {
  const username = getRouterParam(event, 'username') ?? '';
  if (!/^[a-z0-9-]{1,39}$/i.test(username)) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid username' });
  }
  const upstream = await fetch(
    `https://github-contributions-api.jogruber.de/v4/${username}?y=last`,
    { headers: { accept: 'application/json' } },
  );
  if (!upstream.ok) {
    throw createError({
      statusCode: upstream.status,
      statusMessage: `Upstream responded ${upstream.status}`,
    });
  }
  const data: unknown = await upstream.json();
  if (!isFlatContributionData(data)) {
    throw createError({
      statusCode: 502,
      statusMessage: 'Malformed upstream payload',
    });
  }

  const weeks: {
    color: string;
    contributionCount: number;
    contributionLevel: (typeof LEVELS)[number];
    date: string;
  }[][] = [];
  let week: (typeof weeks)[number] = [];
  for (const day of data.contributions) {
    const dow = new Date(`${day.date}T00:00:00Z`).getUTCDay();
    if (dow === 0 && week.length > 0) {
      weeks.push(week);
      week = [];
    }
    week.push({
      color: '',
      contributionCount: day.count,
      contributionLevel: LEVELS[Math.min(4, Math.max(0, day.level))]!,
      date: day.date,
    });
  }
  if (week.length > 0) weeks.push(week);

  setHeader(event, 'cache-control', 'public, max-age=3600, s-maxage=3600');
  return {
    contributions: weeks,
    totalContributions: Object.values(data.total).reduce(
      (sum, n) => sum + n,
      0,
    ),
  };
});
