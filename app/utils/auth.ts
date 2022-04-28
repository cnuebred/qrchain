import { db } from '../service/connector.module'
import { decodeToken } from './crypto'

const verifySession = async (hash: string) => {
    return await db.run(async (client) => {
        const user = client.query(
            `select * from admin_panel where hash=\'${hash}\'`
        )
        const match = await user.first()
        return { session: match.get('session') }
    })
}

export const auth = async (token?: string) => {
    console.log(token)
    if (!token || token == 'null') return false
    console.log('•', token)
    const obj = decodeToken(token)
    const user = await verifySession(obj['hash'])

    return user.data.get('session') == token
}
