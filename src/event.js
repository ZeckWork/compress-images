const { readFileSync } = require('fs');

const GITHUB_EVENT_PATH = process.env['GITHUB_EVENT_PATH']

const buffer = readFileSync(GITHUB_EVENT_PATH)

module.exports = JSON.parse(buffer.toString)
