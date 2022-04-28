export type Configuration = {
    server?: {
        host: string
        port: number
        api: string
    }
    db?: {
        hostname: string
        password: string
        database: string
        user: string
    }
    utils?: {
        auth_algo: string
        sec_key: string
    }
}
