const { getOctokit } = require("@actions/github");

const GITHUB_TOKEN = process.env['INPUT_GITHUBTOKEN'] || process.env['GITHUB_TOKEN']

module.exports = getOctokit(GITHUB_TOKEN)
