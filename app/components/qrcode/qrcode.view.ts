import { Bee, Hive } from 'cnuebred_bee'
import { _config } from '../../utils/configuration'
import { decodeToken, encodeToken } from '../../utils/crypto'
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


let worker_bee_hive
const qr_code_node_view = {
    decompress_svg(data, map_string) {
        let map = map_string.split('.').map(
            item => {
                const val = item.slice(-1)
                item = item.slice(0, -1)
                const repeat = parseInt(item)
                return [item.replace(repeat, ''), [repeat, val]]
            })
        map = Object.fromEntries(map)

        const map_keys = Object.keys(map)
        map_keys.reverse()

        for (let letter of map_keys) {
            const part = map[letter]
            data = data.replaceAll(new RegExp(`${letter}`, 'gm'), part[1].repeat(part[0]))
        }
        return data
    },
    generate_svg() {
        const create_polygon = (width: number, height: number) => {
            const svg_polygon = `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">CONTENT</svg>`
            return svg_polygon
        }
        const create_rect = (x: number, y: number, a: number, color = '#000000') => {
            const rect = `<rect x="${x}" y="${y}" width="${a}" height="${a}" fill="${color}"></rect>`
            return rect
        }
        const create_qr_svg = (qr_data: string, block_size: number = 5, color = { light: '#ffffff', dark: '#000000' }) => {
            const a = Math.floor(Math.sqrt(qr_data.length))
            const polygon = create_polygon(a * block_size, a * block_size)
            let rects = ''
            for (let h = 0; h < a; h++)
                for (let w = 0; w < a; w++) {
                    const rect = create_rect(
                        w * block_size, h * block_size, block_size, qr_data[w + h * a] == '1' ? color.light : color.dark
                    )
                    rects += rect

                }
            return polygon.replace('CONTENT', rects)
        }
        return create_qr_svg
    }
}


export const node_view = (): Hive => {
    const hive = new Hive('qrcode_node')
    hive.add_package('blog_style')
    hive.add_package('std_libs', 'crypto')
    hive.style('body', { margin: '0' })
    hive.script(qr_code_node_view)
    const hr = new Bee('---')
    const header_pcg = header('Qrcode node View')
    const dashboard = new Bee().style('', dashboard_style)
    dashboard.push(header_pcg, 'end')

    dashboard.add('###Generate qrcode##')
    dashboard.add('', 'input#archive$archive', { type: 'checkbox' })
    dashboard.add('archive', 'label.noselect_blog', { for: 'archive' })
    dashboard.add('generate', 'button').click(async ({ worker, ref }) => {
        const user_hash = worker_bee_hive?.header?.hash || worker._crypto().SHA256('anon').toString()
        const req = await fetch('>{{url}}' + 'qrcode/generate/' + user_hash + `?url=true&archive=${ref.archive['checked']}`)
        const svg_data = await req.json()
        console.log(svg_data)
        const bin_data = worker.decompress_svg(svg_data.data, svg_data.map)
        const svg = worker.generate_svg()
        ref.svg_polygon.innerHTML = svg(bin_data)
        ref.qrnode.setAttribute('href', '>{{url}}' + svg_data.url + '/view')
        ref.qrnode.textContent = 'click me'

    }).set_replace({
        url: `http://${_config.server.host}:${_config.server.port}/`
    })

    dashboard.add('', 'div$svg_polygon')
    dashboard.add('', 'a$qrnode')
    dashboard.push(hr, 'end')

    hive.add().style('', site_style).push(dashboard, 'end')

    hive.hive_html({}, false)

    return hive
}



