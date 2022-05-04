import { Bee, Component } from 'cnuebred_bee'
import { header } from '../views/main_placeholders'

const qr_member = [
    ['hash', 'identifier'],
    ['username', 'member username'],
    ['permission_code', 'code to check which permission member has'],
    ['email', 'member\'s email'],
    ['pass_hash', 'hashed member\'s password'],
    ['joined_at', 'b([default]) timestamp when member joined to qr-project'],
]
const qr_code = [
    ['hash', 'identifier'],
    ['owner_hash', 'owner of qr code']
]
const tables = {
    qr_member,
    qr_code
}
const insertOptions = [
    'qr_member', 'qr_code'
]

const insertOptionsBee = (type: string) => {
    const bee = new Component('@0', 'option', { value: '@0' })
    bee.for(...insertOptions).wrap('select.select_table_' + type)
    return bee
}

const newInput = () => {
    const inputKey = document.createElement('input')
    inputKey.className = 'key_input_insert'
    const inputValue = document.createElement('input')
    inputValue.className = 'value_input_insert'

    const deleteButton = document.createElement('button')
    deleteButton.textContent = 'DEL'
    deleteButton.addEventListener('click', () => { deleteButton.parentElement.remove() })


    const container = document.createElement('div')
    container.className = 'insert_container'
    container.append(inputKey)
    container.append(inputValue)
    container.append(deleteButton)

    document.querySelector('div.insert_polygon').append(container)

}

const add = async () => {
    const url = window.location.href + 'add'
    const polygon = document.querySelector('div.insert_polygon')
    const obj = {}
    const data = {}

    const values = polygon.querySelectorAll('input.value_input_insert')
    polygon.querySelectorAll('input.key_input_insert')
        .forEach((item, index) => { data[item['value']] = values[index]?.['value'] })
    console.log(data)

    obj['__table__insert__'] = document.querySelector('select.select_table_insert')['value']
    obj['data'] = data

    const status = await fetch(url, {
        method: 'POST',
        body: JSON.stringify(obj),
        headers: {
            'Content-Type': 'application/json'
        }
    })

    const statusElement = document.createElement('p')
    try {
        const json = await status.json()
        statusElement.textContent = json['msg'].split('_').join(' ') || '-'
    } catch {
        statusElement.textContent = '-'
    }
    document.querySelector('div.insert_status').innerHTML = statusElement.outerHTML
}


const get = async () => {
    const url = window.location.href + 'get_db'
    console.log(url)
    const table = document.querySelector('select.select_table_get')['value']
    if (!table) {
        document.querySelector('#result').innerHTML = '<p>Table not submitted for selection</p>'
        return
    }
    try {
        const data = await fetch(url + `?table=${table}`)

        const sqlTable = await data.json()
        if (!sqlTable || sqlTable.length == 0) {
            document.querySelector('#result').innerHTML = '<p>Selected table doesn\'t exist</p>'
            return
        }
        const keys = Object.keys(sqlTable[0])
        console.log(keys)
        const tableKeys = `<tr>${keys.map(item => { return `<th>${item}</th>` }).join('')
            }</tr>`

        const tableValues = sqlTable.map((item, index) => {
            return '<tr>' + Object.entries(item).map(item_ => {
                if (item_[1] == null) item_[1] = 'null'
                return `<td title="${item_[1]}" key="${item_[0]}" row_number="${index}">${item_[1]}</td>`
            }).join('') + '</tr>'
        })
        tableValues.push(`<tr>${keys
            .map(item => { return `<td><input placeholder="${item}" key="${item}"></input></td>` }).join('')
            }</tr>`)
        const tableElement = document.createElement('table')
        const addButton = document.createElement('button')
        tableElement.innerHTML = tableKeys + tableValues.join('')
        addButton.textContent = 'INSERT'
        addButton.addEventListener('click', async () => {
            const url = window.location.href + 'add'
            const polygon = document.querySelector('div#result')
            const obj = {}
            const data = {}

            polygon.querySelectorAll('input')
                .forEach((item) => { if (item?.['value']) data[item.getAttribute('key')] = item?.['value'] })

            obj['__table__insert__'] = document.querySelector('select.select_table_get')['value']
            obj['data'] = data

            const status = await fetch(url, {
                method: 'POST',
                body: JSON.stringify(obj),
                headers: {
                    'Content-Type': 'application/json'
                }
            })
            document.querySelector('#result p.status_get')?.remove()
            const status_ = document.createElement('p')
            status_.className = 'status_get'
            status_.textContent = (await status.json())['msg'] || '-'
            document.querySelector('#result button').after(status_)
        })
        document.querySelector('#result').innerHTML = tableElement.outerHTML
        document.querySelector('#result').append(addButton)
    } catch {
        console.log('Error while getting data')

    }
}


export const main = (auth_): string => {
    const bee = new Bee('main')
    bee.pushBee(header(auth_))
    bee.style('#result', { width: '100%' })
    bee.style('table, tr', { tableLayout: 'fixed', fontSize: 'auto', width: '100%' })
    bee.style('tr', { display: 'table' })
    bee.style('table td', {
        width: '0',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        textAlign: 'center',
        verticalAlign: 'middle'
    })
    bee.script('new_input', newInput)
    bee.script('get', get)
    bee.script('add', add)
    bee.script('clear_result', () => { document.querySelector('#result').innerHTML = '' })
    bee.script('clear_insert_polygon', () => {
        document.querySelector('div.insert_polygon').innerHTML = ''
        document.querySelector('div.insert_status').innerHTML = ''
    })
    bee.add(`Hello
    Here is the endpoint for school project :D
    On the bottom you can find all info about project and database documentation`, 'p').wrap('blockquote')
    const hr = bee.add('', 'hr')
    bee.add('Documentation:', 'p')
    Object.entries(tables).forEach(item => {
        bee.add(`b(${item[0]})` + '\n', 'code').post(
            bee.add('• @0 - @1\n', 'code', {}, { ignore: true }).for(...item[1])
        ).wrap('pre')
    })
    bee.push(hr)
    bee.push(insertOptionsBee('get'))
    bee.add('GET', 'button.get_button', { on_click: 'get' })
    bee.add('CLEAR OUTPUT', 'button.clear_button', { on_click: 'clear_result' })
    bee.add('', 'div#result')
    bee.push(hr)
    bee.push(insertOptionsBee('insert'))
    bee.add('ADD', 'button.new_input_button', { on_click: 'new_input' })
    bee.add('INSERT', 'button.insert_button', { on_click: 'add' })
    bee.add('CLEAR FIELDS', 'button.clear_button', { on_click: 'clear_insert_polygon' })
    bee.add('', 'div.insert_polygon')
    bee.add('', 'div.insert_status')

    bee.push(hr)

    return bee.print()
}