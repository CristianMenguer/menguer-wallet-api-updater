import Company from '../entities/Company'
import Quote from '../entities/Quote'
import { mapSeries } from 'async'

import { getCompanies, upsertCompany } from '../models/Company'
import { insertQuotes, getQuoteByCodeStockAndDate } from '../models/Quote'
import { padL, replaceAll, sleep } from '../Utils/Utils'
import apiCompanies from './GetCompaniesApiService'
import apiHistorical from './GetHistoricalApiService'
import sysInfoApiDaily from './GetLastUpdateApiService'
import { datesEqual } from '../Utils/Utils'

const DELAY_CONN = (process.env.DELAY_CONN && parseInt(process.env.DELAY_CONN) > 0) ? parseInt(process.env.DELAY_CONN) : 10000

// Function to get the Quotes form the third-party API and save it to the Database
export const updateQuotesServiceWhile = async (): Promise<void> => {
    console.log(`\nlog => running update (${new Date()})\n\n`)

    let previousDate = new Date()

    // Get companies from Database
    const companies = await getCompanies()
    const lenCompanies = companies.length
    const quotesToAdd = [] as Quote[]
    let countCompanies = 0
    //
    console.log(`Companies length: ${lenCompanies}`)
    //
    // While loop to go through all the companies
    while (companies.length > 0) {
        const companyDB = companies.shift()
        countCompanies++
        if (!!companyDB) {
            console.log(`\nlog => company => ${padL((companyDB.name), ' ', 20)}: ${padL(countCompanies + '/' + lenCompanies, ' ', 10)} - ${Math.trunc((countCompanies * 100) / lenCompanies)}%`)
            //
            // Get all the stock codes that the company has
            const codes: string[] = replaceAll(companyDB.code, ' ', '').split(',')
            //
            while (codes.length > 0) {
                const code = codes.shift()
                //
                if (!!code && code.length >= 4)
                {
                    // Wait a period of time before a new request to the API, 
                    // in order to avoid too many request
                    while (((new Date()).getTime() - previousDate.getTime()) < DELAY_CONN)
                        await sleep(Math.floor(DELAY_CONN / 5))
                    //
                    // Get the Last quotes to the specific stock
                    const quotes = await apiHistorical(code, false)
                    previousDate = new Date()
                    const lenQuotes = Object.keys(quotes).length
                    //
                    if (!!quotes && lenQuotes > 0) {
                        const keys = Object.keys(quotes)
                        //
                        // Get the Quotes of the stock from Database to Validate and avoid duplicate Documents
                        const quotesSQLite = await getQuoteByCodeStockAndDate({
                            codeStock: code
                        })
                        //
                        while (keys.length > 0) {
                            const keyDate = keys.shift()
                            //
                            if (!!keyDate) {
                                const dateAPI = new Date(keyDate)
                                //
                                // If a Quote is not found to the same Date, it will be inserted
                                const quoteByDate = quotesSQLite.filter(quoteFilter => datesEqual(quoteFilter.date, dateAPI))
                                const needsUpdate = !quoteByDate || !quoteByDate.length || quoteByDate.length < 1
                                //
                                if (needsUpdate) {
                                    // @ts-ignore
                                    const quoteAPI = quotes[keyDate] as HistoricalResponse
                                    const quoteToInsert = new Quote(companyDB.id_api, code, parseFloat(quoteAPI['1. open']), parseFloat(quoteAPI['4. close']), parseFloat(quoteAPI['2. high']), parseFloat(quoteAPI['3. low']), parseFloat(quoteAPI['6. volume']), dateAPI, parseFloat(quoteAPI['7. dividend amount']), parseFloat(quoteAPI['8. split coefficient']))
                                    // The Quote is inserted in an array 
                                    quotesToAdd.push(quoteToInsert)
                                }
                            }
                        }
                    }
                }
            }
        }
    }
    //
    // Array of Quotes is sent to Database
    // It is done this way to avoid multiple connections to the Database
    console.log('\nQuotes to be added:' + quotesToAdd.length)
    if (quotesToAdd.length > 0)
        await insertQuotes(quotesToAdd)
    //
}

