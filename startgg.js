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

      let tournamentName, eventID, gameName;

      let eventArray = response.data['data']['tournament']['events'];
      let information;
      eventArray.forEach(event => {

        if(compareGameStrings(shortCode, event.videogame.displayName)) {
          console.log(event);
            eventID = event.id;
            gameName = event.videogame.displayName;
            tournamentName = event.name;

            information = {
                'gameName': gameName,
                'tournamentName': tournamentName,
                'id': eventID
            }
        } else {
          console.log("COMPARISON ERROR!");
        }
      });
    
      return information;
}

const getTop8 =  async function(slug, eventID, shortCode) {
  var data = JSON.stringify({
    query: `query TournamentQuery($slug: String, $eventID: ID) {
      tournament(slug: $slug) {
        events(filter: {id: $eventID}) {
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
  variables: {
    "slug":slug,
    "eventID":eventID
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
console.log('TOP 8 RESPONSE:');
console.log(response.data);
let sets = getSetsWithID(eventID, response.data['data']['tournament']['events']);

return await formatTop8String(sets, eventID, shortCode);
}

const getTop8Players =  async function(slug, eventID) {
  console.log(slug);
  var data = JSON.stringify({
    query: `query TournamentQuery($slug: String, $eventID: ID) {
      tournament(slug: $slug) {
        events(filter: {id: $eventID}) {
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
  variables: {
    "slug":slug,
    "eventID": eventID
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
let sets = getSetsWithID(eventID, response.data['data']['tournament']['events']);

return await formatTop8Players(sets, eventID);
}

const getTop4 =  async function(slug, eventID, gameName) {
  var data = JSON.stringify({
    query: `query TournamentQuery($slug: String, $eventID: ID) {
      tournament(slug: $slug) {
        events(filter: {id: $eventID}) {
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
  variables: {
    "slug":slug,
    "eventID": eventID
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
console.log(response.data);
let sets = getSetsWithID(eventID, response.data['data']['tournament']['events']);

return await formatTop4String(sets, eventID, gameName);
}

const getLosersSemiFinals =  async function(slug, eventID, gameName, matcherino) {
  var data = JSON.stringify({
    query: `query TournamentQuery($slug: String, $eventID: ID) {
      tournament(slug: $slug) {
        events(filter: {id: $eventID}) {
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
  variables: {
    "slug":slug,
    "eventID": eventID
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
let sets = getSetsWithID(eventID, response.data['data']['tournament']['events']);

return await formatLosersSemifinalsString(sets, eventID, gameName, matcherino);
}

const getLosersFinals =  async function(slug, eventID, gameName, matcherino) {
  var data = JSON.stringify({
    query: `query TournamentQuery($slug: String, $eventID: ID) {
      tournament(slug: $slug) {
        events(filter: {id: $eventID}) {
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
  variables: {
    "slug":slug,
    "eventID": eventID
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
let sets = getSetsWithID(eventID, response.data['data']['tournament']['events']);

return await formatLosersFinalString(sets, eventID, gameName, matcherino);
}

const getGrandFinal =  async function(slug, eventID, gameName, matcherino) {
  var data = JSON.stringify({
    query: `query TournamentQuery($slug: String, $eventID: ID) {
      tournament(slug: $slug) {
        events(filter: {id: $eventID}) {
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
  variables: {
    "slug":slug,
    "eventID": eventID
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
let sets = getSetsWithID(eventID, response.data['data']['tournament']['events']);

return await formatGrandFinalString(sets, eventID, gameName, matcherino);
}

const getGrandFinalReset =  async function(slug, eventID, gameName, matcherino) {
  var data = JSON.stringify({
    query: `query TournamentQuery($slug: String, $eventID: ID) {
      tournament(slug: $slug) {
        events(filter: {id: $eventID}) {
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
      query: `query TournamentQuery($slug: String, $eventID: ID) {
          tournament(slug: $slug) {
            events(filter: {id: $eventID}) {
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

const getStreamQueue = async function(tourneySlug){
  var data = JSON.stringify({
    query: `query StreamQueueOnTournament($tourneySlug: String!) {
  tournament(slug: $tourneySlug) {
    id
    streamQueue {
      stream {
        streamSource
        streamName
      }
      sets {
        id
        fullRoundText
        slots {
          entrant {
            id
            name
          }
        }
      }
    }
  }
}`,
    variables: {
      "tourneySlug":tourneySlug
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
  let sets = response.data['data']['tournament']['streamQueue'][0]['sets'];
  let formatedSets =[];
  
  sets.forEach(function(set){
    let setID = set['id'];
    let round = set['fullRoundText']

    let player1Tag, player1Name, player1ID;
    let player2Tag, player2Name, player2ID;

    if(set['slots'][0]['entrant']) {
      let player1FullString = set['slots'][0]['entrant']['name']
      let player1StringParts = player1FullString.split('|');

      if (player1StringParts.length === 2) {
        player1Tag = player1StringParts[0].trim();
        player1Name = player1StringParts[1].trim();
      } else {
        player1Tag = ''
        player1Name = player1FullString;
      }
      player1ID = set['slots'][0]['entrant']['id'];
    } else {
      player1Tag = '';
      player1Name = '??';
      player1ID = 0;
    }

    if(set['slots'][1]['entrant']) {
      let player2FullString = set['slots'][1]['entrant']['name']
      let player2StringParts = player2FullString.split('|');

      if (player2StringParts.length === 2) {
        player2Tag = player2StringParts[0].trim();
        player2Name = player2StringParts[1].trim();
      } else {
        player2Tag = ''
        player2Name = player2FullString;
      }

      player2ID = set['slots'][0]['entrant']['id'];
    } else {
      player2Tag = '';
      player2Name = '??';
      player2ID = 0;
    }

    let formatedSet = {
      'id': setID,
      'round': round,
      'player1Tag': player1Tag,
      'player1Name': player1Name,
      'player1ID': player1ID,
      'player2Tag': player2Tag,
      'player2Name': player2Name,
      'player2ID': player2ID,
    }

    formatedSets.push(formatedSet)
  });
  return formatedSets;
}

const reportSet = async function(setID, winnerID, p1ID, p1Score, p2ID, p2Score){

  let gameNumber = 1
  let gameArray =[]

  for (let i = 0; i < p1Score; i++) {
    let game = {
      winnerId: p1ID,
      gameNum: gameNumber
    };
    gameArray.push(game);
    gameNumber++;
  }

  for (let i = 0; i < p2Score; i++) {
    let game = {
      winnerId: p2ID,
      gameNum: gameNumber
    };
    gameArray.push(game);
    gameNumber++;
  }

  console.log('SET ID')
  console.log(setID)
  console.log(p1ID)
  console.log(p2ID)
  console.log(gameArray)

  var data = JSON.stringify({
    query: `mutation ReportBracketSet($setId: ID!, $winnerId: ID, $gameData: [BracketSetGameDataInput]) {
    reportBracketSet(setId: $setId, winnerId: $winnerId, gameData: $gameData) {
      id
      state
    }
  }
`,
    variables: {
      "setId": setID,
      "winnerId": winnerID,
      "gameData": gameArray
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
  console.log(response.data)
  console.log(response.data.errors)
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

  const results = [];
  const topThree = ['🏆', '🥈', '🥉'];

  // Define a map for placements to emojis
  const placementMap = {
    1: '🏆',
    2: '🥈',
    3: '🥉',
    4: '4️⃣',
    5: '5️⃣',
    7: '7️⃣'
  };

  // Return top 3 if there are less than 16 entries
  if (numEntrants < 16) {
    for (let i = 0; i < 3; i++) {
      const participant = standings[i];
      const handle = await getPlayerTwitterHandle(participant.entrant.name, eventID);
      results.push(`${topThree[i]} ${handle}`);
    }
  } else {
    for (let i = 0; i < 8; i++) {
      const participant = standings[i];
      const handle = await getPlayerTwitterHandle(participant.entrant.name, eventID);
      const placementString = placementMap[participant.placement] || ''; // Default to empty string if placement is not mapped
      results.push(`${placementString} ${handle}`);
    }
  }

  return results.join('\n');
}

async function formatTop8String(sets, eventID, shortCode) {
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

  return `Our #${shortCode} Top 8 is set!
  
  Top 8 Winners:
  ⚔️ ${winners[0][0]} vs ${winners[0][1]}
  ⚔️ ${winners[1][0]} vs ${winners[1][1]}
  
  Top 8 Losers:
  ⚔️ ${losers[0][0]} vs ${losers[0][1]}
  ⚔️ ${losers[1][0]} vs ${losers[1][1]}
  
  Stream links in reply 👇`;

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
    if(set['fullRoundText'] === 'Winners Semi-Final') {
      let p1Handle, p2Handle;

      if (set['slots'][0]['entrant'] === null) p1Handle = '';
      else if (set['slots'][0]['entrant']['name']) p1Handle = set['slots'][0]['entrant']['name'];
      else p1Handle = '';

      if (set['slots'][1]['entrant'] === null) p2Handle = '';
      else if (set['slots'][1]['entrant']['name']) p2Handle = set['slots'][1]['entrant']['name'];
      else p2Handle = '';

      winners.push({
        'player1':p1Handle,
        'player2': p2Handle,
        'player1score': 0,
        'player2score': 0
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
    console.log('SET');
    console.log(set);
    if(set['fullRoundText'] === 'Winners Final') {
      let p1Handle, p2Handle;

      if (set['slots'][0]['entrant'] === null) p1Handle = '';
      else if (set['slots'][0]['entrant']['name']) p1Handle = set['slots'][0]['entrant']['name'];
      else p1Handle = '';

      if (set['slots'][1]['entrant'] === null) p2Handle = '';
      else if (set['slots'][1]['entrant']['name']) p2Handle = set['slots'][1]['entrant']['name'];
      else p2Handle = '';

      winners.push({
        'player1':p1Handle,
        'player2': p2Handle,
        'player1score': 0,
        'player2score': 0
      });
    }
  }

  for (var i = 0; i < sets.length; i++) {
    let set = sets[i];
    console.log('SET');
    console.log(set);
    if(set['fullRoundText'] === 'Grand Final') {
      let p1Handle, p2Handle;

      if (set['slots'][0]['entrant'] === null) p1Handle = '';
      else if (set['slots'][0]['entrant']['name']) p1Handle = set['slots'][0]['entrant']['name'];
      else p1Handle = '';

      if (set['slots'][1]['entrant'] === null) p2Handle = '';
      else if (set['slots'][1]['entrant']['name']) p2Handle = set['slots'][1]['entrant']['name'];
      else p2Handle = '';

      winners.push({
        'player1':p1Handle,
        'player2': p2Handle,
        'player1score': 0,
        'player2score': 0
      });
    }
  }

  for (var i = 0; i < sets.length; i++) {
    let set = sets[i];
    if(set['round'] === losersRound) {
      let p1Handle, p2Handle;

      if (set['slots'][0]['entrant'] === null) p1Handle = '';
      else if (set['slots'][0]['entrant']['name']) p1Handle = set['slots'][0]['entrant']['name'];
      else p1Handle = '';

      if (set['slots'][1]['entrant'] === null) p2Handle = '';
      else if (set['slots'][1]['entrant']['name']) p2Handle = set['slots'][1]['entrant']['name'];
      else p2Handle = '';
      
      losers.push({
        'player1':p1Handle,
        'player2': p2Handle,
        'player1score': 0,
        'player2score': 0
      });
    }
  }

  for (var i = 0; i < sets.length; i++) {
    let set = sets[i];
    if(set['fullRoundText'] === 'Losers Quarter-Final') {
      let p1Handle, p2Handle;

      if (set['slots'][0]['entrant'] === null) p1Handle = '';
      else if (set['slots'][0]['entrant']['name']) p1Handle = set['slots'][0]['entrant']['name'];
      else p1Handle = '';

      if (set['slots'][1]['entrant'] === null) p2Handle = '';
      else if (set['slots'][1]['entrant']['name']) p2Handle = set['slots'][1]['entrant']['name'];
      else p2Handle = '';
      
      losers.push({
        'player1':p1Handle,
        'player2': p2Handle,
        'player1score': 0,
        'player2score': 0
      });
    }
  }

  for (var i = 0; i < sets.length; i++) {
    let set = sets[i];
    if(set['fullRoundText'] === 'Losers Semi-Final') {
      let p1Handle, p2Handle;

      if (set['slots'][0]['entrant'] === null) p1Handle = '';
      else if (set['slots'][0]['entrant']['name']) p1Handle = set['slots'][0]['entrant']['name'];
      else p1Handle = '';

      if (set['slots'][1]['entrant'] === null) p2Handle = '';
      else if (set['slots'][1]['entrant']['name']) p2Handle = set['slots'][1]['entrant']['name'];
      else p2Handle = '';
      
      losers.push({
        'player1':p1Handle,
        'player2': p2Handle,
        'player1score': 0,
        'player2score': 0
      });
    }
  }

  for (var i = 0; i < sets.length; i++) {
    let set = sets[i];
    if(set['fullRoundText'] === 'Losers Final') {
      let p1Handle, p2Handle;

      if (set['slots'][0]['entrant'] === null) p1Handle = '';
      else if (set['slots'][0]['entrant']['name']) p1Handle = set['slots'][0]['entrant']['name'];
      else p1Handle = '';

      if (set['slots'][1]['entrant'] === null) p2Handle = '';
      else if (set['slots'][1]['entrant']['name']) p2Handle = set['slots'][1]['entrant']['name'];
      else p2Handle = '';
      
      losers.push({
        'player1':p1Handle,
        'player2': p2Handle,
        'player1score': 0,
        'player2score': 0
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

  return `We're in the Top 4 home stretch!
  
  First up ➡️ ${handles[0]} vs ${handles[1]}
  
  ${getHashtags(gameName)}
  
  📺 https://twitch.tv/ImpurestClub`;

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

  return `⏬ Losers Semifinals ⏬
  
  🥊 ${handles[0]} vs ${handles[1]}
  
  💰 ${matcherino}
  📺 https://twitch.tv/ImpurestClub
  
  ${getHashtags(gameName)}`;

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

  return `⚠️ Losers Finals ⚠️
  
  🥊 ${handles[0]} vs ${handles[1]}
  
  💰 ${matcherino}
  📺 https://twitch.tv/ImpurestClub
  
  ${getHashtags(gameName)}`;

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

  return `🚨 GRAND FINALS! 🚨
  
  🥊 ${handles[0]} vs ${handles[1]}
  
  💰 ${matcherino}
  📺 https://twitch.tv/ImpurestClub
  
  ${getHashtags(gameName)}`;

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

  return `WE HAVE A RESET!
  
  🥊 ${handles[0]} vs ${handles[1]}
  
  💰 ${matcherino}
  📺 https://twitch.tv/ImpurestClub
  
  ${getHashtags(gameName)}`;

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
  
  console.log('GAME NAMES!');
  console.log(shortCode);
  console.log(gameName);
  
  let gameString = sanitizeString(getGameNameFromShortCode(shortCode)).toUpperCase();
  let escapedGameName = sanitizeString(gameName).toUpperCase();

  console.log(gameString);
  console.log(escapedGameName);

  return gameString.includes(escapedGameName) || escapedGameName.includes(gameString);
}

function sanitizeString(str) {
  return str.replace(/\s/g, '-')
            .replace(/[:\[\]]/g, '-') // Replace colons and square brackets in one pass
            .replace(/--+/g, '-');    // Replace multiple dashes with a single dash
}

// function extractGame (url) {
//     var pathArray = url.split( '/' );
//     return pathArray[6].replace('singles', '');
// }

function getGameNameFromShortCode(shortCode) {
  switch (shortCode) {
    case 'BBCF':
				return 'BlazBlue: Central Fiction';
			case 'BBTAG':
				return 'BlazBlue: Cross Tag Battle';
			case 'DBFZ':
				return 'Dragon Ball FighterZ';
			case 'DNF':
				return 'DNF Duel';
			case 'GBVS':
				return 'Granblue Fantasy: Versus';
      case 'GBVSR':
        return 'Granblue Fantasy Versus: Rising';
			case 'P4AU':
				return 'Persona 4 Arena Ultimax';
			case 'GGXRD':
				return 'Guilty Gear Xrd';
			case 'GGST':
				return 'Guilty Gear -STRIVE-';
			case 'KOFXIV':
				return 'The King of Fighters XIV';
			case 'MBTL':
				return 'Melty Blood: Type Lumina';
			case 'MVCI':
				return 'Marvel vs. Capcom: Infinite';
			case 'SFVCE':
				return 'Street Fighter V';
			case 'SF6':
				return 'Street Fighter 6';
			case 'TEKKEN7':
				return 'Tekken 7';
			case 'UMVC3':
				return 'Ultimate Marvel vs. Capcom 3';
			case 'UNICLR':
				return 'UNDER NIGHT IN-BIRTH Exe:Late[cl-r]';
      case 'UNISC':
      case 'UNI2':
        return 'UNDER NIGHT IN-BIRTH II Sys:Celes';
			case 'USF4':
				return 'Ultra Street Fighter IV';
			case 'SF6':
				return 'Street Fighter 6';
			default:
  }
}

function getHashtags(game) {
  switch (game) {
    case 'Granblue Fantasy: Versus':
      return '#GBVS #GranblueFantasy';
    case 'Under Night In-Birth Exe:Late[cl-r]':
      return '#UNICLR #inbirth';
    case 'Guilty Gear: Strive':
      return '#GGST #GuiltyGear';
    case 'Guilty Gear Xrd REV2':
      return '#GGXRD #GuiltyGear';
    case 'Melty Blood: Type Lumina':
      return '#MBTL #MBTL_Tournament';
    case 'BlazBlue: Central Fiction':
      return '#BBCF #BlazBlue';
    case 'Guilty Gear XX Accent Core':
      return '#GGACPR #GuiltyGear';
    case 'DNF Duel':
      return '#DNF #DNFDuel';
    case 'Persona 4 Arena Ultimax':
      return '#P4AU #Persona';
    case 'Street Fighter 6':
      return '#SF6 #STREETFIGHTER6 #STREETFIGHTER';
    default:
  }
}

module.exports = {
    getEventInfo, getGameTournamentNameAndID, getFinalResults, getEventStatus, getTop8, getTop8Players, getTop4, getLosersSemiFinals, getLosersFinals, getGrandFinal, getGrandFinalReset, getStreamQueue, reportSet
}