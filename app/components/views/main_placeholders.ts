import { Bee } from 'cnuebred_bee'

const nav = new Bee('nav')
nav.add('[home]', 'a', { href: 'http://localhost:8080/inspector' })
nav.add('', 'hr')

const footer = new Bee('footer')
// prettier-ignore
footer
    .add('by cube ak\'a cnuebred', 'p.footer')
    .wrap('div.placeholder_footer_qrchain')
footer.style('div.placeholder_footer_qrchain', {
    background: '#060b1d',
    display: 'flex',
    whiteSpace: 'nowrap',
    marginTop: '100px',
    justifyContent: 'space-around',
    borderRadius: '5px',
    color: 'white',
})

const crypto = new Bee('crypto')
crypto.add('', 'script', {
    src: 'https://cdnjs.cloudflare.com/ajax/libs/crypto-js/4.1.1/crypto-js.min.js',
    integrity:
        'sha512-E8QSvWZ0eCLGk4km3hxSsNmGWbLtSCSUcewDQPQW' +
        'ZF6pEU8GlT8a5fF32wOl1i8ftdMhssTrF/OhyGWwonTcXA==',
    crossorigin: 'anonymous',
    referrerpolicy: 'no-referrer',
})

const onload = () => {
    const load = new Bee('onload')
    //prettier-ignore
    const req_site = async (event) => {
        console.log('ok')
        const res = await fetch(window.location.href,
         { headers: { auth: sessionStorage.getItem('auth') } })
         function sleep(ms) {
            return new Promise(resolve => setTimeout(resolve, ms))
         }
        try {
            if(res.ok)
                {
                    const newHtml = (await res.text())
                    //console.log(newHtml)
                    // const newHtmlWithoutReload = newHtml
                    // .replace(
                    //    /<script toremove="a9c56b2246af1186bfc7cd2b317504d2">[\s\S]*?<\/script>/gm
                    //     , '')
                    //     console.log(newHtmlWithoutReload)
                    const x = new DOMParser().parseFromString(newHtml, 'text/html')
                    x.body.innerHTML += '<p>Lol</p>' 
                    console.log(x)
                    document.querySelector('script[toremove="a9c56b2246af1186bfc7cd2b317504d2"]')
                    .remove()
                    const  scripts = document.scripts
                    document.querySelectorAll('script').forEach(item => item.remove())
                    document.body = x.body
                    console.log(document)
                    Array.from(scripts).forEach(item => {
                        if(item.getAttribute('build_in') == 'event'){eval(item.text)}
                        document.head.appendChild(item)
                    })
                    

                    await sleep(3000)
                    //window.location.reload() // REMOVE_RELOAD_WINDOW
            }
        } catch {}
    }

    load.add(
        `window.addEventListener(\'load\', ${req_site.toString()})`,
        'script',
        { toremove: 'a9c56b2246af1186bfc7cd2b317504d2' },
        { nonparse: true }
    )
    return load
}
export { nav, footer, crypto, onload }