const wss_worker = {
    client: null,
    wss: null,
    connected: null,
    options: null,
    hash_code: (string) => {
        string = (string + '0'.repeat(8)).slice(0, 8)
        let hash = 0
        let hash_string = ''
        const last_four = string.slice(-4)
        for (let j = 0; j < 4; j++) {
            for (let i = 0; i < string.length; i++) {
                const char = string.charCodeAt(i)
                hash = ((hash << 5) - hash) + char
                hash |= 0
            }
            hash |= 0
            hash = Math.abs(hash)
            hash_string += (hash.toString(16) + last_four).slice(0, 8)
        }
        return hash_string
    },
    set_options(key, value) {
        if (this.options == null) this.options = {}
        // localStorage.setItem(key, value)
        this.options[key] = value
    },
    create_message(pcg) {
        const { type = 'none', author = 'system', content = '', created_at = Date.now(), flags = {}, bulk = false } = pcg
        let wrap_element
        const node_element = document.createElement('div')
        const author_element = document.createElement('code')
        const content_element = document.createElement('code')
        const date_set_string = new Date(created_at).toISOString().replaceAll(/[TZ]/gm, ' ')
        author_element.setAttribute('title', date_set_string)
        if (type == 'system') node_element.style.color = 'red'
        if (flags?.color) content_element.style.color = flags.color
        if (flags?.spoiler) {
            content_element.classList.add('message_spoiler')
            content_element.onclick = () => {
                if (navigator.clipboard && window.isSecureContext) {
                    return navigator.clipboard.writeText(content_element.textContent.trim())
                } else {
                    let textArea = document.createElement('textarea')
                    textArea.value = content_element.textContent.trim()
                    textArea.style.position = 'fixed'
                    textArea.style.left = '-999999px'
                    textArea.style.top = '-999999px'
                    document.body.appendChild(textArea)
                    textArea.focus()
                    textArea.select()
                    return new Promise<void>((res, rej) => {
                        document.execCommand('copy') ? res() : rej()
                        textArea.remove()
                    })
                }
            }

        }
        if (flags?.pre) {
            content_element.classList.add('message_pre')
            wrap_element = document.createElement('pre')
        } else
            wrap_element = document.createElement('div')

        author_element.textContent = `[${author}]: `
        content_element.textContent = content
        if (bulk)
            node_element.classList.add('message_node_join')
        node_element.classList.add('message_node')
        wrap_element.classList.add('message_wrap')
        author_element.classList.add('message_author')
        content_element.classList.add('message_content')
        node_element.appendChild(author_element)
        wrap_element.appendChild(content_element)
        node_element.appendChild(wrap_element)
        return node_element
    },
    async open_server(panel, res) {
        this.client = new WebSocket(
            'ws://>{{wss_host}}:>{{wss_port}}/>{{wss}}?lol=true')

        this.client.onopen = () => {
            this.send(
                (worker_bee_hive?.header?.user || 'anon') + ' joined to the server',
                'system', 'system', false
            )
            res()
        }
        this.client.onerror = () => {
            const pcg = {
                type: 'system',
                content: 'reconnecting'
            }
            panel.insertBefore(this.create_message(pcg), panel.firstChild)
        }
        this.client.onclose = () => {
            this.client.close()
            setTimeout(() => {
                this.open_server(panel, res)
            }, 3000)
        }
        this.client.onmessage = async (msg) => {
            const buffer = new Uint8Array(await msg.data.arrayBuffer())
            const decoder = new TextDecoder('utf-8')
            const pcg = decoder.decode(buffer)

            const key = this.options?.['key'] || this.hash_code('anon_key')
            // const key = localStorage.getItem('key') || this.hash_code('anon_key')
            const onion_pcg_cs_layer = this._crypto().AES.decrypt(pcg, key)
            try {
                const onion_pcg = JSON.parse(onion_pcg_cs_layer.toString(this._crypto().enc.Utf8))
                panel.insertBefore(
                    this.create_message(onion_pcg),
                    panel.firstChild
                )

            } catch {
                panel.insertBefore(
                    this.create_message({ type: 'system', content: 'decrypted failed' }),
                    panel.firstChild
                )
            }
        }
        this.connected = true
        return true
    },
    async before_messages(panel) {
        const data = await fetch('http://>{{host}}:>{{port}}/qrcode/archive/messages', {
            headers: { wss: '>{{wss}}' },
        })
        const pcg = await data.json()
        if (pcg.status != 'ok') return
        pcg.data.messages.forEach(message_pcg => {
            let [message, part] = message_pcg.split(' ')
            try {
                const key = this.options?.['key'] || this.hash_code('anon_key')
                const onion_pcg_cs_layer = this._crypto().AES.decrypt(message, key)
                const onion_pcg = JSON.parse(onion_pcg_cs_layer.toString(this._crypto().enc.Utf8))
                if (onion_pcg.type == 'system') return
                panel.insertBefore(
                    this.create_message(onion_pcg),
                    panel.firstChild
                )
            } catch {
                console.log('error: decrypted failed')
            }
        })
    },
    send(msg, type = '', author = null, options = true) {
        const flags = {}
        for (let match of msg.matchAll(/(?<!\\)--(\w*)=(\w*)\s?/gm)) { flags[match[1]] = match[2] }
        let content = msg.replaceAll(/(?<!\\)--(\w*)=(\w*)\s?/gm, '').replaceAll(/(?<!\\)\\\s?/gm, '')

        if (options && this.options?.spoiler)
            flags['spoiler'] = this.options?.spoiler || false
        if (options && this.options?.pre)
            flags['pre'] = this.options?.pre || false
        if (options && this.options?.color)
            flags['color'] = this.options?.color || '#ffffff'

        let msg_pack = [content]
        if (content.length >= 2000) {
            msg_pack = []
            const round_multiple = Math.ceil(content.length / 2000)
            console.log(round_multiple)
            const repeat_time = Math.ceil(content.length / round_multiple)
            console.log(repeat_time)
            for (let i = 0; i < round_multiple; i++) {
                msg_pack.push(content.slice(0, repeat_time))
                content = content.slice(repeat_time)
            }
        }
        msg_pack.reverse()
        for (let pack of msg_pack) {
            const pcg = {
                type: type,
                bulk: msg_pack.length > 1,
                content: pack,
                flags,
                author: author || worker_bee_hive.header.user || 'anon',
                created_at: Date.now()
            }
            const key = this.options?.['key'] || this.hash_code('anon_key')
            const onion_pcg = this._crypto().AES.encrypt(JSON.stringify(pcg), key).toString()
            this.client.send(onion_pcg)
        }
    },
    onload_add_name() {
        setTimeout(() => {
            document.querySelector('[ref="nickname"]')['value'] = worker_bee_hive?.header.user || 'anon'
        }, 100)
    },

}


