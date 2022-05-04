import { QrMember } from '../../model/inspector.model'
import { db } from '../../service/connector.module'
import { Controller, _auth, _get, _post } from '../../utils/controller'
import { main } from './project.view'

@Controller('project')
export class Project {
    @_get('/')
    @_auth()
    main({ res, auth_ }) {
        return res.status(200).send(main(auth_))
    }
    @_post('/add')
    async add({ req, res }) {

        const table = req.body['__table__insert__']
        const data = req.body['data']
        if (Object.keys(data).length == 0)
            return res.send({ status: 'ok', msg: 'empty object' })
        const query = `insert into ${table} (${Object.keys(data).join(',')}) values (${Object.values(data)
            .map(item => { return `\'${item}\'` }).join(',')})`

        const databaseResponse = await db.query(query)
        return res.send({ status: 'ok', msg: databaseResponse.errorMessage() || 'success' })
    }
    @_get('/get_db')
    async getDb({ req, res }) {
        const data = await db.query(`select * from ${req.query?.table}`, { first: false })
        return res.send(JSON.stringify(data.data))
    }
}