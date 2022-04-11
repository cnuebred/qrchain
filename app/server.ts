import express from 'express'
import { components } from './router/router.module'
import { loggerConfig, logger } from 'ratlogger'
import ratlogcr from '../.ratlog.js'
import { Router } from './router/router'

const buildStart = performance.now()
const app = express()

app.use(express.json())
loggerConfig(ratlogcr)

logger.log('\n', '@{bold}Started the server process', '\n')

const router = new Router(components())
router.setup(app)
router.show()

app.get('*', (req, res) => {
    res.send({ error: false, msg: 'default response' })
})

app.listen(8080, () => {
    logger.log(
        'Server is active on',
        '@{yellow bold}8080@{normal}',
        '@{green}=> @{underline}http://localhost:8080@{normal}'
    )
})

logger.log(
    '\n',
    'Project was builded in',
    `@{bold}${Math.ceil(performance.now() - buildStart)}ms`
)
