import winston from "winston";

const LOG_DIR = './log'

const logger = winston.createLogger({
    level: 'info', // tous les levels inférieurs ou égal à info (tout sauf debug (voir doc))
    format: winston.format.combine(
        winston.format.timestamp({format: 'YYYY-MM-DD HH:mm:ss.SSS'}),
        winston.format.printf((info) => {
            return JSON.stringify({
                timestamp: info.timestamp,
                service: 'audio-server',
                level: info.level,
                message: info.message
            });
        })
    ),
    transports: [
        new winston.transports.Console(),
        new winston.transports.File({ filename: `${LOG_DIR}/error-play-song.log`, level: 'error' })
    ],
})

export { logger }