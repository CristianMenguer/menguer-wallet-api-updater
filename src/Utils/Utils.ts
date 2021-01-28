
// This function replaces all the occurrences of a specific string in another
// and returns it
export const replaceAll = (input: string, search: string, replace: string) => {
    return input.split(search).join(replace)
}

// Function that makes the process wait for a specific time, using primise
export const sleep = (miliseconds: number): Promise<void> => {
    return new Promise(resolve => setTimeout(resolve, miliseconds))
}

// Function that makes the process wait for a specific time, using while loop
export const sleep2 = (miliseconds: number): void => {
    const date = Date.now()
    let currentDate = null
    do {
        currentDate = Date.now()
    }
    while (currentDate - date < miliseconds)
}

// Function that fills a string in the left with a character
export const padL = (input: string, strFill: string, length: number): string => {
    return (length <= input.length) ? input : padL((strFill + input), strFill, length)
}

// Function that fills a string in the right with a character
export const padR = (input: string, strFill: string, length: number): string => {
    return (length <= input.length) ? input : padL((input + strFill), strFill, length)
}

// Function to compare two Dates by year, month and day of the month
export const datesEqual = (date1: Date, date2: Date): boolean => {
    if (date1 === null || date2 === null)
        return false
    //
    let result = true
    result = result && (date1.getFullYear() === date2.getFullYear())
    result = result && (date1.getMonth() === date2.getMonth())
    result = result && (date1.getDate() === date2.getDate())
    return result
}

// Function that receives a number (Date from API) and returns a Date object
export const pregaoToDate = (input: number): Date | null => {
    if (input === null || input < 20000000)
        return null
    //20210123
    const year = parseInt(input.toString().substr(0, 4))
    const month = parseInt(input.toString().substr(4, 2)) - 1
    const day = parseInt(input.toString().substr(6, 2))
    return new Date(year, month, day)
}