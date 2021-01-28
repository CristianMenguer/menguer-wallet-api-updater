import Quote from "../entities/Quote"
import Strategy from "../entities/Strategy"
import Recommendation from "../entities/Recommendation"
import { getDistinctCodeStock, getQuoteByCodeStockAndDate, getQuotes } from "../models/Quote"
import { upsertStrategy } from "../models/Strategy"
import { datesEqual } from "../Utils/Utils"
import { getRecommendations, insertRecommendations } from "../models/Recommendation"

// Function to handle the Creation of Recommendations
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

// This function calculates the Ichimoku Cloud Strategy and save it to the Database
export const updateStrategyCloud = async (): Promise<void> => {
    console.log('\n> log: Starting Ichimoku Clouds analysis...')
    // Create the Strategy document if it does not exist
    const strategy = new Strategy(2, 'Ichimoku Cloud', 'The Ichimoku Cloud is a collection of technical indicators that show support and resistance levels, as well as momentum and trend direction.')
    await upsertStrategy(strategy)
    // Get from Database all the different Stock Codes
    const codes = await getDistinctCodeStock()
    //
    if (!!codes && codes.length > 0) {
        const allQuotesDB = await getQuotes()
        const dateFrom = new Date()
        const dateResult = new Date()
        // The function will use Data of 6 months to calculate recommendations to the last month
        dateFrom.setMonth(dateFrom.getMonth() - 6)
        dateResult.setMonth(dateResult.getMonth() - 1)
        //
        const recommendationsToAdd: Recommendation[] = []
        //
        while (!!codes && codes.length > 0) {
            const code = codes.shift()
            //
            if (!!code && code.length > 4) {
                // Filter the Quotes from Database to a specific Stock Code
                const quotesByCode = allQuotesDB.filter(quo => (quo.code_stock === code && quo.date > dateFrom))
                const quotes: Quote[] = []
                //
                // Sort the Quotes by Date
                quotesByCode.sort((a, b) => a.date > b.date ? 1 : -1)
                //
                // Method to avoid duplicate documentos
                let lastDateAdded = new Date()
                quotesByCode.map(quo => {
                    if (!datesEqual(quo.date, lastDateAdded)) {
                        quotes.push(quo)
                        lastDateAdded = quo.date
                    }
                })
                //
                // Initialise arrays used to calculate
                const analytics: CloudAnalytic[] = []
                const ninePeriod: number[] = []
                const twentySixPeriod: number[] = []
                const FiftyTwoPeriod: number[] = []
                const SpanAPeriod: number[] = []
                const SpanBPeriod: number[] = []
                //
                quotes.map(quote => {
                    //
                    // Calculation is done according to the Formula
                    // that can be found in the final report
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
                    // analytics is the array that contains the result of each day
                    // and it will be compared below
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
                // At this point, all calculations are done, only missing the analysis
                analytics.map(element => {
                    if (element.date >= dateResult) {
                        //
                        // This is the condition to create a buy recommendation.
                        // It is explained in the report
                        if (
                            (previousValue < Math.max(previousSpanA, previousSpanB)) &&
                            (element.value > Math.max(element.SpanA, element.SpanB)) &&
                            (element.volume > previousVolume)
                        )
                            recommendationsToAdd.push(new Recommendation(strategy.id, element.date, code, 'buy'))

                        //
                        // This is the condition to create a sell recommendation.
                        // It is explained in the report
                        if (
                            (previousValue > Math.min(previousSpanA, previousSpanB)) &&
                            (element.value < Math.min(element.SpanA, element.SpanB)) &&
                            (element.volume > previousVolume)
                        )
                            recommendationsToAdd.push(new Recommendation(strategy.id, element.date, code, 'sell'))
                        //
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
        // Array of Recommendations is sent to Database
        // It is done this way to avoid multiple connections to the Database
        await upsertRecommendations(recommendationsToAdd)
    }
    console.log('> log: Ichimoku Clouds analysis has finished...')
}

// This function calculates the Moving Average Crossover Strategy and save it to the Database
export const updateStrategyMA = async (params: MovingAverageParams): Promise<void> => {
    console.log('\n> log: Starting Moving Average Crossover analysis...')
    // Create the Strategy document if it does not exist
    const strategy = new Strategy(1, 'Moving Average Crossover', 'This strategy has two moving averages, the first one of 9 days, and the second of 17 days. A recommendation is created when the shorter crosses the longer, indicating that the trend has changed.')
    await upsertStrategy(strategy)
    // Get from Database all the different Stock Codes
    const codes = await getDistinctCodeStock()
    //
    if (!!codes && codes.length > 0) {
        const allQuotesDB = await getQuotes()
        const dateFrom = new Date()
        const dateResult = new Date()
        // The function will use Data of 6 months to calculate recommendations to the last month
        dateFrom.setMonth(dateFrom.getMonth() - 6)
        dateResult.setMonth(dateResult.getMonth() - 1)
        const recommendationsToAdd: Recommendation[] = []
        //
        while (!!codes && codes.length > 0) {
            const code = codes.shift()
            //
            if (!!code && code.length > 4) {
                // Filter the Quotes from Database to a specific Stock Code
                const quotesByCode = allQuotesDB.filter(quo => (quo.code_stock === code && quo.date > dateFrom))
                const quotes: Quote[] = []
                //
                // Sort the Quotes by Date
                quotesByCode.sort((a, b) => a.date > b.date ? 1 : -1)
                //
                // Method to avoid duplicate documentos
                let lastDateAdded = new Date()
                quotesByCode.map(quo => {
                    if (!datesEqual(quo.date, lastDateAdded)) {
                        quotes.push(quo)
                        lastDateAdded = quo.date
                    }
                })
                //
                // Initialise arrays used to calculate
                const valuesMovAvgLong: number[] = []
                const valuesMovAvgShort: number[] = []
                //
                const analytics: MovAvgAnalytic[] = []
                //
                quotes.map(quote => {
                    // Calculation is done according to the Formula
                    // that can be found in the final report
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
                        // analytics is the array that contains the result of each day
                        // and it will be compared below
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

                // At this point, all calculations are done, only missing the analysis
                analytics.map(element => {

                    if (previousVal > 0 && element.date > dateResult) {
                        // This is the condition to create a sell recommendation.
                        // It is explained in the report
                        if ((previousAvgLong < previousAvgShort) && (element.movAvgLong > element.movAvgShort) && (element.volume > previousVolume)) {
                            element.message = 'sell'
                            recommendationsToAdd.push(new Recommendation(strategy.id, element.date, code, 'sell'))

                        }
                        //
                        // This is the condition to create a buy recommendation.
                        // It is explained in the report
                        if ((previousAvgShort < previousAvgLong) && (element.movAvgShort > element.movAvgLong) && (element.volume > previousVolume)) {
                            element.message = 'buy'
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
        // Array of Recommendations is sent to Database
        // It is done this way to avoid multiple connections to the Database
        await upsertRecommendations(recommendationsToAdd)
    }
    console.log('> log: Moving Average Crossover analysis has finished...')
}

// Function that verifies if the Recommendation is already inserted and then insert if not
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