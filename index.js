const path = require('path')
const express = require('express')
const bodyParser = require('body-parser')
const multer = require('multer')
const kue = require('kue')
const fs = require('fs')

const app = express()
const upload = multer({ dest: path.join(__dirname, 'uploads') })
const queue = kue.createQueue()

app.use(bodyParser.urlencoded({ extended: false }))

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'))
})

app.get('/convert', (req, res) => {
  const { url, options } = req.query
  console.log(options)
  const job = queue.createJob('photo', {
    url,
    options
  })
  .save(err => {
    if (err) {
      console.error(err)
    }
  })

  job.on('complete', result => {
    fs.createReadStream(result)
    .pipe(res)
  })
})

app.post('/upload', upload.single('photo'), (req, res) => {
  const { filename, originalname, destination } = req.file
  const job = queue.createJob('post photo', {
    filename,
    originalname,
    destination
  })
  .save(err => {
    if (err) {
      console.error(err)
    }
  })

  job.on('complete', result => {
    fs.createReadStream(result)
    .pipe(res)
  })
})

app.listen(3000)
