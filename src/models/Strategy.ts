import * as db from '../database'
import Strategy from '../entities/Strategy'

const COLLECTION = 'strategy'

// This function returns all the Strategy Objects from the Database
export const getStrategies = async (query = {}): Promise<Strategy[]> => {
    
    try {
        const strategies = await db.get(COLLECTION, query) as Strategy[]
        
        return strategies
    }
    catch (err) {
        console.log('Error: > Strategy.model > getStrategies:')
        console.log(err)
        return []
    }
}

// This function receives a Strategy object and insert it to the Database.
// If it already exists, it is updated
export const upsertStrategy = async (strategy: Strategy): Promise<void> => {
    try {
        const objsDB = await getStrategies() 
        if (objsDB.filter(obj => obj.id === strategy.id).length < 1) 
            await db.add(COLLECTION, strategy)
        //
    } catch (err) {
        console.log('Error: > Strategy.model > upsertStrategy:')
        console.log(err)
        //return {} as Quote
    }
}
