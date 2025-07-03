export interface PRInfo {
  title: string;
  url: string;
  author: string;
  description: string;
  reviewers: string[];
  repository: string;
}

export type Settings = {
  webhookUrl: string;
  username?: string;
  regex?: string;
}

