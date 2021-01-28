// Class Strategy and its constructor defined here

class Strategy {
    _id?: string
    id: number
    name: string
    description: string
    created_at?: Date
    updated_at?: Date

    constructor(id: number, name: string, description: string) {
        this.id = id
        this.name = name
        this.description = description
        this.created_at = new Date()
        this.updated_at = new Date()
    }
}

export default Strategy