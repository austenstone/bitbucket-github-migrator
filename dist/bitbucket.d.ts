import { PullRequestComment, Issue, PullRequest, Repository } from './bitbucket.d.js';
export declare class BitBucket {
    init: {
        headers: {
            Authorization: string;
            Accept: string;
        };
    };
    repos: Repository[];
    reposInfo: {
        [repo: string]: {
            prs: PullRequest[];
            issues: Issue[];
        };
    };
    prs: PullRequest[];
    issues: Issue[];
    throttle: number;
    constructor(token: string, throttle?: number);
    _fetch(url: string, init?: RequestInit): Promise<any>;
    getRepositories(workspace: string): Promise<Repository[]>;
    listAllPullRequests(workspace: string): Promise<{
        [repo: string]: {
            prs: PullRequest[];
            issues: Issue[];
        };
    }>;
    listPullRequests(workspace: string, repo_slug: string): Promise<PullRequest[]>;
    listPullRequestsComments(workspace: string, repo_slug: string, pr_id: number): Promise<PullRequestComment[]>;
    listAllIssues(workspace: string): Promise<Issue[]>;
    listIssues(workspace: string, repo_slug: string): Promise<any>;
}
