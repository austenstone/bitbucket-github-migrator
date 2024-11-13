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
Object.defineProperty(exports, "__esModule", { value: true });
exports.GitHub = void 0;
const rest_1 = require("@octokit/rest");
const plugin_throttling_1 = require("@octokit/plugin-throttling");
const MyOctokit = rest_1.Octokit.plugin(plugin_throttling_1.throttling);
class GitHub {
    constructor(token) {
        this.octokit = new MyOctokit({
            auth: token,
            throttle: {
                onRateLimit: (retryAfter, options, octokit, retryCount) => {
                    octokit.log.warn(`Request quota exhausted for request ${options.method} ${options.url}`);
                    if (retryCount < 1) {
                        octokit.log.info(`Retrying after ${retryAfter} seconds!`);
                        return true;
                    }
                    return retryCount < 1;
                },
                onSecondaryRateLimit: (_, options, octokit) => octokit.log.warn(`SecondaryRateLimit detected for request ${options.method} ${options.url}`),
            },
        });
    }
    createPullRequest(request) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.octokit.pulls.create(request);
        });
    }
    createIssueComment(request) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.octokit.issues.createComment(request);
        });
    }
    createPullRequestReviewComment(request) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.octokit.pulls.createReviewComment(request);
        });
    }
    createRepository(request) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.octokit.repos.createInOrg(request);
        });
    }
}
exports.GitHub = GitHub;
