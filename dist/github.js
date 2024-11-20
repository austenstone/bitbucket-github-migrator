import { Octokit } from '@octokit/rest';
import { throttling } from "@octokit/plugin-throttling";
const MyOctokit = Octokit.plugin(throttling);
export class GitHub {
    octokit;
    constructor(token) {
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
    async getOrgs() {
        return this.octokit.orgs.listForAuthenticatedUser();
    }
    async createPullRequest(request) {
        return this.octokit.pulls.create(request);
    }
    async createIssueComment(request) {
        return this.octokit.issues.createComment(request);
    }
    async createPullRequestReviewComment(request) {
        return this.octokit.pulls.createReviewComment(request);
    }
    async createRepository(request) {
        return this.octokit.repos.createInOrg(request);
    }
}
