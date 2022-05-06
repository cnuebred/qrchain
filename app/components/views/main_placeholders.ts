import { Bee, scheme } from 'cnuebred_bee'
const nav = (account: { user?: 'anon'; hash?: '' }) => {
    const nav_ = new Bee('nav')
    const account_ = account.user ? `${account.user}[#${account.hash}]` : 'anon'
    nav_.add(`${account_}  |  `, 'span')
    nav_.add('[home]', 'a', { href: 'http://localhost:8080/inspector' })
    nav_.add('', 'hr')
    nav_.style('blockquote', {
        paddingLeft: '20px',
        borderLeft: '3.75px solid rgb(6, 5, 10)',
        borderTopLeftRadius: '3px',
        borderBottomLeftRadius: '3px',
    })
    return nav_
}

const footer = () => {
    const footer_ = new Bee('footer')
    // prettier-ignore
    footer_
        .add('by cube ak\'a cnuebred', 'p.footer')
        .wrap('div.placeholder_footer_qrchain')
    footer_.style('div.placeholder_footer_qrchain', {
        background: '#060b1d',
        display: 'flex',
        whiteSpace: 'nowrap',
        marginTop: '100px',
        justifyContent: 'space-around',
        borderRadius: '5px',
        color: 'white',
    })
    return footer_
}
const crypto = () => {
    const crypto_ = new Bee('crypto')
    crypto_.add('', 'script', {
        src: 'https://cdnjs.cloudflare.com/ajax/libs/crypto-js/4.1.1/crypto-js.min.js',
        integrity:
            'sha512-E8QSvWZ0eCLGk4km3hxSsNmGWbLtSCSUcewDQPQW' +
            'ZF6pEU8GlT8a5fF32wOl1i8ftdMhssTrF/OhyGWwonTcXA==',
        crossorigin: 'anonymous',
        referrerpolicy: 'no-referrer',
    })
    return crypto_
}

const onload = () => {
    const onload_ = new Bee('onload')
    const reqSite = async () => {
        const res = await fetch(window.location.href, {
            headers: { auth: sessionStorage.getItem('auth') },
        })
        try {
            const newHtml = await res.text()
            const x = new DOMParser().parseFromString(newHtml, 'text/html')
            document.body = x.body
            document.querySelectorAll('script').forEach((item) => {
                item.remove()
                if (item.getAttribute('build_in') == 'event') {
                    eval(item.text)
                }
                if (!(item.getAttribute('build_in') == 'toremove'))
                    document.head.appendChild(item)
            })
        } catch (err) {
            new Error(err)
        }
    }
    onload_.add(
        `window.addEventListener(\'load\', ${reqSite.toString()})`,
        'script',
        { build_in: 'toremove' },
        { nonparse: true }
    )
    return onload_
}

const header = (auth?) => {
    const header_ = new Bee('header')
    header_.pushBee(nav({ user: auth?.username, hash: auth?.hash }))
    header_.pushBee(scheme.base_style())
    header_.pushBee(onload())
    return header_
}

export { header, nav, footer, crypto, onload }
