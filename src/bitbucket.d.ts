type Link = {
  href: string;
  name: string;
};

type Rendered = {
  raw: string;
  markup: string;
  html: string;
};

type Author = {
  type: string;
};

type Reviewer = {
  type: string;
};

type Participant = {
  type: string;
};

type PullRequest = {
  type: string;
  links: {
    self: Link;
    html: Link;
    commits: Link;
    approve: Link;
    diff: Link;
    diffstat: Link;
    comments: Link;
    activity: Link;
    merge: Link;
    decline: Link;
  };
  id: number;
  title: string;
  rendered: {
    title: Rendered;
    description: Rendered;
    reason: Rendered;
  };
  summary: {
    raw: string;
    markup: string;
    html: string;
  };
  state: string;
  author: Author;
  source: {
    branch: {
      name: string;
    };
    repository: Repository;
  };
  destination: {
    branch: {
      name: string;
    };
    repository: Repository;
  };
  merge_commit: {
    hash: string;
  };
  comment_count: number;
  task_count: number;
  close_source_branch: boolean;
  closed_by: {
    type: string;
  };
  reason: string;
  created_on: string;
  updated_on: string;
  reviewers: Reviewer[];
  participants: Participant[];
};

type PullRequestResponse = {
  size: number;
  page: number;
  pagelen: number;
  next: string;
  previous: string;
  values: PullRequest[];
};

type Clone = {
  href: string;
  name: string;
};

type Owner = {
  type: string;
};

type Project = {
  type: string;
};

type MainBranch = {
  type: string;
};

type Repository = {
  type: string;
  links: {
    self: Link;
    html: Link;
    avatar: Link;
    pullrequests: Link;
    commits: Link;
    forks: Link;
    watchers: Link;
    downloads: Link;
    clone: Clone[];
    hooks: Link;
  };
  uuid: string;
  full_name: string;
  is_private: boolean;
  scm: string;
  owner: Owner;
  name: string;
  description: string;
  created_on: string;
  updated_on: string;
  size: number;
  language: string;
  has_issues: boolean;
  has_wiki: boolean;
  fork_policy: string;
  project: Project;
  mainbranch: MainBranch;
};

type RepositoryResponse = {
  size: number;
  page: number;
  pagelen: number;
  next: string;
  previous: string;
  values: Repository[];
};

export { PullRequest, PullRequestResponse, Repository, RepositoryResponse }