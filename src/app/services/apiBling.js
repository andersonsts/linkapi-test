const axios = require('axios');

const apiBling = axios.create({
    baseURL: 'https://bling.com.br/Api/v2'
});

module.exports = apiBling;
