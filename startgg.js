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

const getGameTournamentNameAndID = async function(slug, shortCode) {
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

        if(compareGameStrings(shortCode, event.videogame.displayName)) {
            eventID = event.id;
            gameName = event.videogame.displayName;

            information = {
                'gameName': gameName,
                'tournamentName': tournamentName,
                'id': eventID
            }
        } else {
          console.log("COMPARISON ERROR!");
        }
      });
    
      console.log("IONFORMATION");
      console.log(information);
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

const getTop8Players =  async function(slug, eventID) {
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

return await formatTop8Players(sets, eventID);
}

const getTop4 =  async function(slug, eventID, gameName) {
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

return await formatTop4String(sets, eventID, gameName);
}

const getLosersSemiFinals =  async function(slug, eventID, gameName, matcherino) {
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

return await formatLosersSemifinalsString(sets, eventID, gameName, matcherino);
}

const getLosersFinals =  async function(slug, eventID, gameName, matcherino) {
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

return await formatLosersFinalString(sets, eventID, gameName, matcherino);
}

const getGrandFinal =  async function(slug, eventID, gameName, matcherino) {
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

return await formatGrandFinalString(sets, eventID, gameName, matcherino);
}

const getGrandFinalReset =  async function(slug, eventID, gameName, matcherino) {
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

return await formatGrandFinalResetString(sets, eventID, gameName, matcherino);
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
  if (!authorizations) handle = playerHandle;
  else {
    authorizations.forEach(authorization => {
      if(authorization['type'] === 'TWITTER') handle = authorization['externalUsername'];
    });

    if(!handle) handle = playerHandle;
    else handle = '@' + handle;
  }
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
      results = results + placement + '. ' + handle + '\n';
    }
  }

  return results;
}

