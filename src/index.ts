#!/usr/bin/env node
import { Migrate } from "./migrate.js";
import inquirer, { DistinctQuestion } from 'inquirer';
import { Command } from 'commander';
import 'dotenv/config'
import { GitHub } from "./github.js";

const questions: DistinctQuestion[] = [];

const commander = new Command();
commander
  .name('bitbucket-github-migrator')
  .description('Migrate from Bitbucket to GitHub')
  .version('1.6.1', '-v, --version')
  .option('-bt, --bitbucket-token <token>', 'Bitbucket token')
  .option('-gt, --github-token <token>', 'GitHub token')
  .parse();

const options = commander.opts();

if (!process.env.GITHUB_TOKEN ) {
  const question = {
    type: 'input',
    name: 'githubToken',
    message: 'GitHub token',
    default: 'ghp_1234567890abcdefghijklmnopqrstuvwxyz',
    when: () => !options.githubToken
  } as DistinctQuestion;
  const answers = await inquirer.prompt(question);
  process.env.GITHUB_TOKEN = options.githubToken || answers.githubToken
  questions.push(question);
}

if (!process.env.GITHUB_ORG) {
  const orgs = await new GitHub(process.env.GITHUB_TOKEN!).getOrgs().catch(() => {
    console.log('⚠️  Failed to fetch orgs');
  });
  questions.push({
    type: orgs ? 'checkbox' : 'input',
    name: 'githubOwner',
    message: 'What is the destination GitHub org',
    choices: orgs?.data.map((org: { login: string }) => org.login),
    required: true,
    askAnswered: false
  });
}

if (!process.env.BITBUCKET_TOKEN) {
  questions.push({
    type: 'input',
    name: 'bitbucketToken',
    message: 'Bitbucket token',
    default: 'ATATT3xFfGF0_cx16PdoFM9UfxBqJEAXn8IsV8DHm44nUm8C679vf4w9ki1gE108TmfBhojuYFXV2l9Ms5Pai_J0aXJV7PWtjusR3KVz9Rr1O4ayzoiAoF9ctovPeAXvFoGr2Sce58pDagLlU4Zy0Wkrl8-TpXq5AsYdF6FOSXhExiBFGOUmDtc=7AB98509'
  });
}
if (!process.env.BITBUCKET_WORKSPACE) {
  questions.push({
    type: 'input',
    name: 'bitbucketWorkspace',
    message: 'What is the source Bitbucket workspace',
    default: 'my-workspace'
  });
}

questions.push({
  type: 'checkbox',
  name: 'whatToMigrate',
  message: 'What do you want to migrate',
  choices: [
    { name: 'Repositories', value: 'repositories', checked: true },
    { name: 'Pull Requests', value: 'pullRequests', description: 'CAUTION EXPERIMENTAL' },
    { name: 'Issues', value: 'issues', disabled: 'not yet implemented' },
    { name: 'Wiki', value: 'wiki', disabled: 'not yet implemented' },
    { name: 'Projects', value: 'projects', disabled: 'not yet implemented' },
  ],
  required: true,
  askAnswered: false
})

inquirer.prompt(questions).then(answers => {
  const migrate = new Migrate({
    whatToMigrate: answers.whatToMigrate,
    bitbucketToken: process.env.BITBUCKET_TOKEN || answers.bitbucketToken,
    bitbucketWorkspace: process.env.BITBUCKET_WORKSPACE || answers.bitbucketWorkspace,
    githubToken: process.env.GITHUB_TOKEN || answers.githubToken,
    githubOwner: process.env.GITHUB_ORG || answers.githubOwner,
    bitbucketThrottling: {
      timeout: parseInt(process.env.BITBUCKET_THROTTLE || '0')
    }
  });
  migrate.run();
});