export const wss_view = () => {
    const hive = new Hive('qrcode_node')
    hive.add_package('blog_style')
    hive.add_package('std_libs', 'crypto')
    hive.style('body', { margin: '0' })
    hive.style('.hide_qr', { display: 'none' })
    hive.style('.message_spoiler', {
        background: 'black', color: 'black', borderRadius: '3px', padding: '-2px', userSelect: 'none'
    })

    hive.style('.message_author', { fontWeight: 'bold', fontSize: '12px' })
    hive.style('.message_content', {})
    hive.style('.chat_input', { borderRadius: '3px', width: '100%' })
    hive.style('div.message_wrap', {
        wordWrap: 'break-word',
        whiteSpace: 'pre-wrap', margin: '0', overflowWrap: 'break-word'
    })
    hive.style('pre.message_wrap', {
        whiteSpace: 'pre', margin: '0'
    })
    hive.style('.chat_view', { maxHeight: '800px', overflow: 'auto', overflowY: 'scroll' })
    hive.style('.message_node_join', {
        marginTop: '0px !important',
        marginBottom: '0px !important'
    })
    hive.style('.message_node', {
        display: 'grid',
        margin: '3px',
        borderLeft: '2px solid #202020',
        padding: '2px',
        gridAutoFlow: 'column',
        gridAutoColumns: 'min-content auto',
        gridGap: '5px',
        borderRadius: '1px',
    })
    hive.script(qr_code_node_view)
    hive.script(wss_worker)
    const header_pcg = header('Qrcode node View')
    const dashboard = new Bee().style('', dashboard_style)
    dashboard.push(header_pcg, 'end')

    dashboard.add('', 'hr')
    const show_qr = dashboard.add('###Show##', 'div.pointer_blog.noselect_blog')
    show_qr.add('', 'div.hide_qr$qr_code')
    show_qr.click(async ({ worker, ref }) => {
        ref.qr_code.classList.toggle('hide_qr')
        if (ref.qr_code.innerHTML.length < 10) {
            const data = await fetch('>{{host}}/qrcode/generate', {
                method: 'POST',
                headers: { 'Content-type': 'application/json; charset=UTF-8' },
                body: JSON.stringify({ data: '>{{host}}/qrcode/node/>{{wss}}/view' })
            })
            const json_data = await data.json()
            const bin = worker.decompress_svg(json_data.data, json_data.map)
            const generator = worker.generate_svg()
            ref.qr_code.innerHTML = generator(bin)
        }

    }).set_replace({ host: `http://${_config.server.host}:${_config.server.port}` })

    dashboard.add('', 'hr')
    dashboard.add('#Tunnel', 'h3$tunnel.noselect_blog', { 'tunnel-crypto': '>{{wss}}' })
    const panel = dashboard.add('', 'div$panel')
    const config = panel.add('', 'div.config')
    config.add('', 'input$nickname', { 'value': 'anon' }).event('input', ({ item }) => {
        worker_bee_hive.header.user = item['value']
    })
    config.add('', 'input$key', { 'value': 'anon_key', type: 'password' }).event('input', ({ worker, item }) => {
        worker.set_options('key', item['value'])
    })
    config.add('', 'br')
    config.add('spoiler', 'input$spoiler.noselect_blog',
        { type: 'checkbox' }).event('input', ({ worker, item }) => {
            worker.set_options('spoiler', item['checked'])
        })
    config.add('pre', 'input$pre.noselect_blog',
        { type: 'checkbox' }).event('input', ({ worker, item }) => {
            worker.set_options('pre', item['checked'])
        })
    config.add('color', 'input$color.noselect_blog',
        { type: 'color' }).event('input', ({ worker, item }) => {
            worker.set_options('color', item['value'])
        })
    panel.add('', 'textarea.chat_input$chat_input').event('keyup', async ({ event, worker, item, ref }) => {
        if ((event as KeyboardEvent).key == 'Enter' && (event as KeyboardEvent).shiftKey == false) {
            if (!worker.connected) await new Promise(res => { (worker.open_server(ref.view, res)) })
            if (item['value'].trim().length == 0) return item['value'] = ''
            worker.send(`${item['value']}`)
            item['value'] = ''
        }
    })
    panel.add('send', 'button$send').click(async ({ worker, ref }) => {
        if (!worker.connected) await new Promise(res => { (worker.open_server(ref.view, res)) })
        if (ref.chat_input['value'].trim().length == 0) return ref.chat_input['value'] = ''
        worker.send(`${ref.chat_input['value']}`)
        ref.chat_input['value'] = ''
    })
    panel.add('join', 'button$join').click(async ({ worker, ref }) => {
        if (!worker.connected) await new Promise(res => { (worker.open_server(ref.view, res)) })
    })
    panel.add('', 'div.chat_view$view')
    // panel.add('', 'style').event('load', ({ worker, ref }) => { console.log(ref.view); worker.open_server(ref.view) })

    dashboard.add('', 'hr')

    dashboard.add('', 'style').event('load', async ({ ref, worker }) => {
        setTimeout(async () => {
            worker.before_messages(ref.view)
        }, 500)
        setTimeout(async () => {
            if (!worker.connected) await new Promise(res => { (worker.open_server(ref.view, res)) })
        }, 1000)
    })
    hive.add().style('', site_style).push(dashboard, 'end')

    hive.hive_html({}, false)

    return hive
}