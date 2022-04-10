import { Express } from 'express-serve-static-core'
import { logger } from 'ratlogger'
import { Leaf, ControllerType as Controller } from './router.d'

type RootPackage<T> = { [index: string]: T }

export class Router {
    components: any[]
    roots: RootPackage<string> = {}
    paths: RootPackage<string> = {}
    leaf: Leaf[] = []
    metaleaf: RootPackage<number> = {}
    constructor(components: any) {
        this.components = components
        this.unzipRoots()
    }
    show = (): void => {
        this.leaf.forEach((item) => {
            logger.component(
                `#{status_init(component ${item.status})}`,
                ...['rootName', 'name', 'method', 'path'].map((name) => {
                    const space = this.metaleaf[name]
                    return `@{green}#{align(${item[name]} ${space})}@{blue}|`
                })
            )
        })
    }
    setup = (app: Express): void => {
        this.components.forEach((Component: any) => {
            const _component: Controller = new Component()
            const __proto__ = Object.getPrototypeOf(
                _component.constructor.prototype
            )
            const rootPath = this.paths[_component.__root__.name]
            Object.entries(__proto__)
                .filter(([name]) => {
                    return name.startsWith('set_')
                })
                .map(([name, component]: [string, any]) => {
                    const pcg: Leaf = {
                        name: name.slice(4),
                        rootName: _component.__name__,
                        method: component.method,
                        rootPath: rootPath,
                        path: (rootPath + `/${component.path}`).replaceAll(
                            '//',
                            '/'
                        ),
                        status: true,
                    }
                    try {
                        if (component.path == '')
                            throw new Error('Empty component path')

                        pcg.method.forEach((method) => {
                            app[method](pcg.path, (req, res, next) =>
                                component.worker({ req, res, next })
                            )
                        })
                    } catch (error) {
                        logger.error(error.message)
                        pcg.status = false
                    }
                    this.leaf.push(pcg)
                    this.generateMetaLeaf(pcg)
                })
        })
    }
    private generateMetaLeaf = async (pcg: Leaf): Promise<void> => {
        Object.entries(pcg).forEach(([key, value]: any[]) => {
            if (key == 'method') value = value.join('.')
            let len = JSON.stringify(value).length
            const metaValue = this.metaleaf[key]
            if (len > (!metaValue ? 0 : metaValue)) this.metaleaf[key] = len
        })
    }
    private findParents = (last: string): string => {
        if (!last) return ''
        const existed = this.paths[last]
        const parent = existed || this.findParents(this.roots[last])
        return `${parent}${!!existed ? '' : `/${last}`}`
    }
    private pathResolver = (): void => {
        Object.keys(this.roots)
            .filter((item) => !!item)
            .forEach((item) => {
                this.paths[item] = this.findParents(item).replaceAll('//', '/')
            })
    }
    private unzipRoots = (): void => {
        this.components.forEach((item) => {
            const root = item.prototype.__root__
            this.roots[root.name] = root.parent
        })
        this.pathResolver()
    }
}
