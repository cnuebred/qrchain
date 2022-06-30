import { db } from '../connector/connector.module'
import { QrChainServerSocket } from './socket'

export const wss = new QrChainServerSocket()

export const setUpActives = async () => {
    const qr_code = await db.query(`
            select qr_code.hash, qr_code.expiration, qr_code.archive from qr_code
            INNER JOIN qr_user on qr_user.hash=qr_code.owner_hash where qr_user.is_active='true'
        `, { first: false })
    Array.from<string>(qr_code.get('hash', -1)).forEach((item, index) => {
        wss.updateByObject({
            hash: item, timestamp_exp: qr_code.get('expiration', index), archive: qr_code.get('archive', index)
        })
    })
}