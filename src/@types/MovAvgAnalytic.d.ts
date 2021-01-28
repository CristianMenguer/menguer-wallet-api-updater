//Interface used in the whole app to help the calculation of the Movin gAverage Crossover
interface MovAvgAnalytic {
    value: number
    movAvgLong: number
    movAvgShort: number
    volume: number
    message: string
    date: date
}