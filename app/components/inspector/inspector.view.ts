import { Bee, scheme } from 'cnuebred_bee'
import { leaf } from '../../service/router'
import { crypto, footer, nav, onload } from '../views/main_placeholders'

export const viewInspectorInit = () => {
    const init = new Bee('init')
    init.pushBee(nav)
    init.pushBee(scheme.base_style())
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
    init.pushBee(footer)
    return init.print()
}

export const viewInspectorLogin = (
    onload_: boolean = false,
    ok: string = ''
) => {
    const login = new Bee('login')
    login.pushBee(nav)
    login.pushBee(scheme.base_style())
    login.pushBee(crypto)
    if (onload_) login.pushBee(onload())
    login
        .add('Hello\nHere is login site to inspector' + ok, 'code#header')
        .wrap('pre')
    login.add('', 'hr')
    login.add('', 'input#login', { placeholder: 'login', value: 'cube' })
    login.add('', 'input#pass', {
        placeholder: 'password',
        value: 'qr_cnuebred_code!1002',
    })
    login.add('sign in', 'button', { on_click: 'login' })
    login.script('login', async (el, event) => {
        const url = 'http://localhost:8080/inspector/login'
        const login = document.querySelector('#login')['value']
        const password = document.querySelector('#pass')['value']
        console.log(login, password)
        const auth = eval(`CryptoJS.SHA256('${login}$${password}').toString()`) // sorry for eval :(

        const res = await fetch(url, { headers: { login: auth } })
        try {
            const pcg = await res.json()
            sessionStorage.setItem('auth', pcg.token)
        } catch {}
    })
    login.pushBee(footer)
    return login.print()
}
