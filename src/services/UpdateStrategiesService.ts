import Quote from "../entities/Quote"
import Strategy from "../entities/Strategy"
import Recommendation from "../entities/Recommendation"
import { getDistinctCodeStock, getQuoteByCodeStockAndDate, getQuotes } from "../models/Quote"
import { upsertStrategy } from "../models/Strategy"
import { datesEqual, sleep, sleep2 } from "../Utils/Utils"
import { getRecommendations, insertRecommendations } from "../models/Recommendation"

export const updateStrategies = async (): Promise<void> => {
    console.log('\n')
    console.log('> log: Starting analysis...')
    console.log('\n')
    await updateStrategyMA({ MA_Short: 9, MA_Long: 17 })
    await updateStrategyCloud()
    //
    console.log('\n')
    console.log('> log: Analysis has finished...')
    console.log('\n')
}

export const updateStrategyCloud = async (): Promise<void> => {
    console.log('\n> log: Starting Ichimoku Clouds analysis...')
    const strategy = new Strategy(2, 'Ichimoku Cloud', 'The Ichimoku Cloud is a collection of technical indicators that show support and resistance levels, as well as momentum and trend direction.')
    await upsertStrategy(strategy)
    const codes = await getDistinctCodeStock()
    //
    if (!!codes && codes.length > 0) {
        const allQuotesDB = await getQuotes()
        const dateFrom = new Date()
        const dateResult = new Date()
        dateFrom.setMonth(dateFrom.getMonth() - 6)
        dateResult.setMonth(dateResult.getMonth() - 1)
        //
        const recommendationsToAdd: Recommendation[] = []
        //
        while (!!codes && codes.length > 0) {
            const code = codes.shift()
            //
            if (!!code && code.length > 4) { //} && code === 'PETR4') {
                const quotesByCode = allQuotesDB.filter(quo => (quo.code_stock === code && quo.date > dateFrom))
                const quotes: Quote[] = []
                //
                quotesByCode.sort((a, b) => a.date > b.date ? 1 : -1)
                //
                let lastDateAdded = new Date()
                quotesByCode.map(quo => {
                    if (!datesEqual(quo.date, lastDateAdded)) {
                        quotes.push(quo)
                        lastDateAdded = quo.date
                    }
                })
                //
                const analytics: CloudAnalytic[] = []
                const ninePeriod: number[] = []
                const twentySixPeriod: number[] = []
                const FiftyTwoPeriod: number[] = []
                const SpanAPeriod: number[] = []
                const SpanBPeriod: number[] = []
                //
                quotes.map(quote => {
                    //
                    if (ninePeriod.push(quote.close) > 9)
                        ninePeriod.shift()
                    //
                    if (twentySixPeriod.push(quote.close) > 26)
                        twentySixPeriod.shift()
                    //
                    if (FiftyTwoPeriod.push(quote.close) > 52)
                        FiftyTwoPeriod.shift()
                    //
                    const nineLow = Math.min(...ninePeriod)
                    const nineHigh = Math.max(...ninePeriod)
                    const twentySixLow = Math.min(...twentySixPeriod)
                    const twentySixHigh = Math.max(...twentySixPeriod)
                    const FiftyTwoLow = Math.min(...FiftyTwoPeriod)
                    const FiftyTwoHigh = Math.max(...FiftyTwoPeriod)
                    //
                    const ConversionLine = (nineHigh + nineLow) / 2
                    const BaseLine = (twentySixHigh + twentySixLow) / 2
                    //
                    let SpanA = 0
                    let SpanB = 0
                    //
                    if (SpanAPeriod.push((ConversionLine + BaseLine) / 2) > 26) {
                        const temp = SpanAPeriod.shift()
                        SpanA = temp ? temp : 0
                    }
                    //
                    if (SpanBPeriod.push((FiftyTwoHigh + FiftyTwoLow) / 2) > 26) {
                        const temp = SpanBPeriod.shift()
                        SpanB = temp ? temp : 0
                    }
                    //
                    if (FiftyTwoPeriod.length >= 51)
                        analytics.push({
                            value: quote.close,
                            ConversionLine,
                            BaseLine,
                            SpanA,
                            SpanB,
                            LaggingSpan: twentySixPeriod ? twentySixPeriod[0] : 0,
                            message: (SpanA > SpanB) ? 'Up' : 'Down',
                            date: quote.date,
                            volume: quote.volume
                        })
                    //
                })
                //
                let previousSpanA = 0
                let previousSpanB = 0
                let previousValue = 0
                let previousVolume = 0
                //
                analytics.map(element => {
                    //
                    /**
                     * if spanA > spanB = green zone
                     * if spanB > spanA = red   zone
                     */
                    //
                    if (element.date >= dateResult) {
                        //
                        if ((previousValue < Math.max(previousSpanA, previousSpanB)) && (element.value > Math.max(element.SpanA, element.SpanB))) {
                            //if (element.SpanA > element.SpanB) 
                            if (element.volume > previousVolume) {
                                //console.log(`> code: ${code} -  buy - R$ ${element.value} - ${element.date.getDate() + '/' + (element.date.getMonth() + 1) + '/' + element.date.getFullYear()}`)
                                recommendationsToAdd.push(new Recommendation(strategy.id, element.date, code, 'buy'))
                            }
                        }
                        //
                        if ((previousValue > Math.min(previousSpanA, previousSpanB)) && (element.value < Math.min(element.SpanA, element.SpanB))) {
                            //if (element.SpanB > element.SpanA) 
                            if (element.volume > previousVolume) {
                                //console.log(`> code: ${code} - sell - R$ ${element.value} - ${element.date.getDate() + '/' + (element.date.getMonth() + 1) + '/' + element.date.getFullYear()}`)
                                recommendationsToAdd.push(new Recommendation(strategy.id, element.date, code, 'sell'))
                            }
                        }
                    }
                    //
                    previousSpanA = element.SpanA
                    previousSpanB = element.SpanB
                    previousValue = element.value
                    previousVolume = element.volume
                    //
                })
                //
            }
        }
        await upsertRecommendations(recommendationsToAdd)
    }
    console.log('> log: Ichimoku Clouds analysis has finished...')
}

