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
    for (const [repo, prs] of Object.entries(pullRequests)) {
      for (const pr of prs) {
        console.log(`Creating PR for ${repo} - ${pr.title}`);
        try {
          await this.github.createPullRequest({
            owner: this.options.githubOwner,
            repo,
            title: pr.title,
            head: pr.source.branch.name,
            base: pr.destination.branch.name,
            body: pr.summary.markup,
            head_repo: pr.source?.repository?.full_name,
            draft: pr.state === 'OPEN'
          });
        } catch (err) {
          if ((err as any).status === 422) {
            console.log(`PR for ${repo} - ${pr.title} already exists`);
          } else {
            throw err;
          }
        }
      }
    }
    console.log(`Finished migrating ${Object.keys(pullRequests).length} repositories and ${Object.values(pullRequests).flat().length} pull requests`);
  }
}