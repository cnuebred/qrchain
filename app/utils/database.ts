type defaultDataset = {
    [index: string]: string
}


export const getRecord = <T>(db, index: number = 0): T => {
    let obj = {}
    if (db.rows?.[index])
        Array.from(db.names).forEach((item: string, row: number) => {
            obj[item] = db.rows[index][row]
        })
    else
        return null
    return obj as T
}