"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BitBucket = void 0;
class BitBucket {
    constructor(token, throttle) {
        this.init = {
            headers: {
                'Authorization': 'Bearer <access_token>',
                'Accept': 'application/json'
            }
        };
        this.repos = [];
        this.reposInfo = {};
        this.prs = [];
        this.issues = [];
        this.init.headers.Authorization = `Bearer ${token}`;
        this.throttle = throttle || 0;
    }
    _fetch(url, init) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.throttle) {
                yield new Promise(resolve => setTimeout(resolve, this.throttle));
            }
            return fetch(url, Object.assign(Object.assign({}, this.init), init)).then(res => res.json());
        });
    }
    getRepositories(workspace) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.repos.length > 0)
                return this.repos;
            const repos = [];
            let response = {
                next: `https://api.bitbucket.org/2.0/repositories/${workspace}`
            };
            do {
                try {
                    response = yield this._fetch(response.next);
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
        });
    }
    listAllPullRequests(workspace) {
        return __awaiter(this, void 0, void 0, function* () {
            for (const repo of yield this.getRepositories(workspace)) {
                yield this.listPullRequests(workspace, repo.name);
                Object.entries(this.reposInfo).forEach((_a) => __awaiter(this, [_a], void 0, function* ([repo, info]) {
                    for (const pr of info.prs) {
                        yield this.listPullRequestsComments(workspace, repo, pr.id);
                    }
                }));
            }
            return this.reposInfo;
        });
    }
    listPullRequests(workspace, repo_slug) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.reposInfo.prs && this.prs[repo_slug])
                return this.prs[repo_slug];
            const prs = [];
            let response;
            do {
                response = yield this._fetch(`https://api.bitbucket.org/2.0/repositories/${workspace}/${repo_slug}/pullrequests`);
                prs.push(...response.values);
            } while (response.next);
            this.reposInfo[repo_slug].prs = prs;
            this.prs.push(...this.reposInfo[repo_slug].prs);
            return prs;
        });
    }
    listPullRequestsComments(workspace, repo_slug, pr_id) {
        return __awaiter(this, void 0, void 0, function* () {
            const comments = [];
            let response;
            do {
                response = yield this._fetch(`https://api.bitbucket.org/2.0/repositories/${workspace}/${repo_slug}/pullrequests/${pr_id}/comments`);
                comments.push(...response.values);
            } while (response.next);
            const pr = this.reposInfo[repo_slug].prs.find(pr => pr.id === pr_id);
            comments.reverse();
            if (pr)
                pr.comments = comments;
            return comments;
        });
    }
    listAllIssues(workspace) {
        return __awaiter(this, void 0, void 0, function* () {
            const issues = [];
            for (const repo of yield this.getRepositories(workspace)) {
                issues.push(...yield this.listIssues(workspace, repo.name));
            }
            return issues;
        });
    }
    listIssues(workspace, repo_slug) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.issues && this.issues[repo_slug])
                return this.issues[repo_slug];
            const issues = [];
            let response;
            do {
                response = yield this._fetch(`https://api.bitbucket.org/2.0/repositories/${workspace}/${repo_slug}/issues`);
                issues.push(...response.values);
            } while (response.next);
            this.reposInfo[repo_slug].issues = issues;
            this.issues.push(...this.reposInfo[repo_slug].issues);
            return issues;
        });
    }
}
exports.BitBucket = BitBucket;
