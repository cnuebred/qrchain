const restMethod = (
    target: Object,
    name: string,
    f: PropertyDescriptor,
    path: string,
    methodType: 'get' | 'post' | 'delete' | 'patch' | 'put'
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
    return
}
const restWrapper = (method: 'get' | 'post' | 'delete' | 'patch' | 'put') => {
    return (path: string = '') => {
        return (target, name, f) => restMethod(target, name, f, path, method)
    }
}

export function Controller(name: string, parent?: string) {
    return function <T extends { new (...args: any[]): {} }>(constructor: T) {
        constructor.prototype['__root__'] = { name, parent }
        constructor.prototype['__name__'] = constructor.name
        return class extends constructor {}
    }
}

export const _get = restWrapper('get')
export const _post = restWrapper('post')
export const _delete = restWrapper('delete')
export const _patch = restWrapper('patch')
export const _put = restWrapper('put')
