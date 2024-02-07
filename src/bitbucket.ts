import { PullRequest, PullRequestResponse, Repository, RepositoryResponse } from './bitbucket.d';

export class BitBucket {
  init = {
    headers: {
      'Authorization': 'Bearer <access_token>',
      'Accept': 'application/json'
    }
  };
  repos: Repository[] = [];
  prs: {
    [repo: string]: PullRequest[]
  } = {};

  constructor(token: string) {
    this.init.headers.Authorization = `Bearer ${token}`
  }

  async listAllPullRequests(workspace: string) {
    if (this.repos.length === 0) {
      this.repos = await this.listRepositories(workspace);
    }
    for (const repo of this.repos) {
      this.prs[repo.name] = await this.listPullRequests(workspace, repo.name);
    }
    return this.prs;
  }

  async listPullRequests(workspace: string, repo_slug: string) {
    if (this.prs && this.prs[repo_slug]) return this.prs[repo_slug];
    let response: PullRequestResponse;
    let prs: PullRequest[] = [];
    do {
      response = await fetch(`https://api.bitbucket.org/2.0/repositories/${workspace}/${repo_slug}/pullrequests`, this.init)
        .then(res => res.json() as Promise<PullRequestResponse>);
      prs.push(...response.values);
    } while (response.next)
    return prs;
  }

  async listRepositories(workspace: string) {
    if (this.repos) return this.repos;
    let response: RepositoryResponse;
    let repos: Repository[] = [];
    do {
      response = await fetch(`https://api.bitbucket.org/2.0/repositories/${workspace}`, this.init)
        .then(res => res.json() as Promise<RepositoryResponse>);
      repos.push(...response.values);
    } while (response.next)
    this.repos = repos;
    return repos;
  }
}