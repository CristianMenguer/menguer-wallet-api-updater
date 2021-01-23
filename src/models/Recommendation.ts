import * as db from '../database'
import Recommendation from '../entities/Recommendation'
import { pregaoToDate } from '../Utils/ValidateInputs'

const COLLECTION = 'recommendation'

export const insertRecommendations = async (recommendations: Recommendation[]): Promise<void> => {
    try {
        const results = await db.addMany(COLLECTION, recommendations)
        //        
    } catch (err) {
        console.log('Error: > Recommendation.model > insertRecommendations:')
        console.log(err)
    }
}

export const getRecommendations = async (query = {}): Promise<Recommendation[]> => {
    
    try {
        const recommendations = await db.get(COLLECTION, query) as Recommendation[]
        
        return recommendations
    }
    catch (err) {
        console.log('Error: > Recommendation.model > getRecommendations:')
        console.log(err)
        return []
    }
}