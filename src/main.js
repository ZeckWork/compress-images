const core = require('@actions/core')
const { wait } = require('./wait')
const compress = require('./compress').default
const { requestCommitChanges, requestLastCommitInTree, requestTree, requestCreateBlob, requestUpdateRef, requestComment } = require('./github').default
const generateMarkdownReport = require('./template')

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

    const commit = await requestCommitChanges('refactor: imagens otimizadas.', tree)

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
