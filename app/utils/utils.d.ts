import { NextFunction, Request, Response } from 'express'
import { QrMember } from '../model/qrchain.model'

export type ExpressArgs = {
    req: Request
    res: Response
    next: NextFunction
}
export type Conn = ExpressArgs & {
    auth_?: Auth
    headers?: { [index: string]: string }
    query?: { [index: string]: string }
    body?: { [index: string]: string }
    params?: { [index: string]: string }
}

export type MetaRequires = {
    headers?: string[]
    query?: string[]
    body?: string[]
    params?: string[]
}
export type MetaOptions = {
    hidden?: boolean
}
export type Auth = {
    pass: boolean,
    token?: { [index: string]: any; }
    data?: QrMember
}