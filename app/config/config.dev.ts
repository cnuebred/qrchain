export = {
    server: {
        host: 'localhost',
        port: 8080,
        api: '/api'
    },
    db: {
        hostname: 'localhost',
        database: 'qr_code',
        user: 'postgres',
        password: 'admin',
    },
    ws: {
        host: 'localhost',
        port: 8008
    },
    utils: {
        auth_algo: 'aes-256-cbc',
        sec_key: 'b98ec4700039a24fca73fcb6251237be'
    },
    auth: {
        db: {
            verify_session: ['token_hash', 'member_session', 'member_hash']
        }
    }
}
