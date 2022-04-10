module.exports = {
    logger: {
        dir: '',
        filename: () => {
            const time = new Date()
            const formatDay = `0${time.getDay()}`.slice(-2)
            const formatMonth = `0${time.getMonth()}`.slice(-2)
            return `ratlog_${formatDay}-${formatMonth}`
        },
        extension: 'rat',
        algorithm: 'aes-256-ctr',
        secret: 'd47424114c7f3c8df4fa7205c83ff0bd',
    },
    methods: {
        align: (text) => {
            const pcg = text.split(' ')
            const space = pcg.pop()
            const content = pcg.join('').trim()
            const freespaceCount = Math.floor((Math.abs((+space - content.length))))-1
            let freespace = (count = freespaceCount) => ' '.repeat(count)

            return content + freespace() 
        },
        status_init: (text) => {
            const pcg = text.split(' ')
            const color =  pcg.pop() == 'true' ? 'blue' : 'red'
            const category = pcg.join('')
            return `@{${color}}qrch ${category}|@{normal}`
        }
    },
    renders: {
        component: {
            render: ['@{normal}#{.}'],
        },
    },
}
