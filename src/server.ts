import cron from 'node-cron'
import { firstInsertion, updateQuotesService } from './services/UpdateDatabaseAPIService'

const firstRun = () => {
    firstInsertion()
}

//firstRun()

// cron.schedule('*/2 * * *', () => updateQuotesService())

updateQuotesService()