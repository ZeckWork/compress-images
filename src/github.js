import { readFileSync } from 'fs'
import event from './event'
import { rest } from './octokit'
import { COMMITER } from './constants'
import { REPO_DIRECTORY } from './constants'
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
        .filter((file) => file.status != 'removed')
        .map((file) => `${REPO_DIRECTORY}/**/${file.filename.split('/').slice(-1)}`)
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
    const commit_sha = pull_request.head.sha

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

export default {
    requestDiffFiles,
    requestLastCommitInTree,
    requestCreateBlob,
    requestTree,
    requestCommitChanges,
    requestUpdateRef,
    requestComment
}