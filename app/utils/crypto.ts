import { createCipheriv, createDecipheriv, randomBytes } from 'crypto'
import { _config } from './configuration'

export const encodeToken = (obj: { [index: string]: any }) => {
    const { auth_algo, sec_key } = _config.utils
    const message = JSON.stringify(obj)
    const vec = randomBytes(16)
    const cipher = createCipheriv(auth_algo, sec_key, vec)
    const token = cipher.update(message, 'utf-8', 'hex')
    return token + cipher.final('hex') + '.' + vec.toString('hex')
}
export const decodeToken = (token: string) => {
    const { auth_algo, sec_key } = _config.utils
    const [toEncode, vec] = token.split('.')
    const decipher = createDecipheriv(
        auth_algo,
        sec_key,
        Buffer.from(vec, 'hex')
    )
    const message = decipher.update(toEncode, 'hex', 'utf-8')
    const finalMessage = message + decipher.final('utf-8')
    return JSON.parse(finalMessage)
}
