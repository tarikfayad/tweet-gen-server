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

      console.log(response.data);

      let tournamentName = response.data['data']['tournament']['name'];
      let eventID, gameName;

      let eventArray = response.data['data']['tournament']['events'];
      eventArray.forEach(event => {

        if(compareGameStrings(url, event.videogame.displayName)) {
            eventID = event.id;
            gameName = event.videogame.displayName;
            
            return {
                'game': gameName,
                'tournament': tournamentName,
                'id': eventID
            }
        }
      });
}

function compareGameStrings(url, gameName) {
    let gameString = extractGame(url);
    let escapedGameName = gameName.replace(/\s/g,'-').replace(':', '-').replace('[', '-').replace(']', '-');

    console.log(gameName)
    console.log(gameString.toUpperCase());
    console.log(escapedGameName.toUpperCase());

    if(gameString.toUpperCase() === escapedGameName.toUpperCase()) return true;
    else return false;

}

function extractGame (url) {
    var pathArray = url.split( '/' );
    return pathArray[6].replace('singles', '');
}

module.exports = {
    getEventInfo, getGameTournamentNameAndID
}