import { Controller, _get, _post } from '../../utils/controller'
import { viewInspectorInit, viewInspectorLogin } from './inspector.view'
import { randomBytes } from 'crypto'
import { db } from '../../service/connector.module'
import { decodeToken, encodeToken } from '../../utils/crypto'
import { auth } from '../../utils/auth'

const generateToken = (hash: string) => {
    const token = { hash, date: Date.now() }
    return encodeToken(token)
}
const setToken = async (hash: string, token: string) => {
    await db.run(async (client) => {
        await client.query(
            `update admin_panel set session=\'${token}\' where hash=\'${hash}\'`
        )
    })
}
const matchPass = async (passHash) => {
    const pass = await db.run(async (client) => {
        const user = client.query('select hash, hash_pass from admin_panel')
        const userData = await user.first()

        return {
            pass:
                JSON.stringify(userData.get('hash_pass')) ==
                JSON.stringify(passHash),
            hash: userData.get('hash'),
        }
    })
    return pass
}

@Controller('inspector')
export class Inspector {
    @_get('/')
    main({ res }) {
        return res.status(200).send(viewInspectorInit())
    }
    @_get('/login')
    async login({ res, req }) {
        console.log('run')
        console.log(req.headers.auth)
        if (await auth(req.headers.auth))
            return res.status(200).send(viewInspectorLogin())
        if (!req.headers.login)
            return res.status(200).send(viewInspectorLogin(true))
        const { data, error } = await matchPass(req.headers.login)
        if (error) return res.status(200).send(viewInspectorLogin()) // some failed
        if (!data.get('pass')) return res.status(200).send(viewInspectorLogin()) // access denide
        const token = generateToken(data.get('hash'))
        await setToken(data.get('hash'), token)

        return res.send({ token })
    }
}
@Controller('controller', 'inspector')
export class AdminController {}
