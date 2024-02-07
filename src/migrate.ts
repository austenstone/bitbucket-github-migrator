import { BitBucket } from "./bitbucket";
import { GitHub } from "./github";

export interface MigrateOptions {
  bitbucketWorkspace: string;
  githubOwner: string;
  bitbucketToken: string;
  githubToken: string;
  bitbucketThrottling?: {
    timeout: number;
  }
}

export class Migrate {
  bitbucket: BitBucket;
  github: GitHub;
  options: MigrateOptions;

  constructor(options: MigrateOptions) {
    this.options = options;
    this.bitbucket = new BitBucket(this.options.bitbucketToken, this.options.bitbucketThrottling?.timeout);
    this.github = new GitHub(this.options.githubToken);
  }

  async run() {
    if (!this.options.bitbucketWorkspace) throw new Error('bitbucketWorkspace input is required');
    if (!this.options.githubOwner) throw new Error('githubOwner input is required');
    console.log(`🚀 Migrating from Bitbucket workspace '${this.options.bitbucketWorkspace}' to GitHub org '${this.options.githubOwner}'`)
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
              const in_reply_to = comment.parent?.id ? responsePrComments[comment.parent.id].id : undefined;
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
    console.log('🎉 All done!');
  }
}