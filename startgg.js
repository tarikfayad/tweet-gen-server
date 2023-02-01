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
      let information;
      eventArray.forEach(event => {

        if(compareGameStrings(url, event.videogame.displayName)) {
            eventID = event.id;
            gameName = event.videogame.displayName;

            information = {
                'gameName': gameName,
                'tournamentName': tournamentName,
                'id': eventID
            }
        }
      });

    console.log(information)
    return information;
}

const getFinalResults = async function(slug, eventID) {
  var data = JSON.stringify({
      query: `query TournamentQuery($slug: String) {
          tournament(slug: $slug) {
            events {
              id
              name
              numEntrants
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
  let response = await axiosAPI.post(process.env.START_GG_BASE_URL, data);
  let standings = getStandingsWithID(eventID, response.data['data']['tournament']['events']);
  let numEntrants = getNumEntrants(eventID, response.data['data']['tournament']['events']);

  return await formatResultsString(standings, numEntrants);
}

const getPlayerTwitterHandle = async function(playerHandle, eventID){
  var data = JSON.stringify({
    query: `query TournamentQuery($eventID: ID!, $playerHandle: String) {
      event(id: $eventID) {
          id
          name
          entrants (query: {perPage: 1, filter:{
            name: $playerHandle
          }}) {
            nodes {
              participants {
                player {
                  id
                  prefix
                  gamerTag
                  user {
                    authorizations {
                      type
                      externalUsername
                    }
                  }
                }
              }
            }
          }
      }
    }`,
    variables: {
      "eventID":eventID,
      "playerHandle": playerHandle
  }
  });
  
  var config = {
    headers: { 
      'Authorization': 'Bearer ' + process.env.START_GG_BEARER_TOKEN, 
      'Content-Type': 'application/json'
    }
  };

  let axiosAPI = axios.create(config);
  let response = await axiosAPI.post(process.env.START_GG_BASE_URL, data);
  console.log('LOGGING ' + response.data);
  let authorizations = response.data['data']['event']['entrants']['nodes'][0]['participants'][0]['player']['user']['authorizations'];
  let handle;
  authorizations.forEach(authorization => {
    if(authorization['type'] === 'TWITTER') handle = authorization['externalUsername'];
  });

  return handle;
}

// String Formatting Methods
async function formatResultsString(standings, numEntrants, eventID) {
  console.log('Getting Tournament Results . . .');

  let results = '';
  let topThree = ['🏆', '🥈', '🥉'];

  // Return top 3 if there are less than 16 entries
  if(numEntrants < 16) {
    for (var i = 0; i < 3; i++) {
      let participant = standings[i];
      let handle = await getPlayerTwitterHandle(participant['entrant']['name'], eventID);
      results = results + topThree[i] + ' ' + '@' + handle + '\n';
    }
  } else {
    for (var i = 0; i < 8; i++) {
      let participant = standings[i];
      let handle = await getPlayerTwitterHandle(participant['entrant']['name'], eventID);
      let placement = participant['placement'].toString();
      results = results + placement + '. ' + '@' + handle + '\n';
    }
  }

  return results;
}

// Helper Methods
function getStandingsWithID(id, eventArray) {
  let standings;
  eventArray.forEach(event => {
      if(id === event.id) standings = event.standings.nodes;
  });

  return standings;
}

function getNumEntrants(id, eventArray) {
  let entrants;
  eventArray.forEach(event => {
      if(id === event.id) entrants = event.numEntrants;
  });

  return entrants;
}

function compareGameStrings(url, gameName) {
    let gameString = extractGame(url);
    let escapedGameName = gameName.replace(/\s/g,'-').replace(':', '-').replace('[', '-').replace(']', '-');

    if(gameString.toUpperCase() === escapedGameName.toUpperCase()) return true;
    else return false;

}

function extractGame (url) {
    var pathArray = url.split( '/' );
    return pathArray[6].replace('singles', '');
}

module.exports = {
    getEventInfo, getGameTournamentNameAndID, getFinalResults
}