type Href = {
  href: string;
};

type Link = {
  href: string;
  name: string;
};

type Links = {
  self: Href;
  avatar: Href;
  html: Href;
  [key: string]: Href;
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
    commit: {
      hash: string;
      links: Links;
      type: string;
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

type CustomPullRequest = PullRequest & { comments: PullRequestComment[] };

type PullRequestResponse = {
  size: number;
  page: number;
  pagelen: number;
  next: string;
  previous: string;
  values: CustomPullRequest[];
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
  type?: 'error',
  size: number;
  page: number;
  pagelen: number;
  next: string;
  previous: string;
  values: Repository[];
  error: {
    message: string
  }
};

type Reporter = {
  type: string;
};

type Assignee = {
  type: string;
};

type Milestone = {
  type: string;
};

type Version = {
  type: string;
};

type Component = {
  type: string;
};

type Content = {
  raw: string;
  markup: string;
  html: string;
};

type Issue = {
  type: string;
  links: {
    self: Link;
    html: Link;
    comments: Link;
    attachments: Link;
    watch: Link;
    vote: Link;
  };
  id: number;
  repository: Repository;
  title: string;
  reporter: Reporter;
  assignee: Assignee;
  created_on: string;
  updated_on: string;
  edited_on: string;
  state: string;
  kind: string;
  priority: string;
  milestone: Milestone;
  version: Version;
  component: Component;
  votes: number;
  content: Content;
};

type IssueResponse = {
  size: number;
  page: number;
  pagelen: number;
  next: string;
  previous: string;
  values: Issue[];
};

type Resolution = {
  type: string;
};

type User = {
  display_name: string;
  links: {
    self: Link;
    avatar: Link;
    html: Link;
  };
  type: string;
  uuid: string;
  account_id: string;
  nickname: string;
};

type Parent = {
  id: number;
  links: {
    self: Link;
    html: Link;
  };
};

type Inline = {
  from: number | null;
  to: number;
  path: string;
};

type PullRequestComment = {
  id: number;
  created_on: string;
  updated_on: string;
  content: Content;
  user: User;
  deleted: boolean;
  parent?: Parent;
  inline?: Inline;
  pending: boolean;
  type: string;
  links: {
    self: Link;
    html: Link;
    code?: Link;
  };
  pullrequest: PullRequest;
};

type PullRequestCommentResponse = {
  size: number;
  page: number;
  pagelen: number;
  next: string;
  previous: string;
  values: PullRequestComment[];
};

export {
  CustomPullRequest as PullRequest,
  PullRequestResponse,
  Repository,
  RepositoryResponse,
  IssueResponse,
  Issue,
  PullRequestCommentResponse,
  PullRequestComment
}