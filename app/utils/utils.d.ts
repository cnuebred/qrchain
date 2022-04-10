import { NextFunction, Request, Response } from 'express'

export type ExpressArgs = {
    req: Request
    res: Response
    next: NextFunction
}
