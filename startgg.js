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
        variables: {"slug":slug}
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

const getGameTournamentNameAndID = async function(slug, url) {
    var data = JSON.stringify({
        query: `query TournamentQuery($slug: String) {
        tournament(slug: $slug) {
            name
          events {
            id
            name
            videogame {
                displayName
            }
          }
          }
        }
      }`,
        variables: {"slug":slug}
      });
      
      var config = {
        headers: { 
          'Authorization': 'Bearer ' + process.env.START_GG_BEARER_TOKEN, 
          'Content-Type': 'application/json'
        }
      };

      let axiosAPI = axios.create(config);
      let response = await axiosAPI.post(process.env.START_GG_BASE_URL, data);
      let gameString = extractGame(url);

      let tournamentName = response.data.tournament.name;
      let eventID, gameName;

      let eventArray = response.data.tournament.events;
      eventArray.forEach(event => {
        gameName = event.videogame.displayName;

        if(gameName.toUpperCase() === gameString.toUpperCase()) {
            eventID = event.id;
            
            return {
                'game': gameName,
                'tournament': tournamentName,
                'id': eventID
            }
        }
      });
}

function extractGame (url) {
    var pathArray = url.split( '/' );
    return pathArray[6];
}

module.exports = {
    getEventInfo, getGameTournamentNameAndID
}