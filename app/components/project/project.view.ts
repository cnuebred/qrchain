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
    ['owner_hash', 'owner of qr code'],
]
const qr_user = [
    ['hash', 'identifier'],
    ['member_hash', 'if user is member, here is hash - connector'],
    ['joined_at', 'b([default]) timestamp when user joined to session'],
    ['is_member', 'boolean b([default]) false -> with trigger - if member_hash exist - true'],
    ['is_active', 'boolean b([default]) true'],
    ['•', '•'],
    ['b(trigger function on insert)', `
    create or replace function to_member() returns TRIGGER
    as 
    $$
    BEGIN
        if NEW.member_hash IS NOT NULL
            then update qr_user set is_member=true where member_hash=NEW.member_hash;
        end if;
    RETURN NULL;
    END; 
    $$
        language plpgsql`],
]
const qr_session = [
    ['hash', 'identifier for qr_session'],
    ['owner_session', 'hash of owner current session '],
    ['key_session', 'key session to decode crypto msg (aes-256-cbc)'],
    ['created_at', 'b([default]) timestamp when session was created'],
    ['wss', 'websocket address'],
]
const user_session = [
    ['user_hash', 'user\'s hash'],
    ['session_hash', 'session\'s hash which user is owner'],
]
const member_session = [
    ['member_hash', 'member\'s hash'],
    ['token_hash', 'jwt session for current member'],
]
const tables = {
    qr_member,
    qr_code,
    qr_user,
    qr_session,
    user_session,
    member_session
}
const insertOptions = [...Object.keys(tables), ...['active_members']]

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
    deleteButton.addEventListener('click', () => {
        deleteButton.parentElement.remove()
    })

    const container = document.createElement('div')
    container.className = 'insert_container'
    container.append(inputKey)
    container.append(inputValue)
    container.append(deleteButton)

    document.querySelector('div.insert_polygon').append(container)
}

const get = async () => {
    const url = window.location.href + 'get_db'
    console.log(url)
    const table = document.querySelector('select.select_table_get')['value']
    if (!table) {
        document.querySelector('#result').innerHTML =
            '<p>Table not submitted for selection</p>'
        return
    }
    try {
        const data = await fetch(url + `?table=${table}`)

        const sqlTable = await data.json()
        console.log(sqlTable)
        if (!sqlTable?.data || !sqlTable?.keys) {
            document.querySelector('#result').innerHTML =
                '<p>Selected table doesn\'t exist</p>'
            return
        }
        const keys = sqlTable.keys.map(item => { return item.column_name })
        console.log(keys)
        const tableKeys = `<tr>${keys
            .map((item) => {
                return `<th>${item}</th>`
            })
            .join('')}</tr>`

        const tableValues = sqlTable.data.map((item, index) => {
            return (
                '<tr data="true">' +
                Object.entries(item)
                    .map((item_) => {
                        if (item_[1] == null) item_[1] = 'null'
                        return `<td title="${item_[1]}" key="${item_[0]}" row_number="${index}">${item_[1]}</td>`
                    })
                    .join('') +
                '</tr>'
            )
        })
        tableValues.push(
            `<tr>${keys
                .map((item) => {
                    return `<td><input placeholder="${item}" key="${item}"></input></td>`
                })
                .join('')}</tr>`
        )
        const tableElement = document.createElement('table')
        const addButton = document.createElement('button')
        const deleteButton = document.createElement('button')
        const updateButton = document.createElement('button')
        tableElement.innerHTML = tableKeys + tableValues.join('')
        addButton.textContent = 'INSERT'
        deleteButton.textContent = 'DELETE'
        updateButton.textContent = 'UPDATE'

        const change_inputs = (row) => {
            row.querySelectorAll('input').forEach(item => {
                console.log(item['value'], item.parentElement.getAttribute('title'))
                if (item['value'] !== item.parentElement.getAttribute('title')) {
                    row.setAttribute('update', 'true')
                    item.parentElement.setAttribute('update',
                        item.parentElement.getAttribute('update')
                        || item.parentElement.getAttribute('title'))
                    item.parentElement.setAttribute('title', item['value'])
                }
                item.outerHTML = item['value']
            })
        }

        const show_status = async (status) => {
            const jsonResponse = await status.json()
            console.log(jsonResponse)
            if ((jsonResponse['msg'] == 'success'))
                eval('bee_global_functions_main.bee_method_get()')
            document.querySelector('#result p.status_get')?.remove()
            const status_ = document.createElement('p')
            status_.className = 'status_get'
            status_.textContent = jsonResponse['msg'].replaceAll('_', ' ') || '-'
            document.querySelector('#result button').after(status_)
        }

        addButton.addEventListener('click', async () => {
            const url = window.location.href
            const polygon = document.querySelector('div#result')
            const obj = {}
            const data = {}

            polygon.querySelectorAll('input').forEach((item) => {
                if (item?.['value'])
                    data[item.getAttribute('key')] = item?.['value']
            })

            obj['__table__insert__'] = document.querySelector(
                'select.select_table_get'
            )['value']
            obj['data'] = data

            const status = await fetch(url, {
                method: 'POST',
                body: JSON.stringify(obj),
                headers: {
                    'Content-Type': 'application/json',
                },
            })
            await show_status(status)
        })
        deleteButton.addEventListener('click', async () => {
            const url = window.location.href
            const polygon = document.querySelector('div#result')

            const values = Array.from(
                polygon.querySelectorAll('tr[class*="selected_row_to_delete"]')
            ).map((row) => {
                return Array.from(row.querySelectorAll('td')).map((item) => {
                    return item.getAttribute('title')
                })
            })
            const status = await fetch(url, {
                method: 'DELETE',
                body: JSON.stringify({ table: table, keys, values }),
                headers: {
                    'Content-Type': 'application/json',
                },
            })
            await show_status(status)
        })
        updateButton.addEventListener('click', async () => {
            const url = window.location.href
            const polygon = document.querySelector('div#result')
            polygon.querySelectorAll('#result tr[data="true"]').forEach(item => {
                if (item.querySelector('input'))
                    change_inputs(item)
            })
            const values = Array.from(
                polygon.querySelectorAll('tr[update="true"]')
            ).map((row) => {
                return Array.from(row.querySelectorAll('td')).map((item) => {
                    return [item.getAttribute('title'),
                    item.getAttribute('update')]
                })
            })

            const status = await fetch(url, {
                method: 'PATCH',
                body: JSON.stringify({ table: table, keys, values }),
                headers: {
                    'Content-Type': 'application/json',
                },
            })
            await show_status(status)

        })
        document.querySelector('#result').innerHTML = tableElement.outerHTML
        document.querySelector('#result').append(addButton)
        document.querySelector('#result').append(deleteButton)
        document.querySelector('#result').append(updateButton)

        document.querySelectorAll('#result table tr[data="true"]').forEach((row) => {
            row.addEventListener('click', (event: PointerEvent) => {
                if (event.ctrlKey)
                    if (!row.querySelector('input'))
                        row.querySelectorAll('td').forEach(item => {
                            item.innerHTML = `<input value="${item.innerHTML}"></input>`
                        })
                    else
                        change_inputs(row)
                else
                    if (!row.querySelector('input'))
                        row.classList.toggle('selected_row_to_delete')

            })
        })
    } catch {
        console.log('Error while getting data')
    }
}

