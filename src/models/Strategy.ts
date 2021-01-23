import * as db from '../database'
import Strategy from '../entities/Strategy'

const COLLECTION = 'strategy'

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
