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

      console.log('getGameTournamentNameAndID: ' + JSON.stringify(response.data));

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

const getTop8 =  async function(slug, eventID) {
  var data = JSON.stringify({
    query: `query TournamentQuery($slug: String) {
      tournament(slug: $slug) {
        events {
            id
          state
          sets(page:1, perPage: 999) {
            pageInfo{
              perPage: perPage,
              page: page
            }
            nodes {
              round
              fullRoundText
              displayScore
              slots(includeByes: true) {
                  entrant {
                      name
                  }
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
let sets = getSetsWithID(eventID, response.data['data']['tournament']['events']);

return await formatTop8String(sets, eventID);
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

  return await formatResultsString(standings, numEntrants, eventID);
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
  let authorizations = response.data['data']['event']['entrants']['nodes'][0]['participants'][0]['player']['user']['authorizations'];
  let handle;
  authorizations.forEach(authorization => {
    if(authorization['type'] === 'TWITTER') handle = authorization['externalUsername'];
  });

  return handle;
}

const getEventStatus = async function(slug, eventID) {
  var data = JSON.stringify({
    query: `query TournamentQuery($slug: String) {
      tournament(slug: $slug) {
        events {
          id
          state
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
let status = getStatusWithID(eventID, response.data['data']['tournament']['events']);

return status;
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

async function formatTop8String(sets, eventID) {
  console.log('Getting Tournament Top 8 . . .');

  let losersRound;
  let winners, losers = [];

  for (var i = 0; i < sets.length(); i++) {
    let set = sets[i];
    if(set['fullRoundText'] === 'Winners Semi-Final') {
      let handles = [];
      let p1Handle = await getPlayerTwitterHandle(set['slots'][0]['entrant']['name'], eventID);
      let p2Handle = await getPlayerTwitterHandle(set['slots'][1]['entrant']['name'], eventID);
      handles.push(p1Handle);
      handles.push(p2Handle);
      winners.push(handles);
    } else if (set['fullRoundText'] === 'Losers Quarter-Final') {
      losersRound = set['round'] + 1;
    }
  }

  for (var i = 0; i < sets.length(); i++) {
    let set = sets[i];
    if(set['round'] === losersRound) {
      let handles = [];
      let p1Handle = await getPlayerTwitterHandle(set['slots'][0]['entrant']['name'], eventID);
      let p2Handle = await getPlayerTwitterHandle(set['slots'][1]['entrant']['name'], eventID);
      handles.push(p1Handle);
      handles.push(p2Handle);
      losers.push(handles);
    }
  }

  return '🚨 TOP 8 HERE WE GO! 🚨\n\nw:\n' + winners[0][0] + ' vs ' + winners[0][1] + '\n' + winners[1][0] + ' vs ' + winners[1][1] + '\n\nl:\n' + losers[0][0] + ' vs ' + losers[0][0] + '\n' + losers[1][0] + ' vs ' + losers[1][1] +'\n\n📺 https://twitch.tv/ImpurestClub';
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

function getStatusWithID(id, eventArray) {
  let status;
  eventArray.forEach(event => {
      if(id === event.id) status = event.state;
  });

  return status;
}

function getSetsWithID(id, eventArray) {
  let sets;
  eventArray.forEach(event => {
      if(id === event.id) sets = event.sets.nodes;
  });

  return sets;
}

function compareGameStrings(url, gameName) {
    let gameString = extractGame(url);
    let escapedGameName = gameName.replace(/\s/g,'-').replace(':', '-').replace('[', '-').replace(']', '-').replace('--', '-');

    if(gameString.toUpperCase().includes(escapedGameName.toUpperCase()) || escapedGameName.toUpperCase().includes(gameString.toUpperCase())) return true;
    else return false;

}

function extractGame (url) {
    var pathArray = url.split( '/' );
    return pathArray[6].replace('singles', '');
}

module.exports = {
    getEventInfo, getGameTournamentNameAndID, getFinalResults, getEventStatus, getTop8
}