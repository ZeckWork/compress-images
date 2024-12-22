const { readFileSync } = require('fs');
const { GITHUB_EVENT_PATH } = require('./constants');

const buffer = readFileSync(GITHUB_EVENT_PATH);

module.exports = JSON.parse(buffer.toString());
