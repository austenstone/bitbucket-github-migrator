import { BitBucket } from "./bitbucket";
import { GitHub } from "./github";

import { SimpleGit, simpleGit } from "simple-git";
import debug from 'debug';
import { rmSync } from "fs";
if (process.env.DEBUG) {
  debug.enable('simple-git,simple-git:*');
}
export interface MigrateOptions {
  bitbucketWorkspace: string;
  githubOwner: string;
  bitbucketToken: string;
  githubToken: string;
  bitbucketThrottling?: {
    timeout: number;
  },
  whatToMigrate: string[];
}

export class Migrate {
  bitbucket: BitBucket;
  github: GitHub;
  options: MigrateOptions;
  git: SimpleGit;

  constructor(options: MigrateOptions) {
    this.options = options;
    this.bitbucket = new BitBucket(this.options.bitbucketToken, this.options.bitbucketThrottling?.timeout);
    this.github = new GitHub(this.options.githubToken);
    this.git = simpleGit();
  }

  async run() {
    if (!this.options.bitbucketWorkspace) throw new Error('bitbucketWorkspace input is required');
    if (!this.options.githubOwner) throw new Error('githubOwner input is required');
    console.log(`🚀 Migrating from Bitbucket workspace '${this.options.bitbucketWorkspace}' to GitHub org '${this.options.githubOwner}'`)

    if (this.options.whatToMigrate.includes('repositories')) {
      const root = process.cwd();
      const reposFolder = `${root}/_repos`;
      rmSync(reposFolder, { recursive: true, force: true });
      for (const repo of await this.bitbucket.getRepositories(this.options.bitbucketWorkspace)) {
        console.log(`🔄 Git Mirror ${repo.full_name} from Bitbucket to GitHub`)
        const remote = {
          source: repo.links.clone[0].href,
          target: `https://github.com/${this.options.githubOwner}/${repo.name}.git`
        }
        const path = `${reposFolder}/${repo.name}`;
        console.log(`➕ Create GitHub repository ${repo.name}`)
        await this.github.createRepository({
          org: this.options.githubOwner,
          name: repo.name,
        }).catch(err => {
          if (err.message.includes('already exists')) return;
        });
        await this.git.mirror(remote.source, path)
          .catch(err => {
            if (err.message.includes('already exists')) return;
          })
        await this.git.cwd(path)
        await this.git.addRemote('github', `https://github.com/${this.options.githubOwner}/${repo.name}.git`)
          .catch(err => {
            if (err.message.includes('already exists')) return;
          })
        await this.git.branch(['-M', 'main'])
          .push('--mirror', 'github')
          .cwd(root);
        console.log(`✅ Mirrored ${repo.full_name} from Bitbucket to GitHub`)
      }
    }

    if (this.options.whatToMigrate.includes('pullRequests')) {
      const pullRequests = await this.bitbucket.listAllPullRequests(this.options.bitbucketWorkspace);
      console.log(`🔍 Found ${Object.values(pullRequests).reduce((acc, repoInfo) => acc + repoInfo.prs.length, 0)} pull requests to migrate`)
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
            console.warn(`⚠️  <PR> repo:'${repo}' title:'${pr.title}' error:'${err.response?.data?.errors?.map((e: any) => e.message).join(', ')}'`);
            return;
          });
          if (responsePr) {
            console.log(`✅ <PR> repo:${repo} title:${pr.title} url:${responsePr.data.html_url}`);
            let responsePrComments = {};
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
                  console.warn(`⚠️  <PR Comment> repo:'${repo}' title:'${pr.title}' error:'${err.response?.data?.errors?.map((e: any) => e.message).join(', ')}'`);
                });
                if (responsePrComment) responsePrComments[comment.id] = responsePrComment.data;
              } else {
                responsePrComment = await this.github.createIssueComment({
                  owner: this.options.githubOwner,
                  repo,
                  issue_number: responsePr.data.number,
                  body: comment.content.raw
                }).catch(err => {
                  console.warn(`⚠️  <PR Comment> repo:'${repo}' title:'${pr.title}' error:'${err.response?.data?.errors?.map((e: any) => e.message).join(', ')}'`);
                });
                if (responsePrComment) responsePrComments[comment.id] = responsePrComment.data;
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