async function formatTop8String(sets, eventID) {
  console.log('Getting Tournament Top 8 from Startgg. . .');

  let losersRound;
  let winners = [];
  let losers = [];
  let losersRoundSet = false;

  for (var i = 0; i < sets.length; i++) {
    let set = sets[i];
    if(set['fullRoundText'] === 'Winners Semi-Final') {
      let handles = [];
      let p1Handle = await getPlayerTwitterHandle(set['slots'][0]['entrant']['name'], eventID);
      let p2Handle = await getPlayerTwitterHandle(set['slots'][1]['entrant']['name'], eventID);
      handles.push(p1Handle);
      handles.push(p2Handle);
      winners.push(handles);
    } else if (set['fullRoundText'] === 'Losers Quarter-Final') {
      if(!losersRoundSet) {
        losersRound = set['round'] + 1;
        losersRoundSet = true;
      }
    }
  }

  for (var i = 0; i < sets.length; i++) {
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

  return '🚨 TOP 8 HERE WE GO! 🚨\n\nw:\n' + winners[0][0] + ' vs ' + winners[0][1] + '\n' + winners[1][0] + ' vs ' + winners[1][1] + '\n\nl:\n' + losers[0][0] + ' vs ' + losers[0][1] + '\n' + losers[1][0] + ' vs ' + losers[1][1] +'\n\n📺 https://twitch.tv/ImpurestClub';
}

async function formatTop8Players(sets, eventID) {
  let losersRound;
  let winners = [];
  let losers = [];
  let losersRoundSet = false;

  for (var i = 0; i < sets.length; i++) {
    let set = sets[i];
    console.log('SET');
    console.log(set);
    if(set['fullRoundText'] === 'Winners Semi-Final' || set['fullRoundText'] === 'Winners Final' || set['fullRoundText'] === 'Grand Final') {
      let p1Handle = set['slots'][0]['entrant']['name'];
      let p2Handle = set['slots'][1]['entrant']['name'];
      winners.push({
        'player1':p1Handle,
        'player2': p2Handle,
        'player1score': 0,
        'player1score': 0
      });
    } else if (set['fullRoundText'] === 'Losers Quarter-Final') {
      if(!losersRoundSet) {
        losersRound = set['round'] + 1;
        losersRoundSet = true;
      }
    }
  }

  for (var i = 0; i < sets.length; i++) {
    let set = sets[i];
    if(set['round'] === losersRound) {
      let p1Handle = set['slots'][0]['entrant']['name'];
      let p2Handle = set['slots'][1]['entrant']['name'];
      losers.push({
        'player1':p1Handle,
        'player2': p2Handle,
        'player1score': 0,
        'player1score': 0
      });
    }
  }

  for (var i = 0; i < sets.length; i++) {
    let set = sets[i];
    if(set['fullRoundText'] === 'Losers Quarter-Final' || set['fullRoundText'] === 'Losers Semi-Final' || set['fullRoundText'] === 'Losers Final') {
      let p1Handle = set['slots'][0]['entrant']['name'];
      let p2Handle = set['slots'][1]['entrant']['name'];
      losers.push({
        'player1':p1Handle,
        'player2': p2Handle,
        'player1score': 0,
        'player1score': 0
      });
    }
  }

  console.log(winners);
  console.log(losers);

  return [{
    'matches': [
      {
        'winners': winners
      },
      {
        'losers': losers
      }
    ]
  }];
}

async function formatTop4String(sets, eventID, gameName) {
  console.log('Getting Winners Finals from Startgg . . .');

  let handles = [];
  for (var i = 0; i < sets.length; i++) {
    let set = sets[i];
    if(set['fullRoundText'] === 'Winners Final') {
      let p1Handle = await getPlayerTwitterHandle(set['slots'][0]['entrant']['name'], eventID);
      let p2Handle = await getPlayerTwitterHandle(set['slots'][1]['entrant']['name'], eventID);
      handles.push(p1Handle);
      handles.push(p2Handle);
    }
  }

  console.log(handles);

  return "We're in the Top 4 home stretch!\n\nFirst up ➡️ " + handles[0] + " vs " + handles[1] + "\n\n" + getHashtags(gameName) + "\n\n" + "📺 https://twitch.tv/ImpurestClub";
}

async function formatLosersSemifinalsString(sets, eventID, gameName, matcherino) {
  console.log('Getting Losers Semifinals from Startgg . . .');

  let handles = [];
  for (var i = 0; i < sets.length; i++) {
    let set = sets[i];
    if(set['fullRoundText'] === 'Losers Semi-Final') {
      let p1Handle = await getPlayerTwitterHandle(set['slots'][0]['entrant']['name'], eventID);
      let p2Handle = await getPlayerTwitterHandle(set['slots'][1]['entrant']['name'], eventID);
      handles.push(p1Handle);
      handles.push(p2Handle);
    }
  }

  console.log(handles);

  return "⏬ Losers Semifinals ⏬\n\n🥊 " + handles[0] + " vs " + handles[1] + "\n\n💰 " + matcherino + "\n📺 https://twitch.tv/ImpurestClub\n\n" + getHashtags(gameName);
}

async function formatLosersFinalString(sets, eventID, gameName, matcherino) {
  console.log('Getting Losers Final from Startgg . . .');

  let handles = [];
  for (var i = 0; i < sets.length; i++) {
    let set = sets[i];
    if(set['fullRoundText'] === 'Losers Final') {
      let p1Handle = await getPlayerTwitterHandle(set['slots'][0]['entrant']['name'], eventID);
      let p2Handle = await getPlayerTwitterHandle(set['slots'][1]['entrant']['name'], eventID);
      handles.push(p1Handle);
      handles.push(p2Handle);
    }
  }

  console.log(handles);

  return "⚠️ Losers Finals ⚠️\n\n🥊 " + handles[0] + " vs " + handles[1] + "\n\n💰 " + matcherino + "\n📺 https://twitch.tv/ImpurestClub\n\n" + getHashtags(gameName);
}

async function formatGrandFinalString(sets, eventID, gameName, matcherino) {
  console.log('Getting Grand Final from Startgg . . .');

  let handles = [];
  for (var i = 0; i < sets.length; i++) {
    let set = sets[i];
    if(set['fullRoundText'] === 'Grand Final') {
      let p1Handle = await getPlayerTwitterHandle(set['slots'][0]['entrant']['name'], eventID);
      let p2Handle = await getPlayerTwitterHandle(set['slots'][1]['entrant']['name'], eventID);
      handles.push(p1Handle);
      handles.push(p2Handle);
    }
  }

  console.log(handles);

  return "🚨 GRAND FINALS! 🚨\n\n🥊 " + handles[0] + " vs " + handles[1] + "\n\n💰 " + matcherino + "\n📺 https://twitch.tv/ImpurestClub\n\n" + getHashtags(gameName);
}

async function formatGrandFinalResetString(sets, eventID, gameName, matcherino) {
  console.log('Getting Grand Final Reset from Startgg . . .');

  let handles = [];
  for (var i = 0; i < sets.length; i++) {
    let set = sets[i];
    if(set['fullRoundText'] === 'Grand Final Reset') {
      let p1Handle = await getPlayerTwitterHandle(set['slots'][0]['entrant']['name'], eventID);
      let p2Handle = await getPlayerTwitterHandle(set['slots'][1]['entrant']['name'], eventID);
      handles.push(p1Handle);
      handles.push(p2Handle);
    }
  }

  console.log(handles);

  return "WE HAVE A RESET!\n\n🥊 " + handles[0] + " vs " + handles[1] + "\n\n💰 " + matcherino + "\n📺 https://twitch.tv/ImpurestClub\n\n" + getHashtags(gameName);
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

function compareGameStrings(shortCode, gameName) {
    let gameString = getGameNameFromShortCode(shortCode).replace(/\s/g,'-').replace(':', '-').replace('[', '-').replace(']', '-').replace('--', '-');
    let escapedGameName = gameName.replace(/\s/g,'-').replace(':', '-').replace('[', '-').replace(']', '-').replace('--', '-');

    console.log("COMPARISON OF NAMES:");
    console.log(gameString);
    console.log(escapedGameName);

    if(gameString.toUpperCase().includes(escapedGameName.toUpperCase()) || escapedGameName.toUpperCase().includes(gameString.toUpperCase())) return true;
    else return false;

}

// function extractGame (url) {
//     var pathArray = url.split( '/' );
//     return pathArray[6].replace('singles', '');
// }

function getGameNameFromShortCode(shortCode) {
  switch (shortCode) {
    case 'BBCF':
				return 'BlazBlue: Central Fiction';
        break;
			case 'BBTAG':
				return 'BlazBlue: Cross Tag Battle';
        break;
			case 'DBFZ':
				return 'Dragon Ball FighterZ';
        break;
			case 'DNF':
				return 'DNF Duel';
        break;
			case 'GBVS':
				return 'Granblue Fantasy: Versus';
        break;
			case 'P4AU':
				return 'Persona 4 Arena Ultimax';
        break;
			case 'GGXRD':
				return 'Guilty Gear Xrd';
        break;
			case 'GGST':
				return 'Guilty Gear -STRIVE-';
        break;
			case 'KOFXIV':
				return 'The King of Fighters XIV';
        break;
			case 'MBTL':
				return 'Melty Blood: Type Lumina';
        break;
			case 'MVCI':
				return 'Marvel vs. Capcom: Infinite';
        break;
			case 'SFVCE':
				return 'Street Fighter V';
        break;
			case 'SF6':
				return 'Street Fighter 6';
        break;
			case 'TEKKEN7':
				return 'Tekken 7';
        break;
			case 'UMVC3':
				return 'Ultimate Marvel vs. Capcom 3';
        break;
			case 'UNICLR':
				return 'UNDER NIGHT IN-BIRTH Exe:Late[cl-r]';
        break;
			case 'USF4':
				return 'Ultra Street Fighter IV';
        break;
			case 'SF6':
				return 'Street Fighter 6';
        break;
			default:
  }
}

function getHashtags(game) {
  console.log("hashtags");
  console.log(game);
  switch (game) {
    case 'Granblue Fantasy: Versus':
      return '#GBVS #GranblueFantasy';
      break;
    case 'Under Night In-Birth Exe:Late[cl-r]':
      return '#UNICLR #inbirth';
      break;
    case 'Guilty Gear: Strive':
      return '#GGST #GuiltyGear';
      break;
    case 'Guilty Gear Xrd REV2':
      return '#GGXRD #GuiltyGear';
      break;
    case 'Melty Blood: Type Lumina':
      return '#MBTL #MBTL_Tournament';
      break;
    case 'BlazBlue: Central Fiction':
      return '#BBCF #BlazBlue';
      break;
    case 'Guilty Gear XX Accent Core':
      return '#GGACPR #GuiltyGear';
      break;
    case 'DNF Duel':
      return '#DNF #DNFDuel';
      break;
    case 'Persona 4 Arena Ultimax':
      return '#P4AU #Persona';
      break;
    case 'Street Fighter 6':
      return '#SF6 #STREETFIGHTER6 #STREETFIGHTER';
      break;
    default:
  }
}

module.exports = {
    getEventInfo, getGameTournamentNameAndID, getFinalResults, getEventStatus, getTop8, getTop8Players, getTop4, getLosersSemiFinals, getLosersFinals, getGrandFinal, getGrandFinalReset
}