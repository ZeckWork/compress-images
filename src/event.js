import { readFileSync } from 'fs'
import { GITHUB_EVENT_PATH } from './constants'

const buffer = readFileSync(GITHUB_EVENT_PATH)

export default JSON.parse(buffer.toString())
