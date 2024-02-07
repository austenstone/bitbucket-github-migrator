import { Octokit } from '@octokit/rest';
import { Endpoints } from '@octokit/types';
import { throttling } from "@octokit/plugin-throttling";

const MyOctokit = Octokit.plugin(throttling);

export class GitHub {
  octokit: Octokit;

  constructor(token: string) {
    this.octokit = new MyOctokit({
      auth: token,
      throttle: {
        onRateLimit: (retryAfter, options, octokit, retryCount) => {
          octokit.log.warn(`Request quota exhausted for request ${options.method} ${options.url}`);
          if (retryCount < 1) {
            octokit.log.info(`Retrying after ${retryAfter} seconds!`);
            return true;
          }
          return retryCount < 1;
        },
        onSecondaryRateLimit: (_, options, octokit) => octokit.log.warn(`SecondaryRateLimit detected for request ${options.method} ${options.url}`),
      },
    });
  }

  async createPullRequest(request: Endpoints["POST /repos/{owner}/{repo}/pulls"]["parameters"]) {
    return this.octokit.pulls.create(request);
  }

  async createIssueComment(request: Endpoints["POST /repos/{owner}/{repo}/issues/{issue_number}/comments"]["parameters"]) {
    return this.octokit.issues.createComment(request);
  }

  async createPullRequestReviewComment(request: Endpoints["POST /repos/{owner}/{repo}/pulls/{pull_number}/comments"]["parameters"]) {
    return this.octokit.pulls.createReviewComment(request);
  }
}
