import { Controller, _auth, _get, _post } from '../../utils/controller'
import { logger } from 'ratlogger'
import { resp } from '../../utils/responses'
import { db } from '../../service/connector/connector.module'
import { encodeToken } from '../../utils/crypto'
import { QrMember } from '../../model/qrchain.model'
import { Conn } from '../../utils/utils'
import { inspector } from './inspector.view'
import { Hive } from 'cnuebred_bee'


const generateToken = (hash: string) => {
    const token = { hash, date: Date.now() }
    return encodeToken(token)
}
const setToken = async (hash: string, token: string) => {
    await db.run(async (client) => {
        try {
            await client.query(
                `insert into member_session values ('${hash}', '${token}')`
            )
        } catch {
            try {
                await client.query(
                    `update member_session set token_hash = '${token}' where member_hash='${hash}'`
                )
            } catch (err) {
                console.log('set token error')
            }
        }
    })
}
const matchPass = async (username, passHash) => {
    const user = await db.query<QrMember>
        (`select hash, pass_hash from qr_member where username=\'${username}\'`)
    if (user.first())
        return {
            pass: JSON.stringify(user.first().pass_hash) == JSON.stringify(passHash),
            hash: user.first().hash
        }
    return null
}

const view: { [index: string]: Hive } = {
    inspector: null
}

@Controller('inspector')
export class Inspector {
    __init__() {
        view.inspector = inspector()
        logger.component('@{blue}view size | Inspector |@{green}',
            view.inspector.template_size().reduce((prev, curr) => { return prev + curr }), '@{blue}bytes')
    }
    @_get('/ping')
    ping({ res }) {
        res.header('Access-Control-Allow-Origin', '*')
        return res.send(resp('ping-pong!'))
    }

    @_get('/view')
    @_auth(false)
    async view({ req, res, auth_, query }) {
        return res.send(view.inspector.to_html())
    }

    @_get('/')
    @_auth()
    async main({ res, auth_ }) {
        if (auth_?.pass) {
            return res.status(200).send()
        }
        return res.status(200).send()
    }
    @_get('/login', { headers: ['token', 'login'] })
    async login({ res, headers, auth_ }: Conn) {
        const data = await matchPass(headers.login, headers.token)
        if (!data) return res.status(200).send(resp('user doesn\'t exist').fail())
        if (!data.pass) return res.status(200).send(resp('wrong login details').fail())

        const token = generateToken(data.hash)
        await setToken(data.hash, token)
        logger.log(`user @{blue}${data.hash}@{green} signed in`)

        return res.send(resp('Auth Token', { token }).ok())
    }
}
@Controller('controller', 'inspector')
export class AdminController { }
