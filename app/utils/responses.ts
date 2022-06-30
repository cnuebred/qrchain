import { logger } from 'ratlogger'


type Response = {
    status: string
    msg: string
    data: { [index: string]: string }
    err: (status?: string, options?: { hide?: boolean, log?: boolean }) => Response
    push: (status?: string, options?: { hide?: boolean, log?: boolean }) => string
    ok: (status?: string, options?: { hide?: boolean, log?: boolean }) => Response
    fail: (status?: string, options?: { hide?: boolean, log?: boolean }) => Response
    hide: () => string
    log: () => Response
}
type ResponseStatus = { hide?: boolean, log?: boolean }

export const resp = (msg: string = '', data: { [index: string]: string } = {}): Response => {
    return {
        status: '',
        msg: msg,
        data: data,
        push(status?: string, options: ResponseStatus = { hide: false, log: false }) {
            this.status = status
            if (options.hide) return this.hide()
            return this
        },
        err(status: string = 'error', options: ResponseStatus) {
            return this.push(status, options)
        },
        fail(status: string = 'fail', options: ResponseStatus) {
            return this.push(status, options)
        },
        ok(status: string = 'ok', options: ResponseStatus) {
            return this.push(status, options)
        },
        hide() {
            return Buffer.from(JSON.stringify(this)).toString('base64')
        },
        log() {
            logger.log(this.hide())
            return this
        }

    }
}