export const updateStrategyMA = async (params: MovingAverageParams): Promise<void> => {
    console.log('\n> log: Starting Moving Average Crossover analysis...')
    const strategy = new Strategy(1, 'Moving Average Crossover', 'This strategy has two moving averages, the first one of 9 days, and the second of 17 days. A recommendation is created when the shorter crosses the longer, indicating that the trend has changed.')
    await upsertStrategy(strategy)
    const codes = await getDistinctCodeStock()
    //
    if (!!codes && codes.length > 0) {
        const allQuotesDB = await getQuotes()
        const dateFrom = new Date()
        const dateResult = new Date()
        dateFrom.setMonth(dateFrom.getMonth() - 6)
        dateResult.setMonth(dateResult.getMonth() - 1)
        const recommendationsToAdd: Recommendation[] = []
        //
        while (!!codes && codes.length > 0) {
            const code = codes.shift()
            //
            if (!!code && code.length > 4) { //} && code === 'PETR4') {
                const quotesByCode = allQuotesDB.filter(quo => (quo.code_stock === code && quo.date > dateFrom))
                const quotes: Quote[] = []
                //
                quotesByCode.sort((a, b) => a.date > b.date ? 1 : -1)
                //
                let lastDateAdded = new Date()
                quotesByCode.map(quo => {
                    if (!datesEqual(quo.date, lastDateAdded)) {
                        quotes.push(quo)
                        lastDateAdded = quo.date
                    }
                })
                //
                const valuesMovAvgLong: number[] = []
                const valuesMovAvgShort: number[] = []
                //
                const analytics: MovAvgAnalytic[] = []
                //
                quotes.map(quote => {
                    if (valuesMovAvgLong.push(quote.close) > params.MA_Long)
                        valuesMovAvgLong.shift()
                    //
                    if (valuesMovAvgShort.push(quote.close) > params.MA_Short)
                        valuesMovAvgShort.shift()
                    //
                    if (valuesMovAvgLong.length >= (params.MA_Long - 1)) {
                        const averageShort = valuesMovAvgShort.reduce((a, b) => a + b) / valuesMovAvgShort.length
                        const averageLong = valuesMovAvgLong.reduce((a, b) => a + b) / valuesMovAvgLong.length
                        //
                        analytics.push({
                            value: quote.close,
                            movAvgLong: averageLong,
                            movAvgShort: averageShort,
                            message: '',
                            date: quote.date,
                            volume: quote.volume
                        })
                    }
                })
                //
                let previousVal = 0
                let previousAvgShort = 0
                let previousAvgLong = 0
                let previousVolume = 0

                analytics.map(element => {

                    if (previousVal > 0 && element.date > dateResult) {
                        if ((previousAvgLong < previousAvgShort) && (element.movAvgLong > element.movAvgShort) && (element.volume > previousVolume)) {
                            element.message = 'sell'
                            //console.log(`> code: ${code} - sell - R$ ${element.value} - ${element.date.getDate() + '/' + (element.date.getMonth() + 1) + '/' + element.date.getFullYear()}`)
                            // const recommendation = new Recommendation(strategy.id, element.date, code, 'sell')
                            // console.log(recommendation)
                            recommendationsToAdd.push(new Recommendation(strategy.id, element.date, code, 'sell'))

                        }
                        //
                        if ((previousAvgShort < previousAvgLong) && (element.movAvgShort > element.movAvgLong) && (element.volume > previousVolume)) {
                            element.message = 'buy'
                            //console.log(`> code: ${code} -  buy - R$ ${element.value} - ${element.date.getDate() + '/' + (element.date.getMonth() + 1) + '/' + element.date.getFullYear()}`)
                            // const recommendation = new Recommendation(strategy.id, element.date, code, 'buy')
                            // console.log(recommendation)
                            recommendationsToAdd.push(new Recommendation(strategy.id, element.date, code, 'buy'))
                        }

                    }
                    //
                    previousAvgLong = element.movAvgLong
                    previousAvgShort = element.movAvgShort
                    previousVal = element.value
                    previousVolume = element.volume
                })
                //
            }
        }
        await upsertRecommendations(recommendationsToAdd)
    }
    console.log('> log: Moving Average Crossover analysis has finished...')
}


export const upsertRecommendations = async (params: Recommendation[]): Promise<void> => {
    if (!params || params.length < 1)
        return
    //
    const recommendationDB = await getRecommendations({
        id_strategy: params[0].id_strategy
    })
    //
    const recommendationsToAdd: Recommendation[] = []
    //
    params.forEach(rec => {
        if (recommendationDB.filter(element => (element.code_stock === rec.code_stock && datesEqual(element.date, rec.date))).length < 1) 
            recommendationsToAdd.push(rec)
    })
    //
    if (recommendationsToAdd.length > 0)
        insertRecommendations(recommendationsToAdd)
    //
}