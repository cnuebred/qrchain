import { Bee } from 'cnuebred_bee'

const nav = new Bee('nav')
nav.add('[home]', 'a', { href: 'http://localhost:8080/inspector' })
nav.add('', 'hr')

const footer = new Bee('footer')
footer
    .add('by cube ak cnuebred', 'p.footer')
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

export { nav, footer }