export const main = (auth_): string => {
    const bee = new Bee('main')
    bee.pushBee(header(auth_))
    bee.style('#result', { width: '100%' })
    bee.style('.selected_row_to_delete', { background: '#e3185194' })
    bee.style('button', { margin: '2px' })
    bee.style('table, tr', {
        tableLayout: 'fixed',
        fontSize: 'auto',
        width: '100%',
    })
    bee.style('#result table', { userSelect: 'none' })
    bee.style('tr', { display: 'table' })
    bee.style('.hide', { display: 'none' })
    bee.style('table td, table input', {
        width: '100%',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        textAlign: 'center',
        verticalAlign: 'middle',
    })
    bee.script('new_input', newInput)
    bee.script('get', get)
    bee.script('hideDesc', (el: Element) => {
        el.querySelectorAll('code[to_hide="true"]').forEach(item => {
            item.classList.toggle('hide')
        })
    })
    bee.script('clear_result', () => {
        document.querySelector('#result').innerHTML = ''
    })
    bee.add(
        `Hello
    Here is the endpoint for school project :D
    On the bottom you can find all info about project and database documentation`,
        'p'
    ).wrap('blockquote')
    const hr = bee.add('', 'hr')
    bee.add('Documentation:', 'p')
    Object.entries(tables).forEach((item) => {
        bee.add(`b(${item[0]})` + '\n', 'code')
            .post(
                bee
                    .add('• @0 - @1\n', 'code.hide', { to_hide: 'true' }, { ignore: true })
                    .for(...item[1])
            )
            .wrap('pre', { on_click: 'hideDesc' })
    })
    bee.push(hr)
    bee.push(insertOptionsBee('get'))
    bee.add('GET', 'button.get_button', { on_click: 'get' })
    bee.add('CLEAR OUTPUT', 'button.clear_button', { on_click: 'clear_result' })
    bee.add('', 'div#result')
    bee.push(hr)

    return bee.print()
}
