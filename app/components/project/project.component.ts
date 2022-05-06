import { QrMember } from '../../model/inspector.model'
import { db } from '../../service/connector.module'
import {
    Controller,
    _auth,
    _delete,
    _get,
    _patch,
    _post,
} from '../../utils/controller'
import { main } from './project.view'

@Controller('project')
export class Project {
    @_get('/')
    @_auth()
    main({ res, auth_ }) {
        return res.status(200).send(main(auth_))
    }
    @_post('/')
    async post({ req, res }) {
        const table = req.body['__table__insert__']
        const data = req.body['data']
        if (Object.keys(data).length == 0)
            return res.send({ status: 'ok', msg: 'empty object' })
        const query = `insert into ${table} (${Object.keys(data).join(
            ','
        )}) values (${Object.values(data)
            .map((item) => {
                return `\'${item}\'`
            })
            .join(',')})`

        const databaseResponse = await db.query(query)
        return res.send({
            status: 'ok',
            msg: databaseResponse.errorMessage() || 'success',
        })
    }
    @_patch('/')
    async patch({ req, res }) {
        if (!req.body || req.body?.values.length == 0) return
        console.log(req.body)
        console.log(req.body.values)
        let errors = []
        req.body.values.forEach(async value => {
            const set = []
            const where = req.body.keys
                .map((item, index) => {
                    if (!!value[index][1]) {
                        set.push(`${item}='${value[index][0]}'`)
                        return `${item}='${value[index][1]}'`
                    }
                    if (Date.parse(value[index][0]) || value[index][0] == 'null') return null
                    return `${item}='${value[index][0]}'`
                })
                .filter(item => !!item)

            const query = `update ${req.body.table} set ${set.join(' , ')} where ${where.join(' and ')}`
            console.log(query)
            const status = await db.query(query)
            errors.push(status.errorMessage())
        })
        return res.send({
            status: 'ok',
            msg: errors
        })
    }
    @_delete('/')
    async delete({ req, res }) {
        if (!req.body || req.body?.values.length == 0) return
        req.body.values.forEach(async value => {
            const where = req.body.keys
                .map((item, index) => {
                    if (Date.parse(value[index]) || value[index] == 'null') return null
                    return `${item}='${value[index]}'`
                })
                .filter(item => !!item)
            const query = `delete from ${req.body.table} where ${where.join(' and ')}`
            await db.query(query)
        })
        return res.send({
            status: 'ok',
        })
    }
    @_get('/get_db')
    async getDb({ req, res }) {
        const data = await db.query(`select * from ${req.query?.table}`, {
            first: false,
        })
        return res.send(JSON.stringify(data.data))
    }
}
