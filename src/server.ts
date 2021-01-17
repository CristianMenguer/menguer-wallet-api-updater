import cron from 'node-cron'
import { updateQuotesService } from './services/UpdateDatabaseAPIService'

cron.schedule('* */3 * * *', () => updateQuotesService())

