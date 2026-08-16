export interface FlatContribution {
  date: string;
  count: number;
  level: number;
}

export interface FlatContributionData {
  total: Record<string, number>;
  contributions: FlatContribution[];
}

export interface GithubEvent {
  type: string;
  repo: { name: string };
  payload: { size?: number; distinct_size?: number };
}

export interface GithubTopRepo {
  repo: string;
  count: number;
  owner: string;
}

export interface GithubCalendarDay {
  color: string;
  contributionCount: number;
  contributionLevel: string;
  date: string;
}
