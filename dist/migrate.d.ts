import { BitBucket } from "./bitbucket.js";
import { GitHub } from "./github.js";
import { SimpleGit } from "simple-git";
export interface MigrateOptions {
    bitbucketWorkspace: string;
    githubOwner: string;
    bitbucketToken: string;
    githubToken: string;
    bitbucketThrottling?: {
        timeout: number;
    };
    whatToMigrate: string[];
}
export declare class Migrate {
    bitbucket: BitBucket;
    github: GitHub;
    options: MigrateOptions;
    git: SimpleGit;
    root: string;
    reposFolder: string;
    constructor(options: MigrateOptions);
    run(): Promise<void>;
}
