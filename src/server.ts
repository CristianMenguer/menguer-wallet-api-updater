import express, { Response, Request } from 'express'
import cron from 'node-cron'
import { updateQuotesService } from './services/UpdateDatabaseAPIService'

const HOSTNAME = '0.0.0.0'

const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000

cron.schedule('* */3 * * 1-5', () => updateQuotesService())

const app = express()

app.get('/checkforupdates', (request: Request, response: Response) => {
    updateQuotesService()
    
    return response.status(404).json({
        title: 'Welcome to Menguer Wallet - 2020087 API 👍🏼',
        message: 'This command has forced an update!'
    })
})

app.use((request: Request, response: Response) => {
    console.log('[%s] %s -- %s', new Date(), request.method, request.url)
    return response.status(404).json({
        message: 'Welcome to Menguer Wallet - 2020087 API 👍🏼',
        your_url: request.url
    })
})

app.listen(PORT, HOSTNAME, () => {
    console.log(`> Server started on ${HOSTNAME}:${PORT} 👌`)
})