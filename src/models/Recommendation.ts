import * as db from '../database'
import Recommendation from '../entities/Recommendation'

const COLLECTION = 'recommendation'

// This function receives Quote objects and insert then to the Database
export const insertRecommendations = async (recommendations: Recommendation[]): Promise<void> => {
    try {
        const results = await db.addMany(COLLECTION, recommendations)
        //        
    } catch (err) {
        console.log('Error: > Recommendation.model > insertRecommendations:')
        console.log(err)
    }
}

// This function returns all the Recommendation Objects from the Database
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