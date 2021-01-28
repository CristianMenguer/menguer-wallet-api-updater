//Interface used in the whole app to help the calculation of the Ichimoku Cloud

interface CloudAnalytic {
    value: number
    ConversionLine: number
    BaseLine: number
    SpanA: number
    SpanB: number
    LaggingSpan: number
    volume: number
    message: string
    date: Date
}