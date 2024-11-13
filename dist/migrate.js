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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Migrate = void 0;
const bitbucket_1 = require("./bitbucket");
const github_1 = require("./github");
const simple_git_1 = require("simple-git");
const debug_1 = __importDefault(require("debug"));
const fs_1 = require("fs");
if (process.env.DEBUG) {
    debug_1.default.enable('simple-git,simple-git:*');
}
class Migrate {
    constructor(options) {
        var _a;
        this.options = options;
        this.bitbucket = new bitbucket_1.BitBucket(this.options.bitbucketToken, (_a = this.options.bitbucketThrottling) === null || _a === void 0 ? void 0 : _a.timeout);
        this.github = new github_1.GitHub(this.options.githubToken);
        this.git = (0, simple_git_1.simpleGit)();
    }
    run() {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c, _d;
            if (!this.options.bitbucketWorkspace)
                throw new Error('bitbucketWorkspace input is required');
            if (!this.options.githubOwner)
                throw new Error('githubOwner input is required');
            console.log(`🚀 Migrating from Bitbucket workspace '${this.options.bitbucketWorkspace}' to GitHub org '${this.options.githubOwner}'`);
            if (this.options.whatToMigrate.includes('repositories')) {
                const root = process.cwd();
                const reposFolder = `${root}/_repos`;
                (0, fs_1.rmSync)(reposFolder, { recursive: true, force: true });
                for (const repo of yield this.bitbucket.getRepositories(this.options.bitbucketWorkspace)) {
                    console.log(`🔄 Git Mirror ${repo.full_name} from Bitbucket to GitHub`);
                    const remote = {
                        source: repo.links.clone[0].href,
                        target: `https://github.com/${this.options.githubOwner}/${repo.name}.git`
                    };
                    const path = `${reposFolder}/${repo.name}`;
                    console.log(`➕ Create GitHub repository ${repo.name}`);
                    yield this.github.createRepository({
                        org: this.options.githubOwner,
                        name: repo.name,
                    }).catch(err => {
                        if (err.message.includes('already exists'))
                            return;
                    });
                    yield this.git.mirror(remote.source, path)
                        .catch(err => {
                        if (err.message.includes('already exists'))
                            return;
                    });
                    yield this.git.cwd(path);
                    yield this.git.addRemote('github', `https://github.com/${this.options.githubOwner}/${repo.name}.git`)
                        .catch(err => {
                        if (err.message.includes('already exists'))
                            return;
                    });
                    yield this.git.branch(['-M', 'main'])
                        .push('--mirror', 'github')
                        .cwd(root);
                    console.log(`✅ Mirrored ${repo.full_name} from Bitbucket to GitHub`);
                }
            }
            if (this.options.whatToMigrate.includes('pullRequests')) {
                const pullRequests = yield this.bitbucket.listAllPullRequests(this.options.bitbucketWorkspace);
                console.log(`🔍 Found ${Object.values(pullRequests).reduce((acc, repoInfo) => acc + repoInfo.prs.length, 0)} pull requests to migrate`);
                for (const [repo, repoInfo] of Object.entries(pullRequests)) {
                    for (const pr of repoInfo.prs) {
                        const responsePr = yield this.github.createPullRequest({
                            owner: this.options.githubOwner,
                            repo,
                            title: pr.title,
                            head: pr.source.branch.name,
                            base: pr.destination.branch.name,
                            body: pr.summary.raw,
                            head_repo: (_b = (_a = pr.source) === null || _a === void 0 ? void 0 : _a.repository) === null || _b === void 0 ? void 0 : _b.full_name,
                        }).catch(err => {
                            var _a, _b, _c;
                            console.warn(`⚠️  <PR> repo:'${repo}' title:'${pr.title}' error:'${(_c = (_b = (_a = err.response) === null || _a === void 0 ? void 0 : _a.data) === null || _b === void 0 ? void 0 : _b.errors) === null || _c === void 0 ? void 0 : _c.map((e) => e.message).join(', ')}'`);
                            return;
                        });
                        if (responsePr) {
                            console.log(`✅ <PR> repo:${repo} title:${pr.title} url:${responsePr.data.html_url}`);
                            let responsePrComments = {};
                            for (const comment of pr.comments) {
                                let responsePrComment;
                                if (comment.inline) {
                                    const in_reply_to = ((_c = comment.parent) === null || _c === void 0 ? void 0 : _c.id) ? (_d = responsePrComments[comment.parent.id]) === null || _d === void 0 ? void 0 : _d.id : undefined;
                                    responsePrComment = yield this.github.createPullRequestReviewComment({
                                        owner: this.options.githubOwner,
                                        repo,
                                        pull_number: responsePr.data.number,
                                        body: comment.content.raw,
                                        commit_id: responsePr.data.head.sha,
                                        path: comment.inline.path,
                                        start_line: comment.inline.from || undefined,
                                        in_reply_to,
                                        line: comment.inline.to
                                    }).catch(err => {
                                        var _a, _b, _c;
                                        console.warn(`⚠️  <PR Comment> repo:'${repo}' title:'${pr.title}' error:'${(_c = (_b = (_a = err.response) === null || _a === void 0 ? void 0 : _a.data) === null || _b === void 0 ? void 0 : _b.errors) === null || _c === void 0 ? void 0 : _c.map((e) => e.message).join(', ')}'`);
                                    });
                                    if (responsePrComment)
                                        responsePrComments[comment.id] = responsePrComment.data;
                                }
                                else {
                                    responsePrComment = yield this.github.createIssueComment({
                                        owner: this.options.githubOwner,
                                        repo,
                                        issue_number: responsePr.data.number,
                                        body: comment.content.raw
                                    }).catch(err => {
                                        var _a, _b, _c;
                                        console.warn(`⚠️  <PR Comment> repo:'${repo}' title:'${pr.title}' error:'${(_c = (_b = (_a = err.response) === null || _a === void 0 ? void 0 : _a.data) === null || _b === void 0 ? void 0 : _b.errors) === null || _c === void 0 ? void 0 : _c.map((e) => e.message).join(', ')}'`);
                                    });
                                    if (responsePrComment)
                                        responsePrComments[comment.id] = responsePrComment.data;
                                }
                                if (responsePrComments) {
                                    console.log(`✅ <PR Comment> repo:${repo} title:${pr.title} url:${responsePrComment.data.html_url}`);
                                }
                            }
                        }
                    }
                    console.log(`✨ ${repo} - ${repoInfo.prs.length} pull requests migrated`);
                }
            }
            console.log('🎉 All done!');
        });
    }
}
exports.Migrate = Migrate;
