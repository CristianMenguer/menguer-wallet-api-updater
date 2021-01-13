import cron from 'node-cron'
import { firstInsertion, updateQuotesService } from './services/UpdateDatabaseAPIService'

const firstRun = () => {
    firstInsertion()
}

firstRun()

// cron.schedule('20,22 * * *', () => {
//     console.log('Running in specific hours at America/Sao_Paulo timezone')
//     updateQuotesService()
// }, {
//     scheduled: true,
//     timezone: "America/Sao_Paulo"
// })