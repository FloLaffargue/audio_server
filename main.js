import express from 'express'
import cors from 'cors'
import bodyParser from 'body-parser'
import {spawn} from "child_process";
import fs from "fs";
import nodeId3 from 'node-id3'
import config from './config.js'

const app = express()
let p
let music = null
let stopRadio = false
let MUSIC_PATH_DIR = config.MUSIC_PATH_DIR
let MP4_TRANSCODING_SONG_PATH = config.MP4_TRANSCODING_SONG_PATH

app.use(cors())
app.use(bodyParser.json())

app.listen(3100, () => { console.log('Listening') })

app.get('/api/radio/:people/start', async (req, res, next) => {
    const people = req.params.people

    if (!music) {
        console.log('start radio for people ' + people)
        play()
    }
    res.status(200).json({
        message: 'process started',
        music: music
    })
})

app.get('/api/radio/:people/stop', async (req, res, next) => {
    console.log('stop radio')
    stopRadio = true
    p.kill()
    console.log('Process stopped')
    res.status(200).json({
        message: 'process stopped'
    })
})

app.get('/api/radio/playing', async (req, res, next) => {

    if (music) {
        nodeId3.read(MUSIC_PATH_DIR + '/' + music, (err, tags) => {
            console.log('Currently playing ' + tags.title, tags.artist)
            let data
            if (tags.title === undefined || tags.artist === undefined) {
                data = music
            } else {
                data = `${tags.artist} : ${tags.title}`
            }
            res.status(200).json({
                data
            })
        })
    } else {
        res.status(200).json({
            message: "No music on going"
        })
    }
})

// const files = fs.readdirSync(MUSIC_PATH_DIR)
// files.forEach((music) => {
//     nodeId3.read(MUSIC_PATH_DIR + '/' + music, (err, tags) => {
//         console.log(`${tags.artist} : ${tags.title}`)
//     })
// })

function chooseRandomMusic () {
    try {
        const files = fs.readdirSync(MUSIC_PATH_DIR)
        const random = Math.floor(Math.random() * files.length)
        return files[random]
    } catch (e) {
        console.error(e)
    }
}

function play () {
    music = chooseRandomMusic()
    console.log(`Playing [${music}]`)

    const command = 'ffmpeg'
    const commandArgs = ['-re', '-y', '-i', MUSIC_PATH_DIR + '/' + music, MP4_TRANSCODING_SONG_PATH, '-f', 'rtsp', 'rtsp://127.0.0.1:8554/stream']

    const out = fs.openSync(`./ffmpeg.log.check`, 'a');
    const err = fs.openSync(`./ffmpeg.error.log`, 'a');

    p = spawn(command, commandArgs, {
        stdio: ['ignore', out, err]
    })

    p.on('error', function (msg) {
        console.error(msg)
        // logger.error({subProcess, event: 'error', msg})
    })

    p.on('close', function (code) {
        console.log('Process closed with code ' + code)
        if (code !== 0) {
            console.log('Error on song ' + music)
        }
        if (stopRadio) {
            music = null
            stopRadio = false
        } else {
            play()
        }
        // logger.info({subProcess, event: 'close', msg: `${filePath} Process exited with code ${code}`})
    })

}
