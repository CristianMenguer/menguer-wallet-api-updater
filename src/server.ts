import express, { Response, Request } from 'express'
import cron from 'node-cron'
import { updateQuotesServiceWhile } from './services/UpdateDatabaseAPIService'
import { updateStrategies } from './services/UpdateStrategiesService'

// Reading form environment variables
const HOSTNAME = process.env.HOSTNAME ? process.env.HOSTNAME : '0.0.0.0'
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000

/**
 * Function to schedule tasks. It runs:
 * - From monday to Friday;
 * - 6pm, 8pm and 10pm in the brazilian timezone.
 * 
 * This times because are after the Brazilian Stock Market
 * 
 * It updates the Database and create the Recommendations
 */
cron.schedule('0 18-20-22 * * 1-5', async () => {
    await updateQuotesServiceWhile()
    await updateStrategies()
}, {
    scheduled: true,
    timezone: "America/Sao_Paulo"
})

const app = express()

// Route to be called (if necessary) to force an update, calling the functions
// to read from the API's and generate recommendations
app.get('/checkforupdates', (request: Request, response: Response) => {
    console.log('> checkforupdates')
    updateQuotesServiceWhile()
    .then(() => {
        updateStrategies()
    })

    return response.status(404).json({
        title: 'Welcome to Menguer Wallet - 2020087 API 👍🏼',
        message: 'This command has forced an update!'
    })
})

// Route to HomePage, return only a default message
app.use((request: Request, response: Response) => {
    console.log('[%s] %s -- %s', new Date(), request.method, request.url)
    return response.status(404).json({
        message: 'Welcome to Menguer Wallet - 2020087 API 👍🏼',
        your_url: request.url
    })
})

// Starts the server
app.listen(PORT, HOSTNAME, () => {
    console.log(`> Server started on ${HOSTNAME}:${PORT} 👌`)
})