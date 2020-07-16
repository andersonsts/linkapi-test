const apiPipedrive = require('../services/apiPipedrive');
const { api_token_pipedrive } = require('../../../keys');

const getAllOpportunitiesWon = async (status) => {
  const { data: responseDataPipedrive } = await apiPipedrive.get('deals', {
    params: {
      status,
      api_token: api_token_pipedrive
    }
  })

  return responseDataPipedrive;
}

module.exports = getAllOpportunitiesWon;
