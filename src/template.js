const ejs = require('ejs')
const { join } = require('path')
const { filesize } = require('humanize')
const { createHash } = require('crypto')
const { number, repository, pull_request } = require('./event')
const {
  IGNORE_PATHS,
  JPEG_QUALITY,
  JPEG_PROGRESSIVE,
  PNG_QUALITY,
  WEBP_QUALITY,
  COMPRESS_ONLY,
  EXTENSION_TO_SHARP_FORMAT_MAPPING
} = require('./constants')

const EJS_OPTIONS = { async: true }

const template = (basename, variables) => {
  const filePath = join(__dirname, '..', 'templates', basename)
  return ejs.renderFile(filePath, variables, EJS_OPTIONS)
}

const config = {
  jpeg: { quality: JPEG_QUALITY, progressive: JPEG_PROGRESSIVE },
  png: { quality: PNG_QUALITY },
  webp: { quality: WEBP_QUALITY },
  ignorePaths: IGNORE_PATHS,
  compressOnly: COMPRESS_ONLY
}

const generateImage = (images, pr, commit) => {
  return images.map(image => {
    return {
      ...image,
      formattedBeforeStat: filesize(image.beforeStat),
      formattedAfterStat: filesize(image.afterStat),
      formattedPercentChange: `${image.percentChange.toFixed(1)}%`,
      diffUrl: commit && pr ? generateDiffUrl(image, pr, commit) : null
    }
  })
}

const generateDiffUrl = (image, pr, commit) => {
  const fileId = createHash('md5').update(image.name).digest('hex')
  const shortFileId = fileId.slice(0, 7)
  const repo = repository.name

  const url = `/${repo}/pull/${pr}/commits/${commit}?short_path=${shortFileId}#diff-${fileId}`

  return url
}

const generateMarkdownReport = async (images, commit) => {
  const { optimisedImages, unoptimisedImages } = images
  const templateName =
    commit && !config.compressOnly
      ? 'inline-pr-comment-with-diff.md'
      : 'pr-comment.md'

  const markdown = await template(templateName, {
    overallPercentageSaved: 0,
    overallBytesSaved: 0,
    optimisedImages: generateImage(optimisedImages, number, commit),
    unoptimisedImages: generateImage(unoptimisedImages, number)
  })

  return markdown
}

module.exports = generateMarkdownReport
