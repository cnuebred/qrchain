import { NextFunction, Request, Response } from 'express'

export type ExpressArgs = {
    req: Request
    res: Response
    next: NextFunction
}
export type MetaRequires = {
    headers?: string[]
    params?: string[]
    body?: string[]
}
export type MetaOptions = {
    hidden?: boolean
}
