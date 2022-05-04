import { Controller, _auth, _get, _post } from '../../utils/controller'
import { viewInspectorInit, viewInspectorLogin } from './inspector.view'
import { logger } from 'ratlogger'
import { db } from '../../service/connector.module'
import { encodeToken } from '../../utils/crypto'
import { QrMember } from '../../model/inspector.model'

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

@Controller('inspector')
export class Inspector {
    @_get('/')
    @_auth()
    async main({ res, auth_ }) {
        if (auth_?.pass) {
            return res.status(200).send(viewInspectorInit(auth_))
        }
        return res.status(200).send(viewInspectorInit())
    }
    @_get('/login')
    @_auth()
    async login({ res, req, auth_ }) {
        if (auth_?.pass)
            return res.status(200).send(viewInspectorLogin(auth_))

        if (!req.headers.token)
            return res.status(200).send(viewInspectorLogin())

        const data = await matchPass(req.headers.login, req.headers.token)
        if (!data) return res.status(200).send(viewInspectorLogin())
        if (!data.pass) return res.status(200).send(viewInspectorLogin())
        const token = generateToken(data.hash)
        await setToken(data.hash, token)
        logger.log(`user @{blue}${data.hash}@{green} signed in`)

        return res.send({ token })
    }
}
@Controller('controller', 'inspector')
export class AdminController { }
