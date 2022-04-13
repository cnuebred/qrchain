import { Controller, _get } from '../../utils/controller'

@Controller('inspector')
export class Inspector {
    @_get('/')
    main({ res }) {
        return res
            .status(200)
            .send('<code>Hello<br>Here is inspector for qrchain server</code>')
    }
}
@Controller('controller', 'inspector')
export class AdminController {}
