import axios from 'axios'

// https://api-cotacao-b3.labdo.it/

// This function requests from the third-party API the Quotes to a
// specific Company e returns it. 
// This is the one not being used
export const apiDaily = async (companyCode: string): Promise<DailyResponse[]> => {
    const api = 'https://api-cotacao-b3.labdo.it/api/cotacao/cd_acao'
    const link = `${api}/${companyCode}`

    return new Promise(async (resolve, reject) => {
        try {
            const response = await axios.get(link)

            if (!!response) {
                resolve(response.data)
            }
            else
                reject({
                    error: 'error',
                    message: 'Empty return!'
                })
        } catch (err) {
            console.log(' > GetDailyApiService.ts > apiDaily > Error')
            console.log(err)
            resolve([])
        }

    })
}

export default apiDaily