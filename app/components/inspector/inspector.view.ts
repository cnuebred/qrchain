import { Bee, Hive } from 'cnuebred_bee'
import { leaf } from '../../service/router/router'
import { _config } from '../../utils/configuration'
import { header } from '../common_view/header.view'

const site_style = {
    position: 'absolute',
    width: '100%',
    display: 'flex',
    margin: 'auto',
    justifyContent: 'space-around'
}
const dashboard_style = {
    position: 'absolute',
    top: '50px',
    width: '60%',
    margin: 'auto',
    padding: '10px'
}

export const inspector = (): Hive => {
    const hive = new Hive('readme')
    hive.add('', 'meta', {
        name: 'viewport',
        content: 'width=device-width, initial-scale=1.0'
    })
    hive.add_package('blog_style')
    hive.add_package('std_libs', 'crypto')
    hive.style('body', { margin: '0' })
    hive.style('.hide_hash_list', { display: 'none' })
    const hr = new Bee('---')
    const header_pcg = header('Inspector View')
    const dashboard = new Bee().style('', dashboard_style)
    dashboard.push(header_pcg, 'end')

    dashboard.add('###Endpoints##')
    const row = new Bee('<td>@0</td>').for(['Module', 'Function', 'Methods', 'URL'], 'end').wrap('tr')

    const row_content = row.add('<td>b(@1)</td><td>@0</td><td>@2</td> ', 'tr')
    row_content.add('@4', 'code', {}).wrap('a', { href: `http://${_config.server.host}:${_config.server.port}@4` }).wrap('td')
    row_content.for(leaf.map(item => { return Object.values(item) }) as string[][])
    dashboard.push(row.wrap('table'), 'end')
    dashboard.push(hr, 'end')
    dashboard.add('###Login##')
    dashboard.add('', 'input$login', { placeholder: 'login' })
    dashboard.add('', 'input$password', { placeholder: 'password' })
    dashboard.add('Sign in', 'button').click(async ({ worker, ref }) => {
        const response = await fetch('>{{url}}', {
            headers: {
                login: ref.login['value'],
                token: worker._crypto().SHA256(`${ref.login['value']}_${ref.password['value']}`).toString(),
            }
        })
        const response_pcg = (await response.json())
        if (response_pcg.status == 'ok') {
            localStorage.setItem('token', 'Bearer ' + response_pcg.data.token)
            ref.status.textContent = 'Login successful'
        }
        else
            ref.status.textContent = 'Login failed'

        setTimeout(() => { ref.status.textContent = '' }, 5000)
        window.location.reload()

    }).set_replace({ url: `http://${_config.server.host}:${_config.server.port}/inspector/login` })

    dashboard.add('Logout', 'button').click(async () => {
        localStorage.removeItem('token')
        window.location.reload()
    })
    dashboard.add('', 'p$status')
    dashboard.push(hr, 'end')
    const mycodes = dashboard.add('###My qr codes @row_number##', 'div.pointer_blog.noselect_blog')
    mycodes.click(() => {
        document.querySelector('[ref="my_qr_codes"]').classList.toggle('hide_hash_list')
    })
    mycodes.add('code(@hash)', 'pre.hide_hash_list$my_qr_codes')

    mycodes.fetch(`http://${_config.server.host}:${_config.server.port}/qrcode/list?limit=15`, {
        headers: () => { return { authorization: localStorage.getItem('token') } },
        res: (result) => {
            return { hash: result?.qr_codes?.join('<br>') || '', row_number: result?.row_number || '' }
        }
    })
    dashboard.push(hr, 'end')

    const allcodes = dashboard.add('###Root access qr codes @row_number##', 'div.pointer_blog.noselect_blog')
    allcodes.click(() => {
        document.querySelector('[ref="root_access"]').classList.toggle('hide_hash_list')
    })
    allcodes.add('code(@hash)', 'pre.hide_hash_list$root_access')
    allcodes.fetch(`http://${_config.server.host}:${_config.server.port}/qrcode/list?root=true`, {
        headers: () => { return { authorization: localStorage.getItem('token') } },
        res: (result) => {
            return { hash: result?.qr_codes?.join('<br>') || '', row_number: result?.row_number || '' }
        }
    })



    dashboard.push(hr, 'end')

    hive.add().style('', site_style).push(dashboard, 'end')

    hive.hive_html({}, false)

    return hive
}