// Function used only during the First Insertion, when the companies where added
export const firstInsertion = async (): Promise<void> => {

    // List of companies to be inserted
    const COMPANIES_RDZ = [
        'OIBR',
        'PETR',
        'UGPA',
        'TIET',
        'VALE',
        'BIDI',
        'GOAU',
        'BBAS',
        'USIM',
        'BRKM',
        'UNIP',
        'ITUB',
        'KLBN',
        'SUZB',
        'MILS',
        'EMBR',
        'POMO',
        'B3SA',
        'WEGE',
        'ROMI',
        'AZUL',
        'GOLL',
        'IRBR',
        'ECOR',
        'ATOM',
        'JBSS',
        'MRFG',
        'BEEF',
        'CAML',
        'ABEV',
        'PCAR',
        'EVEN',
        'JHSF',
        'GRND',
        'SEER',
        'RENT',
        'SMLS',
        'MGLU',
        'FLRY',
        'ITSA'
    ]

    // Check if the API is working
    const sysInfo = await sysInfoApiDaily()
    if (!!!sysInfo) {
        console.log('API LABDO not responding!')
        return
    }

    // Get companies from Database
    const companies = await apiCompanies()

    const lenCompanies = companies.length
    let countCompanies = 0
    let previousPerc = 0
    let previousDate = new Date()
    //
    // Go through all the comanies from the API
    await mapSeries(companies, async (companyAPI, callbackCompany): Promise<void> => {
        countCompanies++
        const codes: string[] = replaceAll(companyAPI.cd_acao, ' ', '').split(',')
        //
        // CHeck if the Company is in the list to be inserted
        if (COMPANIES_RDZ.includes(companyAPI.cd_acao_rdz)) {
            console.log(`\nlog => company => ${padL((companyAPI.nm_empresa), ' ', 20)}: ${padL(countCompanies + '/' + lenCompanies, ' ', 10)} - ${Math.trunc((countCompanies * 100) / lenCompanies)}%`)
            await mapSeries(codes, async (code, callbackCode): Promise<void> => {
                //Get the stock code and validate it
                if (code.length >= 4) {
                    // Wait a period of time before a new request to the API, 
                    // in order to avoid too many request
                    while (((new Date()).getTime() - previousDate.getTime()) < DELAY_CONN)
                        await sleep(Math.floor(DELAY_CONN / 5))
                    //
                    // Get all the available Quotes to the stock
                    const quotes = await apiHistorical(code, true)
                    previousDate = new Date()
                    //
                    const lenQuotes = Object.keys(quotes).length
                    //
                    if (!!quotes && lenQuotes > 0) {
                        const company: Company = new Company(companyAPI.id, companyAPI.cd_acao_rdz, companyAPI.nm_empresa, companyAPI.cd_acao, companyAPI.setor_economico, companyAPI.subsetor, companyAPI.subsetor)
                        await upsertCompany(company)
                        //
                        while (((new Date()).getTime() - previousDate.getTime()) < DELAY_CONN)
                            await sleep(Math.floor(DELAY_CONN / 5))
                        //
                        previousDate = new Date()
                        //
                        const quotesToAdd = [] as Quote[]
                        await mapSeries(Object.keys(quotes), async (keyDate, callbackDate): Promise<void> => {
                            const dateAPI = new Date(keyDate)
                            // @ts-ignore
                            const quoteAPI = quotes[keyDate] as HistoricalResponse
                            const quoteToInsert = new Quote(company.id_api, code, parseFloat(quoteAPI['1. open']), parseFloat(quoteAPI['4. close']), parseFloat(quoteAPI['2. high']), parseFloat(quoteAPI['3. low']), parseFloat(quoteAPI['6. volume']), dateAPI, parseFloat(quoteAPI['7. dividend amount']), parseFloat(quoteAPI['8. split coefficient']))
                            // Quote to be inserted is added to an array
                            quotesToAdd.push(quoteToInsert)
                            callbackDate()
                        })
                        // Array of Quotes is sent to Database
                        // It is done this way to avoid multiple connections to the Database
                        await insertQuotes(quotesToAdd)
                        while (((new Date()).getTime() - previousDate.getTime()) < DELAY_CONN)
                            await sleep(Math.floor(DELAY_CONN / 5))
                        //
                        previousDate = new Date()
                    }
                }
                callbackCode()
            })
        }
        callbackCompany()
    })
}
