#!/usr/bin/env node
import { Migrate } from "./migrate.js";
import inquirer from 'inquirer';
import 'dotenv/config';
const questions = [];
if (!process.env.GITHUB_TOKEN) {
    questions.push({
        type: 'input',
        name: 'githubToken',
        message: 'GitHub token',
        default: 'ghp_1234567890abcdefghijklmnopqrstuvwxyz'
    });
}
if (!process.env.GITHUB_ORG) {
    questions.push({
        type: 'input',
        name: 'githubOwner',
        message: 'What is the destination GitHub org',
        default: 'my-org'
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
    required: true
});
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
