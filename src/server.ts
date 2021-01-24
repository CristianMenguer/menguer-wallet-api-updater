import express, { Response, Request } from 'express'
import cron from 'node-cron'
import { updateQuotesServiceWhile } from './services/UpdateDatabaseAPIService'
import api from './services/api'
import { updateStrategies } from './services/UpdateStrategiesService'

const HOSTNAME = process.env.HOSTNAME ? process.env.HOSTNAME : '0.0.0.0'

const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000

function pinger_ping(url: string = 'google.com') {
    //console.log('calling ' + url)
    api.get(url)
    .then(response => {
        //console.log('response')
        //console.log(response)
    })
    .catch(err => {
        //console.log('err')
        //console.log(err)
    })
    
}

cron.schedule('*/15 * * * *', () => {
    console.log(`${new Date()}: Keep app running!`)
    pinger_ping(`http://${HOSTNAME}:${PORT}/`)
}, {
    scheduled: true,
    timezone: "America/Sao_Paulo"
})

cron.schedule('0 18-20-22 * * 1-5', async () => {
    await updateQuotesServiceWhile()
    await updateStrategies()
}, {
    scheduled: true,
    timezone: "America/Sao_Paulo"
})

const app = express()

app.get('/checkforupdates', (request: Request, response: Response) => {
    console.log('> checkforupdates')
    updateQuotesServiceWhile()

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
    updateStrategies()
})