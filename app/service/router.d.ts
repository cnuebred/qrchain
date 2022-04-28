export type Leaf = {
    name: string
    rootName: string
    method: string[]
    rootPath: string
    path: string
    status: boolean
}
export interface ControllerType {
    __root__: { name: string; parent: string }
    __name__: string
}
