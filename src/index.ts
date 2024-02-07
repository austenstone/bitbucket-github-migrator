import { Migrate } from "./migrate";
import inquirer from 'inquirer';

const questions = [] as {
  type: string;
  name: string;
  message: string;
}[];

if (!process.env.GITHUB_TOKEN) {
  questions.push({
    type: 'input',
    name: 'githubToken',
    message: 'What is your GitHub token?'
  });
}
if (!process.env.GITHUB_ORG) {
  questions.push({
    type: 'input',
    name: 'githubOwner',
    message: 'What is the destination GitHub org?'
  });
}

if (!process.env.BITBUCKET_TOKEN) {
  questions.push({
    type: 'input',
    name: 'bitbucketToken',
    message: 'What is your Bitbucket token?'
  });
}
if (!process.env.BITBUCKET_WORKSPACE) {
  questions.push({
    type: 'input',
    name: 'bitbucketWorkspace',
    message: 'What is the source Bitbucket workspace?'
  });
}

inquirer.prompt(questions).then(answers => {
  const migrate = new Migrate({
    bitbucketToken: process.env.BITBUCKET_TOKEN || answers.bitbucketToken,
    bitbucketWorkspace: process.env.BITBUCKET_WORKSPACE || answers.bitbucketWorkspace,
    githubToken: process.env.GITHUB_TOKEN || answers.githubToken,
    githubOwner: process.env.GITHUB_ORG || answers.githubOwner
  });
  migrate.run();
});