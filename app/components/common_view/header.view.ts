import { Bee } from 'cnuebred_bee'
import { _config } from '../../utils/configuration'
let worker_bee_hive

export const header = (title: string) => {
    const hr = new Bee('---')
    const header = new Bee(`##${title}#`, '')
    header.add('main', 'button', {}, 'end')
        .wrap('a', { href: `http://${_config.server.host}:${_config.server.port}/inspector/view` })
    header.add('[@anon]', 'pre$header_state', {}, 'after')
        .fetch(`http://${_config.server.host}:${_config.server.port}/user/member`, {
            headers: () => { return { authorization: localStorage.getItem('token') } },
            res: (result) => {
                worker_bee_hive['header'] = {}
                worker_bee_hive.header['user'] = result?.user
                worker_bee_hive.header['hash'] = result?.hash

                return { anon: result?.user ? `${result?.user} ${result?.hash}` : 'anon' }
            }
        })
    header.push(hr, 'after')
    return header
}