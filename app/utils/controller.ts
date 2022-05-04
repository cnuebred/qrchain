import { auth } from './auth'
import { res } from './responses'
import { ExpressArgs, MetaRequires } from './utils'

const restMethod = (
    target: Object,
    name: string,
    f: PropertyDescriptor,
    methodType: 'get' | 'post' | 'delete' | 'patch' | 'put',
    path: string
) => {
    const set = target.constructor.prototype
    const setPrefix = `set_${name}`
    if (set[setPrefix]) set[setPrefix].method.push(methodType)
    else
        set[setPrefix] = {
            path: `${path}`,
            method: [methodType],
            worker: f.value,
        }
}
const restWrapper = (method: 'get' | 'post' | 'delete' | 'patch' | 'put') => {
    return (path: string = '', requires?: MetaRequires) => {
        return (target: Object, name: string, f: PropertyDescriptor) => {
            const originalMethod = f.value
            f.value = (args: ExpressArgs) => {
                const notContains = {}
                if (requires)
                    Object.entries(requires).forEach(([meta, properties]) => {
                        notContains[meta] = []
                        if (!args.req[meta]) return
                        const keys = Object.keys(args.req[meta])
                        properties.forEach((item) => {
                            if (!item) return
                            if (!keys.includes(item))
                                notContains[meta].push(item)
                        })
                    })
                const notContainsCondition =
                    Object.values(notContains)
                        .flat()
                        .filter((item) => !!item).length != 0

                if (notContainsCondition)
                    return args.res
                        .status(401)
                        .send(
                            res()
                                .err()
                                .msg('Missing require data')
                                .data(notContains).response
                        )

                return originalMethod(args)
            }
            restMethod(target, name, f, method, path)
        }
    }
}

export function _auth(
    transfer: 'headers' | 'query' | 'params' = 'headers',
    value: string = 'auth'
) {
    return (target: Object, name: string, f: PropertyDescriptor) => {
        const originalMethod = f.value
        f.value = async (args: ExpressArgs) => {
            const auth_ = await auth(args.req[transfer][value] as string)
            return originalMethod({ ...args, auth_ })
        }
    }
}

export function Controller(name: string, parent?: string) {
    return function <T extends { new(...args: any[]): {} }>(constructor: T) {
        constructor.prototype['__root__'] = { name, parent }
        constructor.prototype['__name__'] = constructor.name
        return class extends constructor { }
    }
}

export const _get = restWrapper('get')
export const _post = restWrapper('post')
export const _delete = restWrapper('delete')
export const _patch = restWrapper('patch')
export const _put = restWrapper('put')
