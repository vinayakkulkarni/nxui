export interface GithubContributionDay {
  color: string;
  contributionCount: number;
  contributionLevel:
    | 'NONE'
    | 'FIRST_QUARTILE'
    | 'SECOND_QUARTILE'
    | 'THIRD_QUARTILE'
    | 'FOURTH_QUARTILE';
  date: string;
}

export interface GithubContributionData {
  contributions: GithubContributionDay[][];
  totalContributions: number;
}

export interface GithubTopContribution {
  /** Repository name, e.g. 'orchid-ai'. */
  repo: string;
  /** Contribution count in the period. */
  count: number;
  /** Optional emoji or icon name for the repo. */
  emoji?: string;
}

export type GithubCalendarColorSchema =
  | 'green'
  | 'blue'
  | 'purple'
  | 'orange'
  | 'gray';

export type GithubCalendarVariant = 'default' | 'city-lights' | 'minimal';

export type GithubCalendarShape = 'square' | 'rounded' | 'circle' | 'squircle';
