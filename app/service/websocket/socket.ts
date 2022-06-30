import { RawData, WebSocketServer } from 'ws'
import { logger } from 'ratlogger'
import { createServer, Server } from 'http'
import { _config } from '../../utils/configuration'
import url from 'url'
import { db } from '../connector/connector.module'

type QrChainSocketConn = {
    hash: string
    path?: string
    timestamp_exp?: number
    archive?: boolean
}

export class QrChainSocket {
    serverSocket: WebSocketServer
    hash: string
    path: string
    timestamp_created_at: number
    timestamp_exp: number
    archive: boolean
    constructor({ hash, path, timestamp_exp, archive }: QrChainSocketConn) {
        this.hash = hash
        this.archive = archive
        path = path || this.hash
        this.timestamp_created_at = Date.now()
        this.timestamp_exp = this.timestamp_created_at + timestamp_exp || (1000 * 60 * 15)
        this.path = path.startsWith('/') ? path : '/' + path
        this.serverSocket = new WebSocketServer({ noServer: true })
        this.open()
    }
    is_active() { return Date.now() < this.timestamp_exp }
    open() {
        this.serverSocket.on('connection', (socket, req) => {
            socket.on('message', (msg) => this.onmessage(msg))
            socket.on('error', (err) => {
                throw new Error(err.message)
            })
        })
    }
    destroy() {
        this.serverSocket.close()
    }
    private send_to_all = (msg) => {
        if (this.archive) {
            const save_msg = (msg, part = 0) => {
                let next = false
                let msg_part = msg
                if (msg.length > 3500) {
                    next = true
                    msg_part = msg.slice(0, 3500)
                }

                db.query(`insert into qr_messages 
                    ( hash, message, next) values ('${this.hash}', '${msg_part} ${part}', '${next}')`)
                if (next)
                    save_msg(msg.slice(3500), part + 1)
            }
            save_msg(msg)
        }
        this.serverSocket.clients.forEach(client => {
            client.send(msg)
        })
    }
    private onmessage = (msg: RawData) => {
        this.send_to_all(msg)
    }
}

export class QrChainServerSocket {
    tree: { [index: string]: QrChainSocket } = {}
    server: Server
    constructor() { }
    createSocket = async (hash) => {
        const qr_code = await db.query(`
            select * from qr_code where hash='${hash[1]}'
        `   )

        if (!qr_code.ok())
            return false

        const wss = new QrChainSocket({
            hash: qr_code.get<string>('hash'),
            path: hash[0],
            archive: qr_code.get<boolean>('archive', 0) || false
        })
        this.tree[wss.hash] = wss
        return wss
    }
    run(port: number = _config.ws.port) {
        this.server = createServer()
        this.server.on('upgrade', async (req, socket, head) => {
            const { pathname } = url.parse(req.url)
            const hash = pathname.match(/^\/(\w+)\/?/)
            if (!hash) return socket.destroy()
            const wss = !this.tree[hash[1]] ? (await this.createSocket(hash)) : this.tree[hash[1]]
            if (!wss) return socket.destroy()
            wss.serverSocket.handleUpgrade(req, socket, head, (ws) => {
                wss.serverSocket.emit('connection', ws, req)
            })

        })
        this.server.listen(port)
        logger.component('\n', '@{ blue } wss server|@{ green } Web Socket Server is running on',
            `ws://${_config.ws.host}:${_config.ws.port}`)
    }
    private destroy_non_active = () => {
        Object.entries(this.tree).forEach(([key, value]) => {
            if (!value.is_active()) {
                value.destroy()
                delete this.tree[key]
            }
        })
    }
    updateBySocket(wss: QrChainSocket) {
        // logger.component('@{ blue } wss server|@{ green } Created endpoint:',
        //     wss.hash, wss.path, wss.timestamp_exp)
        this.destroy_non_active()
        this.tree[wss.hash] = wss
    }
    updateByObject(qr_chain_socket_conn: QrChainSocketConn) {
        // logger.component('@{ blue } wss server|@{ green } Created endpoint:',
        //     qr_chain_socket_conn.hash, qr_chain_socket_conn.path, qr_chain_socket_conn.timestamp_exp)
        this.destroy_non_active()
        this.tree[qr_chain_socket_conn.hash] = new QrChainSocket(qr_chain_socket_conn)
    }
}