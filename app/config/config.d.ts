export type Configuration = {
    server?: {
        host: string
        port: number
        api: string
    }
    db?: {
        host: string
        password: string
        database: string
    }
}
