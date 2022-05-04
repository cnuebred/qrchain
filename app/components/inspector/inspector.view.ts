import { Bee, scheme } from 'cnuebred_bee'
import { leaf } from '../../service/router'
import { crypto, footer, header, nav, onload } from '../views/main_placeholders'

export const viewInspectorInit = (auth?) => {
    const init = new Bee('init')
    init.pushBee(header(auth))
    init.add('Hello\nHere is inspector for qrchain server', 'code#header').wrap(
        'pre'
    )
    init.add('', 'hr')
    init.add('Endpoints: ', 'p')
    const fullEndpoint = 'http://localhost:8080@4'
    init.add(
        `function: @0 | methods: @2 | endpoint: @4 => ${fullEndpoint}`,
        'code'
    )
        .wrap('pre')
        .wrap('a.endpoint', {
            href: fullEndpoint,
        })
        .for(
            ...leaf.map((item) => {
                return Object.values(item) as string[]
            })
        )
    init.style('.endpoint', { textDecoration: 'none', color: 'white' })
    init.pushBee(footer())
    return init.print()
}

export const viewInspectorLogin = (auth?) => {
    const login = new Bee('login')
    login.pushBee(header(auth))
    login.pushBee(crypto())
    login
        .add('Hello\nHere is login site to inspector', 'code#header')
        .wrap('pre')
    login.add('', 'hr')
    login.add('', 'input#login', { placeholder: 'login', value: 'cube' })
    login.add('', 'input#pass', {
        placeholder: 'password',
        value: 'qr_cnuebred_code!1002',
    })
    login.add('sign in', 'button', { on_click: 'login' })
    login.add('sign out', 'button', { on_click: 'logout' })
    login.script('login', async () => {
        const url = window.location.href
        const login = (document.querySelector('#login')['value'] as string).trim()
        const password = (document.querySelector('#pass')['value'] as string).trim()
        const token = eval(`CryptoJS.SHA256('${login}$${password}').toString()`) // sorry for eval :(
        const res = await fetch(url, { headers: { login, token } })

        try {
            const pcg = await res.json()
            sessionStorage.setItem('auth', pcg.token)
            window.location.reload()
        } catch {
            console.log('access denied')
        }
    })
    login.script('logout', async () => {
        sessionStorage.removeItem('auth')
        window.location.reload()
    })
    login.pushBee(footer())
    return login.print()
}
