const core = require('@actions/core')
const { getOctokit } = require('@actions/github')

const GITHUB_TOKEN = core.getInput('github_token')

module.exports = getOctokit(GITHUB_TOKEN)
