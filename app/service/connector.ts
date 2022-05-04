import { Client, DatabaseError, ResultIterator } from 'ts-postgres'
import { logger } from 'ratlogger'
import { _config } from '../utils/configuration'
import { postgresqlErrorCodes } from 'ts-postgres/dist/src/errors'
import { getRecord } from '../utils/database'

function dataModel(obj: Object): DataModel {
    return {
        get: (query: string) => {
            try {
                return obj[query]
            } catch {
                //prettier-ignore
                new Error('Passed query selector doesn\'t exist')
            }
        },
        obj
    }
}

type DataModel = {
    get: (string) => any
    obj: { [index: string]: any }
}

type Result = {
    error: boolean
    data?: DataModel
}

type Dataset<T> = {
    data: T[],
    get: (query: string, index: number) => T,
    first: () => T | null,
    ok: () => boolean
    errorMessage: () => string
}

function dataset<T>(data: T[], error?: string) {
    this.data = data
    this.error = error
}
dataset.prototype.errorMessage = function () {
    return postgresqlErrorCodes[this.error]
}
dataset.prototype.ok = function () {
    return this.data.length != 0 || !this.error
}
dataset.prototype.get = function (query, index = 0) {
    return this.data?.[index]?.[query] || null
}
dataset.prototype.first = function () {
    return this.data.length != 0 ? this.data[0] : null
}


export class Connector {
    client: Client
    constructor() { }
    connect({ hostname, password, database, user } = _config.db) {
        this.client = new Client({
            host: hostname,
            database: database,
            user: user,
            password: password,
        })
        this.client.connect()
    }
    async run(callback: (client: Client) => any) {
        const result: Result = { error: false }
        try {
            result.data = dataModel(await callback(this.client))
        } catch (err) {
            result.error = true
            result.data = postgresqlErrorCodes[err.code]
        }
        return result || null
    }
    async query<T>(query_: string, { first = true, response = true } = {}): Promise<Dataset<T>> {
        try {
            const result = await this.client.query(query_)
            if (!response) return new dataset<T>([])
            if (first) return new dataset<T>([getRecord<T>(result)])
            const rows = result.rows.length
            const dataset_ = []
            for (let i = 0; i < rows; i++) dataset_.push(getRecord<T>(result, i))
            return new dataset<T>(dataset_)
        } catch (err) {
            const error = new dataset([], err.code)
            logger.error('database error:@{white bold}', error.errorMessage())
            return error
        }

    }
}
