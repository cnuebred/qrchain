import { auth } from './auth'
import { resp } from './responses'
import { ExpressArgs, MetaOptions, MetaRequires } from './utils'

const restMethod = (
    target: Object,
    name: string,
    f: PropertyDescriptor,
    methodType: 'get' | 'post' | 'delete' | 'patch' | 'put',
    path: string,
    options: MetaOptions
) => {
    const set = target.constructor.prototype
    const setPrefix = `set_${name}`
    if (set[setPrefix]) set[setPrefix].method.push(methodType)
    else
        set[setPrefix] = {
            path: `${path}`,
            method: [methodType],
            worker: f.value,
            options
        }
}
const restWrapper = (method: 'get' | 'post' | 'delete' | 'patch' | 'put') => {
    return (path: string = '', requires?: MetaRequires, options?: MetaOptions) => {
        return (target: Object, name: string, f: PropertyDescriptor) => {
            const originalMethod = f.value
            f.value = (args: ExpressArgs) => {
                const notContains = {}
                const contains = {}
                if (requires)
                    Object.entries(requires).forEach(([meta, properties]) => {
                        notContains[meta] = []
                        contains[meta] = {}
                        if (!args.req[meta]) return
                        const keys = Object.keys(args.req[meta])
                        properties.forEach((item) => {
                            if (!item) return
                            if (!keys.includes(item) && !item.endsWith('?'))
                                notContains[meta].push(item)
                            else {
                                if (item.endsWith('?')) item = item.slice(0, -1)
                                contains[meta][item] = args.req[meta][item]
                            }
                        })
                    })
                const notContainsCondition =
                    Object.values(notContains)
                        .flat()
                        .filter((item) => !!item).length != 0

                if (notContainsCondition)
                    return args.res
                        .status(401)
                        .send(resp('Missing require data', notContains).err())

                return originalMethod({ ...args, ...contains })
            }
            restMethod(target, name, f, method, path, options)
        }
    }
}

export function _auth(
    gate: boolean = true,
    transfer: 'headers' | 'query' | 'body' | 'params' = 'headers',
    value: string = 'authorization'
) {
    return (target: Object, name: string, f: PropertyDescriptor) => {
        const originalMethod = f.value
        f.value = async (args: ExpressArgs) => {
            const auth_ = await auth(args.req[transfer][value] as string)
            if (gate && !auth_.pass) return args.res
                .status(401)
                .send(resp('Missing access').err())
            return originalMethod({ ...args, auth_ })
        }
    }
}

export function Controller(name: string, parent?: string) {
    return function <T extends { new(...args: any[]): {} }>(constructor: T) {
        constructor.prototype['__root__'] = { name, parent }
        constructor.prototype['__name__'] = constructor.name
        constructor.prototype['__init__']
        return class extends constructor { }
    }
}

export const _get = restWrapper('get')
export const _post = restWrapper('post')
export const _delete = restWrapper('delete')
export const _patch = restWrapper('patch')
export const _put = restWrapper('put')
