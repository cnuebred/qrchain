import { Configuration } from '../config/config.d'

export const _config: Configuration = require('../config/config.dev')

const pushToConfig = (_package: { [index: string]: string }) => {
    Object.entries(_package).forEach(([key, value]) => {
        _config[key] = value
    })
}
export const setupConfig = async () => {
    const mode = process.env.MODE
    if (mode == 'dev') {
        pushToConfig(require('../config/config.dev'))
    } else if (mode == 'prod') {
        pushToConfig(require('../config/config.prod'))
    }
}
