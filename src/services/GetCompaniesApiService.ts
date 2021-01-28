import axios from 'axios'

// https://api-cotacao-b3.labdo.it/

// This function requests from the third-party API the list of Companies e return it
const apiCompanies = async (): Promise<CompanyResponse[]> => {
    const link = 'https://api-cotacao-b3.labdo.it/api/empresa'

    return new Promise(async (resolve, reject) => {
        try {
            const response = await axios.get(link)

            if (!!response)
                resolve(response.data)
            else
                reject({
                    error: 'error',
                    message: 'Empty return!'
                })
        } catch (err) {
            console.log(' > GetCompaniesApiService.ts > apiCompanies > Error')
            console.log(err)
            reject(err)
        }

    })
}

export default apiCompanies