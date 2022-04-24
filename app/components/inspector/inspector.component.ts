import { Controller, _get, _post } from '../../utils/controller'
import { viewInspectorInit, viewInspectorLogin } from './inspector.view'

@Controller('inspector')
export class Inspector {
    @_get('/')
    main({ res }) {
        return res.status(200).send(viewInspectorInit())
    }
    @_get('/login')
    login({ res }) {
        return res.status(200).send(viewInspectorLogin())
    }
    @_get('/db')
    get_database({ res }) {
        return res.status(200).send(viewInspectorLogin())
    }
}
@Controller('controller', 'inspector')
export class AdminController {}
