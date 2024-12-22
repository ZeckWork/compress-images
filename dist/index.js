require('./sourcemap-register.js');/******/ (() => { // webpackBootstrap
/******/ 	var __webpack_modules__ = ({

/***/ 222:
/***/ ((module, __unused_webpack_exports, __nccwpck_require__) => {

const util = __nccwpck_require__(23)
const core = __nccwpck_require__(457)
const { globSync } = __nccwpck_require__(758)
const { requestDiffFiles } = __nccwpck_require__(221)
const sharp = __nccwpck_require__(260)
const { extname } = __nccwpck_require__(928)
const { statSync, writeFileSync } = __nccwpck_require__(896)

const {
  IGNORE_PATHS,
  JPEG_QUALITY,
  JPEG_PROGRESSIVE,
  PNG_QUALITY,
  WEBP_QUALITY,
  COMPRESS_ONLY,
  EXTENSION_TO_SHARP_FORMAT_MAPPING
} = __nccwpck_require__(245)

const config = {
  jpeg: { quality: JPEG_QUALITY, progressive: JPEG_PROGRESSIVE },
  png: { quality: PNG_QUALITY },
  webp: { quality: WEBP_QUALITY },
  ignorePaths: IGNORE_PATHS,
  compressOnly: COMPRESS_ONLY
}

async function compress() {
  const diffFiles = await requestDiffFiles()
  const files = globSync(diffFiles, {
    ignore: IGNORE_PATHS,
    nodir: true,
    follow: false,
    dot: true
  })

  let optimisedImages = []
  let unoptimisedImages = []

  for (const file of files) {
    try {
      core.info(`file ${file}`)
      const beforeStat = statSync(file).size
      const extension = extname(file)
      const sharpFormat = EXTENSION_TO_SHARP_FORMAT_MAPPING[extension]

      const { data, info } = await sharp(file)
        .toFormat(sharpFormat, config[sharpFormat])
        .toBuffer({ resolveWithObject: true })

      const name = file.split('/').slice(-2).join('/')
      const afterStat = info.size
      const percentChange = (afterStat / beforeStat) * 100 - 100

      const compressionWasSignificant = percentChange < -1

      const processedImage = {
        name,
        content: data,
        path: file,
        beforeStat,
        afterStat,
        percentChange,
        compressionWasSignificant
      }

      if (compressionWasSignificant) {
        writeFileSync(file, data)

        optimisedImages.push(processedImage)
      } else {
        unoptimisedImages.push(processedImage)
      }
    } catch (error) {
      core.error(error)
      core.error(`Error on processing ${file}`)
    }
  }

  return {
    optimisedImages,
    unoptimisedImages
  }
}

module.exports = compress


/***/ }),

/***/ 245:
/***/ ((__unused_webpack_module, __webpack_exports__, __nccwpck_require__) => {

"use strict";
__nccwpck_require__.r(__webpack_exports__);
/* harmony export */ __nccwpck_require__.d(__webpack_exports__, {
/* harmony export */   COMMITER: () => (/* binding */ COMMITER),
/* harmony export */   COMPRESS_ONLY: () => (/* binding */ COMPRESS_ONLY),
/* harmony export */   CONFIG_PATH: () => (/* binding */ CONFIG_PATH),
/* harmony export */   EXTENSION_TO_SHARP_FORMAT_MAPPING: () => (/* binding */ EXTENSION_TO_SHARP_FORMAT_MAPPING),
/* harmony export */   GITHUB_EVENT_PATH: () => (/* binding */ GITHUB_EVENT_PATH),
/* harmony export */   GITHUB_TOKEN: () => (/* binding */ GITHUB_TOKEN),
/* harmony export */   IGNORE_PATHS: () => (/* binding */ IGNORE_PATHS),
/* harmony export */   JPEG_PROGRESSIVE: () => (/* binding */ JPEG_PROGRESSIVE),
/* harmony export */   JPEG_QUALITY: () => (/* binding */ JPEG_QUALITY),
/* harmony export */   PNG_QUALITY: () => (/* binding */ PNG_QUALITY),
/* harmony export */   REPO_DIRECTORY: () => (/* binding */ REPO_DIRECTORY),
/* harmony export */   WEBP_QUALITY: () => (/* binding */ WEBP_QUALITY)
/* harmony export */ });
const path = __nccwpck_require__(928)
const core = __nccwpck_require__(457)

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




/***/ }),

/***/ 332:
/***/ ((module, __unused_webpack_exports, __nccwpck_require__) => {

const { readFileSync } = __nccwpck_require__(896)
const { GITHUB_EVENT_PATH } = __nccwpck_require__(245)

const buffer = readFileSync(GITHUB_EVENT_PATH)

module.exports = JSON.parse(buffer.toString())


/***/ }),

/***/ 221:
/***/ ((module, __unused_webpack_exports, __nccwpck_require__) => {

const { readFileSync } = __nccwpck_require__(896)
const event = __nccwpck_require__(332)
const { rest } = __nccwpck_require__(321)
const { COMMITER, REPO_DIRECTORY } = __nccwpck_require__(245)

const { number, repository, pull_request } = event

async function requestDiffFiles() {
  const pull_number = number
  const repo = repository.name
  const owner = repository.owner.login

  const response = await rest.pulls.listFiles({
    owner,
    repo,
    pull_number,
    mediaType: {
      format: 'text'
    }
  })

  return response.data
    .filter(file => file.status != 'removed')
    .map(file => `${REPO_DIRECTORY}/**/${file.filename.split('/').slice(-1)}`)
}

async function requestLastCommitInTree() {
  const repo = repository.name
  const owner = repository.owner.login
  const commit_sha = pull_request.head.sha

  const response = await rest.git.getCommit({
    owner,
    repo,
    commit_sha
  })

  return response.data.tree.sha
}

async function requestCreateBlob(image) {
  const { name, path } = image
  const encoding = 'base64'
  const content = readFileSync(path, { encoding })

  const repo = repository.name
  const owner = repository.owner.login

  const response = await rest.git.createBlob({
    repo,
    owner,
    encoding,
    content
  })

  return {
    path: name,
    type: 'blob',
    mode: '100644',
    sha: response.data.sha
  }
}

async function requestTree(base_tree, tree) {
  const repo = repository.name
  const owner = repository.owner.login

  const response = await rest.git.createTree({
    owner,
    repo,
    base_tree,
    tree
  })

  return response.data.sha
}

async function requestCommitChanges(message, tree) {
  const repo = repository.name
  const owner = repository.owner.login
  const ref = pull_request.head.sha

  const response = await rest.git.createCommit({
    repo,
    owner,
    message,
    tree,
    parents: [ref],
    committer: COMMITER
  })

  return response.data
}

async function requestUpdateRef(sha) {
  const repo = repository.name
  const owner = repository.owner.login
  const ref = pull_request.head.ref

  await rest.git.updateRef({
    owner,
    repo,
    ref,
    sha
  })
}

async function requestComment(body) {
  const repo = repository.name
  const owner = repository.owner.login

  rest.issues.createComment({
    owner,
    repo,
    issue_number: number,
    body
  })
}

module.exports = {
  requestDiffFiles,
  requestLastCommitInTree,
  requestCreateBlob,
  requestTree,
  requestCommitChanges,
  requestUpdateRef,
  requestComment
}


/***/ }),

/***/ 127:
/***/ ((module, __unused_webpack_exports, __nccwpck_require__) => {

const core = __nccwpck_require__(457)
const { wait } = __nccwpck_require__(623)
const compress = (__nccwpck_require__(222)["default"])
const {
  requestCommitChanges,
  requestLastCommitInTree,
  requestTree,
  requestCreateBlob,
  requestUpdateRef,
  requestComment
} = (__nccwpck_require__(221)["default"])
const generateMarkdownReport = __nccwpck_require__(272)

/**
 * The main function for the action.
 * @returns {Promise<void>} Resolves when the action is complete.
 */
async function run() {
  try {
    const images = await compress()
    const { optimisedImages } = images

    core.debug('optimisedImages: ', `${JSON.stringify(optimisedImages)}`)

    const baseTree = await requestLastCommitInTree()
    let blobs = []

    for (var i = 0; i < optimisedImages.length; i++) {
      const image = await requestCreateBlob(optimisedImages[i])
      blobs.push(image)
      core.info(image)
    }

    if (optimisedImages.length == 0) {
      core.info('No optmized images')
      return
    }

    const tree = await requestTree(baseTree, blobs)

    const commit = await requestCommitChanges(
      'refactor: imagens otimizadas.',
      tree
    )

    core.debug(JSON.stringify(commit))

    await requestUpdateRef(commit.sha)

    await requestComment(await generateMarkdownReport(images))
  } catch (error) {
    // Fail the workflow run if an error occurs
    core.setFailed(error.message)
  }
}

module.exports = {
  run
}


/***/ }),

/***/ 321:
/***/ ((module, __unused_webpack_exports, __nccwpck_require__) => {

const core = __nccwpck_require__(457)
const { getOctokit } = __nccwpck_require__(945)

const GITHUB_TOKEN = core.getInput('github_token')

module.exports = getOctokit(GITHUB_TOKEN)


/***/ }),

/***/ 272:
/***/ ((module, __unused_webpack_exports, __nccwpck_require__) => {

const ejs = __nccwpck_require__(228)
const { join } = __nccwpck_require__(928)
const { filesize } = __nccwpck_require__(643)
const { createHash } = __nccwpck_require__(982)
const { number, repository, pull_request } = __nccwpck_require__(332)
const {
  IGNORE_PATHS,
  JPEG_QUALITY,
  JPEG_PROGRESSIVE,
  PNG_QUALITY,
  WEBP_QUALITY,
  COMPRESS_ONLY,
  EXTENSION_TO_SHARP_FORMAT_MAPPING
} = __nccwpck_require__(245)

const EJS_OPTIONS = { async: true }

const template = (basename, variables) => {
  const filePath = __nccwpck_require__.ab + "templates/" + basename
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


/***/ }),

/***/ 623:
/***/ ((module) => {

/**
 * Wait for a number of milliseconds.
 *
 * @param {number} milliseconds The number of milliseconds to wait.
 * @returns {Promise<string>} Resolves with 'done!' after the wait is over.
 */
async function wait(milliseconds) {
  return new Promise(resolve => {
    if (isNaN(milliseconds)) {
      throw new Error('milliseconds not a number')
    }

    setTimeout(() => resolve('done!'), milliseconds)
  })
}

module.exports = { wait }


/***/ }),

/***/ 457:
/***/ ((module) => {

module.exports = eval("require")("@actions/core");


/***/ }),

/***/ 945:
/***/ ((module) => {

module.exports = eval("require")("@actions/github");


/***/ }),

/***/ 228:
/***/ ((module) => {

module.exports = eval("require")("ejs");


/***/ }),

/***/ 758:
/***/ ((module) => {

module.exports = eval("require")("glob");


/***/ }),

/***/ 643:
/***/ ((module) => {

module.exports = eval("require")("humanize");


/***/ }),

/***/ 260:
/***/ ((module) => {

module.exports = eval("require")("sharp");


/***/ }),

/***/ 982:
/***/ ((module) => {

"use strict";
module.exports = require("crypto");

/***/ }),

/***/ 896:
/***/ ((module) => {

"use strict";
module.exports = require("fs");

/***/ }),

/***/ 928:
/***/ ((module) => {

"use strict";
module.exports = require("path");

/***/ }),

/***/ 23:
/***/ ((module) => {

"use strict";
module.exports = require("util");

/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __nccwpck_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		var threw = true;
/******/ 		try {
/******/ 			__webpack_modules__[moduleId](module, module.exports, __nccwpck_require__);
/******/ 			threw = false;
/******/ 		} finally {
/******/ 			if(threw) delete __webpack_module_cache__[moduleId];
/******/ 		}
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/define property getters */
/******/ 	(() => {
/******/ 		// define getter functions for harmony exports
/******/ 		__nccwpck_require__.d = (exports, definition) => {
/******/ 			for(var key in definition) {
/******/ 				if(__nccwpck_require__.o(definition, key) && !__nccwpck_require__.o(exports, key)) {
/******/ 					Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
/******/ 				}
/******/ 			}
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/hasOwnProperty shorthand */
/******/ 	(() => {
/******/ 		__nccwpck_require__.o = (obj, prop) => (Object.prototype.hasOwnProperty.call(obj, prop))
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/make namespace object */
/******/ 	(() => {
/******/ 		// define __esModule on exports
/******/ 		__nccwpck_require__.r = (exports) => {
/******/ 			if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 				Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 			}
/******/ 			Object.defineProperty(exports, '__esModule', { value: true });
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/compat */
/******/ 	
/******/ 	if (typeof __nccwpck_require__ !== 'undefined') __nccwpck_require__.ab = __dirname + "/";
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};
/**
 * The entrypoint for the action.
 */
const { run } = __nccwpck_require__(127)

run()

module.exports = __webpack_exports__;
/******/ })()
;
//# sourceMappingURL=index.js.map