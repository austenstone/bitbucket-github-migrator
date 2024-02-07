import { Octokit } from '@octokit/rest';
import { Endpoints } from '@octokit/types';

export class GitHub {
  octokit: Octokit;

  constructor(token: string) {
    this.octokit = new Octokit({
      auth: token,
    });
  }

  async createPullRequest(request: Endpoints["POST /repos/{owner}/{repo}/pulls"]["parameters"]) {
    return this.octokit.pulls.create(request);
  }
}
