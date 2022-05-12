import dotenv from 'dotenv'
import express from 'express'
import { logger, loggerConfig } from 'ratlogger'
import ratlogcr from '../.ratlog.js'
import { db } from './service/connector.module'
import { Router } from './service/router'
import { components } from './service/router.module'
import { setupConfig, _config } from './utils/configuration'
const buildStart = performance.now()

// setup
dotenv.config()
setupConfig()
loggerConfig(ratlogcr)
const { port, host } = _config.server

//db
db.connect()

//

const app = express()
app.use(express.json())

const router = new Router(components())
router.setup(app)
router.show()

logger.log('\n', '@{bold}Started the server process', '\n')

app.get('*', (req, res) => {
    res.send({ error: false, msg: 'default response' })
})

app.listen(port, () => {
    logger.log(
        'Server is active on',
        `@{yellow bold}${port}@{normal}`,
        `@{green}=> @{underline}http://${host}:${port}@{normal}`
    )
})

logger.log(
    '\n',
    'Project was builded in',
    `@{bold}${Math.ceil(performance.now() - buildStart)}ms`
)
