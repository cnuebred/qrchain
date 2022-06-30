import { Hive } from 'cnuebred_bee'
import { createHash, randomBytes } from 'crypto'
import { logger } from 'ratlogger'
import { Seqrity } from 'seqrity'
import { QrCode } from '../../model/qrchain.model'
import { db } from '../../service/connector/connector.module'
import { _config } from '../../utils/configuration'
import { Controller, _auth, _get, _post } from '../../utils/controller'
import { encodeToken } from '../../utils/crypto'
import { resp } from '../../utils/responses'
import { Conn } from '../../utils/utils'
import { node_view, wss_view } from './qrcode.view'

const generate_token = (member: string, size: string = '1') => {
    return {
        exp: Date.now(),
        ws: createHash(size == '0' ? 'md5' : 'sha256').update(`${Date.now()}_${member}`).digest('hex')
    }
}
const map_selector = 'qwertyuiopasdfghjklzxcvbnm'
const get_map_selector = (move, part) => {
    let repeat = 1
    while (move >= map_selector.length / 2) {
        repeat++
        move = move - map_selector.length / 2
    }
    const new_map = part == '1' ? map_selector.slice(0, map_selector.length / 2)
        : map_selector.slice(map_selector.length / 2)

    let selector = new_map[move].repeat(repeat)
    return selector
}


const compress_svg = (qr_code_pcg, qr_code) => {
    qr_code_pcg = qr_code().render()
    for (let i = 0; i < 10; i++)
        if (qr_code_pcg.data.includes('-')) { qr_code_pcg = qr_code(); break }

    const map = {}
    let iterator_map_selector = 0
    const key = (val) => {
        const number = val.length
        const part_content = val[0]
        const exist = Array.from(Object.entries(map)).filter(([key, value]) => {
            return value[0] == number && value[1] == part_content
        })

        const selector = get_map_selector(iterator_map_selector, part_content)
        if (exist.length == 0) {
            map[selector] = [number, part_content]
            iterator_map_selector++
        } else
            return exist[0][0]

        return selector
    }

    qr_code_pcg.data = qr_code_pcg.data.replaceAll(/((1){2,}|(0){2,})/gm, key)
    qr_code_pcg.map = Object.entries(map).map(([key, value]) => { return `${value[0]}${key}${value[1]}` }).join('.')
    return qr_code_pcg
}

const view: { [index: string]: Hive } = {
    node: null,
    wss: null
}

const get_timestamp = (time) => {
    return new Date(time).toISOString().replaceAll(/[TZ]/gm, ' ')
}

@Controller('qrcode')
export class Qrcode {
    __init__() {
        view.node = node_view()
        view.wss = wss_view()
        logger.component('@{blue}view size | Qrcode node |@{green}',
            view.node.template_size().reduce((prev, curr) => { return prev + curr }), '@{blue}bytes')
        logger.component('@{blue}view size | Qrcode wss |@{green}',
            view.wss.template_size().reduce((prev, curr) => { return prev + curr }), '@{blue}bytes')
    }
    @_get('/view')
    async view({ res }) {
        return res.status(200).send(view.node.to_html())
    }
    @_get('/list', { query: ['limit?', 'root?'] })
    @_auth()
    async list_qr_code({ res, query, auth_ }) {
        if (query.root && auth_.data.permission_code != '6666')
            return res.send({})
        const pcg =
            (
                await db.query<QrCode>(
                    `select * from qr_code 
                    ${query.root && auth_.data.permission_code == '6666'
                        ? ' ' : `WHERE owner_hash='${auth_.data.hash}'`} 
                    ORDER BY created_at DESC ${query.limit ? 'LIMIT ' + query.limit : ''} `
                    , { first: false })
            )
                .get('hash', -1)
        const range = (
            await db.query<QrCode>(
                `select count(hash) from qr_code 
                ${query.root && auth_.data.permission_code == '6666'
                    ? ' ' : `WHERE owner_hash='${auth_.data.hash}'`} `)
        )
        return res.send({ qr_codes: pcg, row_number: parseInt(range.get('count', 0)) })
    }
    @_get('/node/:wss/view', { params: ['wss'] })
    async wss_view({ res, params }) {
        return res.status(200).send(view.wss.to_html({
            wss_host: _config.ws.host,
            wss_port: _config.ws.port.toString(),
            host: _config.server.host,
            port: _config.server.port.toString(),
            wss: params.wss
        }))
    }
    @_post('/generate', { body: ['data?'] })
    async generate_qr_code_wss({ req, res, body }: Conn) {
        const qr = () => new Seqrity(body.data, { minVersion: 7, minErrorLevel: 'L' })
        const qr_code_pcg = compress_svg({}, qr)
        res.status(200).send({ ...qr_code_pcg })
    }
    @_get('/archive/messages', { query: ['start?', 'end?'], headers: ['wss'] })
    async get_archived_messages({ res, headers }: Conn) {
        const messages = await db.query(
            `select * from qr_messages where hash='${headers.wss}' 
            order by created_at`, { first: false })
        if (!messages.ok()) return res.status(200).send(resp().fail())
        const messages_hash = messages.get<string>('message', -1)

        return res.status(200).send(resp('messages api', { messages: messages_hash }).ok())
    }
    @_get('/generate/:user_hash', { query: ['size?', 'graphic?', 'url?', 'exp?', 'archive?'], params: ['user_hash'] })
    async generate_qr_code({ res, query, params }: Conn) {

        const token = generate_token(params.user_hash, query?.size)
        const url = `http://${_config.server.host}:${_config.server.port}/qrcode/node/${token.ws}/view`
        const qr_code = () => {
            return new Seqrity(query?.url ? url : encodeToken(token), { minVersion: 7, minErrorLevel: 'L' })
        }
        let qr_code_pcg

        if (query.graphic == 'svg') qr_code_pcg = qr_code().renderSvg().svg
        else if (query.graphic == 'pcg') qr_code_pcg = qr_code().renderSvg()
        else { qr_code_pcg = compress_svg(qr_code_pcg, qr_code) }

        const user = await db.query(`select * from qr_user where hash='${params.user_hash}'`)
        if (!user.ok()) {
            await db.query(`insert into qr_user (hash) values ('${params.user_hash}')`)
        }

        const exp = query?.exp ? parseInt(query.exp) : 15
        const insert_query = `insert into qr_code (hash, data_qr, key_qr, owner_hash, created_at, expiration, archive) values
        ('${token.ws}', '${encodeToken(token)}', '${randomBytes(16).toString('hex')}',
         '${params.user_hash}','${get_timestamp(Date.now())}', '${1000 * 60 * exp}', '${query.archive ? query.archive : false}')`
        await db.query(insert_query)

        res.header('Access-Control-Allow-Origin', '*')

        return res.status(200).send({ ...qr_code_pcg, ...{ url: `qrcode/node/${token.ws}` } })
    }
}