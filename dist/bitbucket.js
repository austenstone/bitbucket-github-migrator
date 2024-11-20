export class BitBucket {
    init = {
        headers: {
            'Authorization': 'Bearer <access_token>',
            'Accept': 'application/json'
        }
    };
    repos = [];
    reposInfo = {};
    prs = [];
    issues = [];
    throttle;
    constructor(token, throttle) {
        this.init.headers.Authorization = `Bearer ${token}`;
        this.throttle = throttle || 0;
    }
    async _fetch(url, init) {
        if (this.throttle) {
            await new Promise(resolve => setTimeout(resolve, this.throttle));
        }
        return fetch(url, {
            ...this.init,
            ...init
        }).then(res => res.json());
    }
    async getRepositories(workspace) {
        if (this.repos.length > 0)
            return this.repos;
        const repos = [];
        let response = {
            next: `https://api.bitbucket.org/2.0/repositories/${workspace}`
        };
        do {
            try {
                response = await this._fetch(response.next);
            }
            catch (e) {
                console.error(e);
            }
            if (response.type === 'error') {
                throw new Error(response.error.message);
            }
            repos.push(...response.values);
        } while (response.next);
        this.repos = repos;
        this.reposInfo = repos.reduce((acc, repo) => {
            acc[repo.name] = { prs: [], issues: [] };
            return acc;
        }, {});
        return repos;
    }
    async listAllPullRequests(workspace) {
        for (const repo of await this.getRepositories(workspace)) {
            await this.listPullRequests(workspace, repo.name);
            Object.entries(this.reposInfo).forEach(async ([repo, info]) => {
                for (const pr of info.prs) {
                    await this.listPullRequestsComments(workspace, repo, pr.id);
                }
            });
        }
        return this.reposInfo;
    }
    async listPullRequests(workspace, repo_slug) {
        if (this.reposInfo.prs && this.prs[repo_slug])
            return this.prs[repo_slug];
        const prs = [];
        let response;
        do {
            response = await this._fetch(`https://api.bitbucket.org/2.0/repositories/${workspace}/${repo_slug}/pullrequests`);
            prs.push(...response.values);
        } while (response.next);
        this.reposInfo[repo_slug].prs = prs;
        this.prs.push(...this.reposInfo[repo_slug].prs);
        return prs;
    }
    async listPullRequestsComments(workspace, repo_slug, pr_id) {
        const comments = [];
        let response;
        do {
            response = await this._fetch(`https://api.bitbucket.org/2.0/repositories/${workspace}/${repo_slug}/pullrequests/${pr_id}/comments`);
            comments.push(...response.values);
        } while (response.next);
        const pr = this.reposInfo[repo_slug].prs.find(pr => pr.id === pr_id);
        comments.reverse();
        if (pr)
            pr.comments = comments;
        return comments;
    }
    async listAllIssues(workspace) {
        const issues = [];
        for (const repo of await this.getRepositories(workspace)) {
            issues.push(...await this.listIssues(workspace, repo.name));
        }
        return issues;
    }
    async listIssues(workspace, repo_slug) {
        if (this.issues && this.issues[repo_slug])
            return this.issues[repo_slug];
        const issues = [];
        let response;
        do {
            response = await this._fetch(`https://api.bitbucket.org/2.0/repositories/${workspace}/${repo_slug}/issues`);
            issues.push(...response.values);
        } while (response.next);
        this.reposInfo[repo_slug].issues = issues;
        this.issues.push(...this.reposInfo[repo_slug].issues);
        return issues;
    }
}
