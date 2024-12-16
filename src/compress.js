import util from 'util'
const core = require('@actions/core')
const { globSync } = require('glob')
const { requestDiffFiles } = require('./github').default
import sharp from 'sharp'
import { extname } from 'path'
import { statSync, writeFileSync } from 'fs'
import {
  IGNORE_PATHS,
  JPEG_QUALITY,
  JPEG_PROGRESSIVE,
  PNG_QUALITY,
  WEBP_QUALITY,
  COMPRESS_ONLY,
  EXTENSION_TO_SHARP_FORMAT_MAPPING
} from './constants'

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

export default compress
