export type Configuration = {
    server: {
        host: string
        port: number
        api: string
    }
    db: {
        hostname: string
        password: string
        database: string
        user: string
    },
    ws: {
        host: string,
        port: number
    },
    utils: {
        auth_algo: string
        sec_key: string
    }
    auth: {
        db: {
            verify_session: string[]
        }
    }
}
