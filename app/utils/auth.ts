import { QrMember } from '../model/inspector.model'
import { db } from '../service/connector.module'
import { decodeToken } from './crypto'

const verifySession = async (hash: string) => {
    return await db.run(async (client) => {
        const user = client.query(
            `select token_hash from member_session where member_hash='${hash}'`
        )
        const match = await user.first()
        return { token_hash: match.get('token_hash') }
    })
}
const getMemberData = async (hash: string) => {
    return (await db.query<QrMember>(`select * from qr_member where hash='${hash}'`)).first() || {}
}
export const auth = async (token?: string) => {
    if (!token || token == 'null') return { pass: false }
    const obj: { [index: string]: any } = decodeToken(token)
    const { data, error } = await verifySession(obj['hash'])
    if (error) return { pass: false }
    if (data.get('token_hash') == token)
        return { pass: true, ...(await getMemberData(obj['hash'])), token: obj }
}
