import { BitBucket } from "./bitbucket.js";
import { GitHub } from "./github.js";
import { simpleGit } from "simple-git";
import debug from 'debug';
import { rmSync } from "fs";
import { join } from "path";
if (process.env.DEBUG) {
    debug.enable('simple-git,simple-git:*');
}
export class Migrate {
    bitbucket;
    github;
    options;
    git;
    root;
    reposFolder;
    constructor(options) {
        this.options = options;
        this.bitbucket = new BitBucket(this.options.bitbucketToken, this.options.bitbucketThrottling?.timeout);
        this.github = new GitHub(this.options.githubToken);
        this.git = simpleGit();
        this.root = process.cwd();
        this.reposFolder = join(this.root, '_repos');
    }
    async run() {
        if (!this.options.bitbucketWorkspace)
            throw new Error('bitbucketWorkspace input is required');
        if (!this.options.githubOwner)
            throw new Error('githubOwner input is required');
        console.log(`🚀 Migrating from Bitbucket workspace '${this.options.bitbucketWorkspace}' to GitHub org '${this.options.githubOwner}'`);
        rmSync(this.reposFolder, { recursive: true, force: true });
        if (this.options.whatToMigrate.includes('repositories')) {
            for (const repo of await this.bitbucket.getRepositories(this.options.bitbucketWorkspace)) {
                console.log(`🔄 Git Mirror ${repo.full_name} from Bitbucket to GitHub`);
                const remote = {
                    source: repo.links.clone[0].href,
                    target: `https://github.com/${this.options.githubOwner}/${repo.name}.git`
                };
                console.log(`➕ Create GitHub repository ${repo.name}`);
                try {
                    await this.github.createRepository({
                        org: this.options.githubOwner,
                        name: repo.name,
                    });
                }
                catch (error) {
                    if (error instanceof Error) {
                        if (error.message.includes('already exists')) {
                            console.log(`🟢 ${repo.name} already exists on GitHub`);
                        }
                        else {
                            console.error(`❌ Error creating repository ${repo.name} on GitHub: ${error.message}`);
                            return;
                        }
                    }
                }
                try {
                    const path = join(this.reposFolder, repo.name);
                    await this.git.mirror(remote.source, path);
                    await this.git.cwd(path);
                    await this.git.addRemote('github', `https://github.com/${this.options.githubOwner}/${repo.name}.git`);
                    await this.git.branch(['-M', 'main'])
                        .push('--mirror', 'github')
                        .cwd(this.root);
                }
                catch (error) {
                    if (error instanceof Error) {
                        if (error.message.includes('already exists')) {
                            console.log(`🟢 ${repo.name} already mirrored`);
                        }
                        else {
                            console.log(`❌ Error mirroring repository ${repo.full_name}: ${error.message}`);
                            return;
                        }
                    }
                }
                console.log(`✅ Mirrored ${repo.full_name} from Bitbucket to GitHub`);
            }
        }
        if (this.options.whatToMigrate.includes('pullRequests')) {
            const pullRequests = await this.bitbucket.listAllPullRequests(this.options.bitbucketWorkspace);
            console.log(`🔍 Found ${Object.values(pullRequests).reduce((acc, repoInfo) => acc + repoInfo.prs.length, 0)} pull requests to migrate`);
            for (const [repo, repoInfo] of Object.entries(pullRequests)) {
                for (const pr of repoInfo.prs) {
                    const responsePr = await this.github.createPullRequest({
                        owner: this.options.githubOwner,
                        repo,
                        title: pr.title,
                        head: pr.source.branch.name,
                        base: pr.destination.branch.name,
                        body: pr.summary.raw,
                        head_repo: pr.source?.repository?.full_name,
                    }).catch(err => {
                        console.warn(`⚠️  <PR> repo:'${repo}' title:'${pr.title}' error:'${err.response?.data?.errors?.map((e) => e.message).join(', ')}'`);
                        return;
                    });
                    if (responsePr) {
                        console.log(`✅ <PR> repo:${repo} title:${pr.title} url:${responsePr.data.html_url}`);
                        const responsePrComments = {};
                        for (const comment of pr.comments) {
                            let responsePrComment;
                            if (comment.inline) {
                                const in_reply_to = comment.parent?.id ? responsePrComments[comment.parent.id]?.id : undefined;
                                responsePrComment = await this.github.createPullRequestReviewComment({
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
                                    console.warn(`⚠️  <PR Comment> repo:'${repo}' title:'${pr.title}' error:'${err.response?.data?.errors?.map((e) => e.message).join(', ')}'`);
                                });
                                if (responsePrComment)
                                    responsePrComments[comment.id] = responsePrComment.data;
                            }
                            else {
                                responsePrComment = await this.github.createIssueComment({
                                    owner: this.options.githubOwner,
                                    repo,
                                    issue_number: responsePr.data.number,
                                    body: comment.content.raw
                                }).catch(err => {
                                    console.warn(`⚠️  <PR Comment> repo:'${repo}' title:'${pr.title}' error:'${err.response?.data?.errors?.map((e) => e.message).join(', ')}'`);
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
    }
}
