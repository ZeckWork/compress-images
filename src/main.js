const core = require('@actions/core')
const { wait } = require('./wait')
const compress = require('./compress').default
const { requestCommitChanges, requestLastCommitInTree, requestTree, requestCreateBlob, requestUpdateRef } = require('./github').default


/**
 * The main function for the action.
 * @returns {Promise<void>} Resolves when the action is complete.
 */
async function run() {
  try {
    const { optimisedImages } = await compress()

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

    const ms = core.getInput('milliseconds', { required: true })

    // Debug logs are only output if the `ACTIONS_STEP_DEBUG` secret is true
    core.debug(`Waiting ${ms} milliseconds ...`)

    core.setOutput('diff files', `${optimisedImages}`)

    // Log the current timestamp, wait, then log the new timestamp
    core.debug(new Date().toTimeString())
    await wait(parseInt(ms, 10))
    core.debug(new Date().toTimeString())

    // Set outputs for other workflow steps to use
    core.setOutput('time', new Date().toTimeString())
  } catch (error) {
    // Fail the workflow run if an error occurs
    core.setFailed(error.message)
  }
}

module.exports = {
  run
}
