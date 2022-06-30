import { Controller, _auth, _get } from '../../utils/controller'

@Controller('user')
export class User {
    @_get('/member')
    @_auth()
    user_data({ res, auth_ }) {
        return res.send({ user: auth_.data.username, hash: auth_.data.hash })
    }
}