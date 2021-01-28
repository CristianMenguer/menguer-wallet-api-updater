import axios from 'axios'

const api = axios.create({
    baseURL: ''
})

export default api

// This file is responsible for creating the object api to be used everywhere in the application