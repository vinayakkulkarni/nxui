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

interface GithubEvent {
  type: string;
  repo: { name: string };
  payload: { size?: number; distinct_size?: number };
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

function isGithubEventArray(value: unknown): value is GithubEvent[] {
  return (
    Array.isArray(value) &&
    value.every(
      (item) =>
        typeof item === 'object' &&
        item !== null &&
        typeof (item as GithubEvent).type === 'string' &&
        typeof (item as GithubEvent).repo?.name === 'string',
    )
  );
}

const LEVELS = [
  'NONE',
  'FIRST_QUARTILE',
  'SECOND_QUARTILE',
  'THIRD_QUARTILE',
  'FOURTH_QUARTILE',
] as const;

/** Events that count as a contribution when tallying per-repo activity. */
const COUNTED_EVENTS = new Set([
  'PushEvent',
  'PullRequestEvent',
  'PullRequestReviewEvent',
  'IssuesEvent',
  'IssueCommentEvent',
  'CreateEvent',
  'CommitCommentEvent',
]);

/**
 * Top repositories by recent public activity, derived from the events feed.
 * PushEvents contribute their commit count; other events count once.
 */
async function fetchTopContributions(
  username: string,
): Promise<{ repo: string; count: number; owner: string }[]> {
  const response = await fetch(
    `https://api.github.com/users/${username}/events/public?per_page=100`,
    {
      headers: { accept: 'application/vnd.github+json', 'user-agent': 'nxui' },
    },
  );
  if (!response.ok) return [];
  const json: unknown = await response.json();
  if (!isGithubEventArray(json)) return [];

  const tally = new Map<string, number>();
  for (const event of json) {
    if (!COUNTED_EVENTS.has(event.type)) continue;
    const weight =
      event.type === 'PushEvent'
        ? (event.payload.size ?? event.payload.distinct_size ?? 1)
        : 1;
    tally.set(event.repo.name, (tally.get(event.repo.name) ?? 0) + weight);
  }

  return [...tally.entries()]
    .filter(([, count]) => count > 0)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([fullName, count]) => {
      const [owner = username, repo = fullName] = fullName.split('/');
      return { repo, count, owner };
    });
}

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

  const topContributions = await fetchTopContributions(username);

  setHeader(event, 'cache-control', 'public, max-age=3600, s-maxage=3600');
  return {
    contributions: weeks,
    totalContributions: Object.values(data.total).reduce(
      (sum, n) => sum + n,
      0,
    ),
    topContributions,
  };
});
