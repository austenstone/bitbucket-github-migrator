import { BitBucket } from "./bitbucket";
import { GitHub } from "./github";

export interface MigrateOptions {
  bitbucketWorkspace?: string;
  githubOwner?: string;
  bitbucketToken: string;
  githubToken: string;
}

export class Migrate {
  bitbucket: BitBucket;
  github: GitHub;
  options: MigrateOptions;

  constructor(options: MigrateOptions) {
    this.options = options;
    this.bitbucket = new BitBucket(this.options.bitbucketToken);
    this.github = new GitHub(this.options.githubToken);
  }

  async run() {
    if (!this.options.bitbucketWorkspace) throw new Error('bitbucketWorkspace input is required');
    if (!this.options.githubOwner) throw new Error('githubOwner input is required');
    const pullRequests = await this.bitbucket.listAllPullRequests(this.options.bitbucketWorkspace);
    console.log(`🚀 Found ${Object.values(pullRequests).reduce((acc, prs) => acc + prs.length, 0)} pull requests to migrate`)
    for (const [repo, prs] of Object.entries(pullRequests)) {
      for (const pr of prs) {
        const response = await this.github.createPullRequest({
          owner: this.options.githubOwner,
          repo,
          title: pr.title,
          head: pr.source.branch.name,
          base: pr.destination.branch.name,
          body: pr.summary.markup,
          head_repo: pr.source?.repository?.full_name,
        }).catch(err => {
          console.warn(`⚠️  <PR> repo:'${repo}' title:'${pr.title}' error:'${err.response?.data?.errors?.map((e: any) => e.message).join(', ')}'`);
        });
        if (response) {
          console.log(`✅ <PR> repo:${repo} title:${pr.title} url:${response.data.html_url}`);
        }
      }
      console.log(`✨ ${repo} - ${prs.length} pull requests migrated`);
    }
    console.log('🎉 All done!');
  }
}