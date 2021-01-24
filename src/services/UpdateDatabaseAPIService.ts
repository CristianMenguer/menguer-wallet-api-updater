import Company from '../entities/Company'
import Quote from '../entities/Quote'
import { mapSeries } from 'async'

import { getCompanies, upsertCompany } from '../models/Company'
import { upsertQuote, getLastUpdateByCodeStock, getAmountQuotesByCodeStock, insertQuotes, getQuoteByCodeStockAndDate } from '../models/Quote'
import { padL, replaceAll, sleep, sleep2 } from '../Utils/Utils'
import apiCompanies from './GetCompaniesApiService'
import apiHistorical from './GetHistoricalApiService'
import sysInfoApiDaily from './GetLastUpdateApiService'
import { datesEqual, dateToPregao, dateToPregaoHiphen } from '../Utils/ValidateInputs'

const DELAY_CONN = (process.env.DELAY_CONN && parseInt(process.env.DELAY_CONN) > 0) ? parseInt(process.env.DELAY_CONN) : 10000

export const updateQuotesServiceWhile = async (): Promise<void> => {
    console.log(`\nlog => running update (while) (${new Date()})\n\n`)

    let previousDate = new Date()

    const companies = await getCompanies()
    const lenCompanies = companies.length
    const quotesToAdd = [] as Quote[]
    let countCompanies = 0
    //
    console.log(`Companies length: ${lenCompanies}`)
    //
    while (companies.length > 0) {
        const companyDB = companies.shift()
        countCompanies++
        if (!!companyDB
            //&& countCompanies === 1
        ) {
            console.log(`\nlog => company => ${padL((companyDB.name), ' ', 20)}: ${padL(countCompanies + '/' + lenCompanies, ' ', 10)} - ${Math.trunc((countCompanies * 100) / lenCompanies)}%`)
            const codes: string[] = replaceAll(companyDB.code, ' ', '').split(',')
            //
            while (codes.length > 0) {
                const code = codes.shift()
                //
                if (!!code && code.length >= 4)// && code === 'PETR4') 
                {
                    while (((new Date()).getTime() - previousDate.getTime()) < DELAY_CONN)
                        await sleep(Math.floor(DELAY_CONN / 5))
                    //
                    const quotes = await apiHistorical(code, false)
                    previousDate = new Date()
                    const lenQuotes = Object.keys(quotes).length
                    //
                    if (!!quotes && lenQuotes > 0) {
                        const keys = Object.keys(quotes)
                        //
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
                                // console.log('\n\n')
                                // console.log('dateAPI')
                                // console.log(dateAPI)
                                const quoteByDate = quotesSQLite.filter(quoteFilter => datesEqual(quoteFilter.date, dateAPI))
                                const needsUpdate = !quoteByDate || !quoteByDate.length || quoteByDate.length < 1
                                // console.log('needsUpdate')
                                // console.log(needsUpdate)
                                // console.log('\n\n')
                                //
                                if (needsUpdate) {
                                    // @ts-ignore

                                    const quoteAPI = quotes[keyDate] as HistoricalResponse
                                    const quoteToInsert = new Quote(companyDB.id_api, code, parseFloat(quoteAPI['1. open']), parseFloat(quoteAPI['4. close']), parseFloat(quoteAPI['2. high']), parseFloat(quoteAPI['3. low']), parseFloat(quoteAPI['6. volume']), dateAPI, parseFloat(quoteAPI['7. dividend amount']), parseFloat(quoteAPI['8. split coefficient']))
                                    quotesToAdd.push(quoteToInsert)
                                    // console.log('quoteToInsert')
                                    // console.log(quoteToInsert)
                                }
                            }
                        }
                    }
                }
            }
        }
    }
    //
    console.log('\nQuotes to be added:' + quotesToAdd.length)
    if (quotesToAdd.length > 0)
        await insertQuotes(quotesToAdd)
    //console.log(quotesToAdd[0])
    //
}

export const firstInsertion = async (): Promise<void> => {

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

    const sysInfo = await sysInfoApiDaily()
    if (!!!sysInfo) {
        console.log('API LABDO not responding!')
        return
    }

    const companies = await apiCompanies()

    const lenCompanies = companies.length
    let countCompanies = 0
    let previousPerc = 0
    let previousDate = new Date()
    //
    await mapSeries(companies, async (companyAPI, callbackCompany): Promise<void> => {
        countCompanies++
        const codes: string[] = replaceAll(companyAPI.cd_acao, ' ', '').split(',')
        //
        if (COMPANIES_RDZ.includes(companyAPI.cd_acao_rdz)) {
            console.log(`\nlog => company => ${padL((companyAPI.nm_empresa), ' ', 20)}: ${padL(countCompanies + '/' + lenCompanies, ' ', 10)} - ${Math.trunc((countCompanies * 100) / lenCompanies)}%`)
            await mapSeries(codes, async (code, callbackCode): Promise<void> => {
                if (code.length >= 4) {
                    while (((new Date()).getTime() - previousDate.getTime()) < DELAY_CONN)
                        await sleep(Math.floor(DELAY_CONN / 5))
                    //
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
                            quotesToAdd.push(quoteToInsert)
                            callbackDate()
                        })
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

export const updateQuotesService = async (): Promise<void> => {
    console.log(`\nlog => running update (${new Date()})\n\n`)

    let previousDate = new Date()

    const companies = await getCompanies()

    const lenCompanies = companies.length
    let countCompanies = 0
    //
    const quotesToAdd = [] as Quote[]
    //
    await mapSeries(companies, async (companyDB, callbackCompany): Promise<void> => {
        countCompanies++
        console.log(`\n\nlog => company => ${padL((companyDB.name), ' ', 20)}: ${padL(countCompanies + '/' + lenCompanies, ' ', 10)} - ${Math.trunc((countCompanies * 100) / lenCompanies)}%`)
        const codes: string[] = replaceAll(companyDB.code, ' ', '').split(',')
        //
        await mapSeries(codes, async (code, callbackCode): Promise<void> => {
            if (code.length >= 4) {
                while (((new Date()).getTime() - previousDate.getTime()) < DELAY_CONN)
                    await sleep(Math.floor(DELAY_CONN / 5))
                //
                const quotes = await apiHistorical(code, false)
                previousDate = new Date()
                const lenQuotes = Object.keys(quotes).length
                //
                if (!!quotes && lenQuotes > 0) {
                    //
                    const lastUpdate = await getLastUpdateByCodeStock(code)
                    //
                    await mapSeries(Object.keys(quotes), async (keyDate, callbackDate): Promise<void> => {
                        const dateAPI = new Date(keyDate)
                        const needsUpdate = !lastUpdate || (dateAPI > lastUpdate)
                        //
                        if (needsUpdate) {
                            // @ts-ignore
                            const quoteAPI = quotes[keyDate] as HistoricalResponse
                            const quoteToInsert = new Quote(companyDB.id_api, code, parseFloat(quoteAPI['1. open']), parseFloat(quoteAPI['4. close']), parseFloat(quoteAPI['2. high']), parseFloat(quoteAPI['3. low']), parseFloat(quoteAPI['6. volume']), dateAPI, parseFloat(quoteAPI['7. dividend amount']), parseFloat(quoteAPI['8. split coefficient']))
                            quotesToAdd.push(quoteToInsert)
                        }
                        callbackDate()
                    })
                }
            }
            callbackCode()
        })
        callbackCompany()
    })
    //
    console.log('\nQuotes to be added:' + quotesToAdd.length)
    if (quotesToAdd.length > 0) {
        await insertQuotes(quotesToAdd)

    }
}