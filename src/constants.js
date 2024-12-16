const path = require('path')
const core = require('@actions/core')

const REPO_DIRECTORY = process.env['GITHUB_WORKSPACE']
const GITHUB_EVENT_PATH = process.env['GITHUB_EVENT_PATH']
const GITHUB_TOKEN =
  process.env['INPUT_GITHUBTOKEN'] || process.env['GITHUB_TOKEN']

const JPEG_QUALITY = parseInt(core.getInput('jpegQuality') || 80)
const PNG_QUALITY = parseInt(core.getInput('pngQuality') || 80)
const WEBP_QUALITY = parseInt(core.getInput('webpQuality') || 80)

const COMPRESS_ONLY = (core.getInput('compressOnly') || 'true') === 'true'
const JPEG_PROGRESSIVE = (core.getInput('jpegProgressive') || 'true') === 'true'

const IGNORE_PATHS = process.env['INPUT_IGNOREPATHS']
  ? process.env['INPUT_IGNOREPATHS'].split(',')
  : []

const EXTENSION_TO_SHARP_FORMAT_MAPPING = {
  '.png': 'png',
  '.jpg': 'jpeg',
  '.jpeg': 'jpeg',
  '.webp': 'webp'
}

const COMMITER = {
  name: process.env['INPUT_COMMITERNAME'],
  email: process.env['INPUT_COMMITEREMAIL']
}

const CONFIG_PATH = path.join(
  REPO_DIRECTORY,
  '.github/ZeckWork/compress-images.yml'
)

export {
  COMMITER,
  CONFIG_PATH,
  IGNORE_PATHS,
  GITHUB_TOKEN,
  REPO_DIRECTORY,
  GITHUB_EVENT_PATH,
  EXTENSION_TO_SHARP_FORMAT_MAPPING,
  JPEG_QUALITY,
  PNG_QUALITY,
  WEBP_QUALITY,
  COMPRESS_ONLY,
  JPEG_PROGRESSIVE
}
