import { Client, ResultIterator } from 'ts-postgres'
import { _config } from '../utils/configuration'

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
    }
}

type DataModel = {
    get: (string) => any
}

type Result = {
    error: boolean
    data?: DataModel
}

export class Connector {
    client: Client
    constructor() {}
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
        const result: Result = {
            error: false,
        }
        try {
            result.data = dataModel(await callback(this.client))
        } catch (err) {
            result.error = true
            result.data = err
        }
        return result || null
    }
}
