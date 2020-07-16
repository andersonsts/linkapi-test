const axios = require('axios');

const apiPipedrive = axios.create({
    baseURL: 'https://api.pipedrive.com/v1/'
});

module.exports = apiPipedrive;