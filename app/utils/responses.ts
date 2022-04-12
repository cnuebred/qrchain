export const res = (response?): any => {
    return {
        response: response || {
            status: 'ok',
            msg: '',
            data: {},
        },
        ok() {
            this.response.status = 'ok'
            return res(this.response)
        },
        err() {
            this.response.status = 'error'
            return res(this.response)
        },
        msg(...msg) {
            this.response.msg = msg.join(' ')
            return res(this.response)
        },
        data(data: { [index: string]: string }) {
            this.response.data = data
            return res(this.response)
        },
    }
}
