export const replaceAll = (input: string, search: string, replace: string) => {
    return input.split(search).join(replace)
}

export const sleep = (miliseconds: number): Promise<void> => {
    return new Promise(resolve => setTimeout(resolve, miliseconds))
}

export const sleep2 = (miliseconds: number): void => {
    const date = Date.now()
    let currentDate = null
    do {
        currentDate = Date.now()
    }
    while (currentDate - date < miliseconds)
}

export const padL = (input: string, strFill: string, length: number): string => {
    return (length <= input.length) ? input : padL((strFill + input), strFill, length)
}

export const padR = (input: string, strFill: string, length: number): string => {
    return (length <= input.length) ? input : padL((input + strFill), strFill, length)
}

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