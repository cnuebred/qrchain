import { QrMember } from '../model/qrchain.model'
import { db } from '../service/connector/connector.module'
import { _config } from './configuration'
import { decodeToken } from './crypto'
import { Auth } from './utils'

const types = {
    Bearer: 'verify_session'
}

const verifySession = async (hash: string, type: string) => {
    const auth_db = _config.auth.db[types[type]]
    return await db.run(async (client) => {
        const user = client.query(
            `select ${auth_db[0]} from ${auth_db[1]} where ${auth_db[2]}='${hash}'`
        )
        const match = await user.first()
        return { token_hash: match.get('token_hash') }
    })
}
const getMemberData = async (hash: string) => {
    return (await db.query<QrMember>(`select * from qr_member where hash='${hash}'`)).first() || {}
}
export const auth = async (token_?: string): Promise<Auth> => {
    if (!token_ || token_ == 'null') return { pass: false }
    const [type, token] = token_.split(' ') // add options for type
    const obj: { [index: string]: any } = decodeToken(token)
    const { data, error } = await verifySession(obj['hash'], type)
    if (error) return { pass: false }
    if (data.get('token_hash') == token)
        return { pass: true, data: (await getMemberData(obj['hash'])), token: obj }
    else return { pass: false }
}
