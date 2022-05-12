module.exports = {
    server: {
        host: process.env.QRCHAIN_HOST || 'localhost',
        port: process.env.QRCHAIN_PORT || 8081,
        api: '/api'
    },
    db: {
        hostname: 'psql01.mikr.us',
        database: 'db_f404',
        user: 'f404',
        password: '983D_9ca589',
    },
    utils: {
        auth_algo: 'aes-256-cbc',
        sec_key: 'b98ec4700039a24fca73fcb6251237be'
    }
}
