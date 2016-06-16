const path = require('path')
const kue = require('kue')
const imagemagick = require('imagemagick')
const fs = require('fs')
const request = require('request')
const uuid = require('uuid')

const queue = kue.createQueue()

queue.process('photo', (job, done) => {
  const { url, options } = job.data
  getPhoto(url)
    .then(photoPath => {
      const fileName = path.parse(photoPath).base
      const outFilePath = path.join(__dirname, 'processed', fileName)

      let imageMagickOptions = []

      if (!options) {
        done(err, outFilePath)
      }

      if (options.color) {
        imageMagickOptions.push('-set', 'colorspace', options.color)
      }

      if (options.size) {
        imageMagickOptions.push('-resize', options.size)
      }

      imagemagick.convert([photoPath, ...imageMagickOptions, outFilePath], err => {
        done(err, outFilePath)
      })
    })
})

queue.process('post photo', (job, done) => {
  const { filename, originalname, destination } = job.data
  const fileExt = originalname.split('.').pop()
  const outFilename = `${filename}.${fileExt}`
  const outFilePath = path.join(destination, outFilename)
  imagemagick.convert([path.join(destination, filename), '-set', 'colorspace', 'Gray', outFilePath], err => {
    done(err, outFilePath)
  })
})

function getPhoto (url) {
  return new Promise((resolve, reject) => {
    const ext = path.parse(url).ext
    const outPath = path.join(__dirname, 'uploads', uuid.v4() + ext)
    request({
      method: 'GET',
      url
    })
    .pipe(fs.createWriteStream(outPath))
    .on('close', () => {
      console.log('done')
      resolve(outPath)
    })
    .on('error', err => reject(err))
  })
}
