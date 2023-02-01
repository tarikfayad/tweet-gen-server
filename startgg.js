require('dotenv').config();
const axios = require('axios');

const getEventInfo = async function(slug) {
    var data = JSON.stringify({
        query: `query TournamentQuery($slug: String) {
        tournament(slug: $slug) {
            name
          events {
            id
            name
            standings(query: {
            perPage: 8,
            page: 1
          }){
            nodes {
              placement
              entrant {
                id
                name
              }
            }
          }
          }
        }
      }`,
        variables: {"slug":"wasd-live-13"}
      });
      
      var config = {
        headers: { 
          'Authorization': 'Bearer ' + process.env.START_GG_BEARER_TOKEN, 
          'Content-Type': 'application/json'
        }
      };

      let axiosAPI = axios.create(config);
      return await axiosAPI.post(process.env.START_GG_BASE_URL, data);
}


module.exports = {
    getEventInfo
}