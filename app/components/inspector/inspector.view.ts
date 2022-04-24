import { Bee, scheme } from 'cnuebred_bee'
import { leaf } from '../../router/router'
import { footer, nav } from '../views/main_placeholders'

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

export const viewInspectorLogin = () => {
    const login = new Bee('login')
    login.pushBee(nav)
    login.pushBee(scheme.base_style())
    login
        .add('Hello\nHere is login site to inspector', 'code#header')
        .wrap('pre')
    login.add('', 'hr')
    login.add('', 'input#login', { placeholder: 'login' })
    login.add('', 'input#pass', { placeholder: 'password' })
    login.add('sign in', 'button#pass', { on_click: 'login' })
    login.script('login', (el, event) => {})
    login.pushBee(footer)
    return login.print()
}
