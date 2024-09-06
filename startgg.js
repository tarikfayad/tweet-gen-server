require('dotenv').config();
const axios = require('axios');

const {
  getStandingsWithID,
  getNumEntrants,
  getStatusWithID,
  getSetsWithID,
  compareGameStrings,
  extractPlayerInfo,
  logError
} = require('./utils');

const {
  formatResultsString,
  formatTop8String,
  formatTop8Players,
  formatTop4String,
  formatLosersSemifinalsString,
  formatLosersFinalString,
  formatGrandFinalString,
  formatGrandFinalResetString
} = require('./string-formatter');

const getEventInfo = async function (slug) {
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
    variables: { "slug": slug }
  });

  var config = {
    headers: {
      'Authorization': 'Bearer ' + process.env.START_GG_BEARER_TOKEN,
      'Content-Type': 'application/json'
    }
  };

  let axiosAPI = axios.create(config);

  try {
    return await axiosAPI.post(process.env.START_GG_BASE_URL, data);
  } catch (error) {
    return logError(error);
  }
}

const getGameTournamentNameAndID = async function (slug, shortCode) {
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
    variables: { "slug": slug }
  });

  var config = {
    headers: {
      'Authorization': 'Bearer ' + process.env.START_GG_BEARER_TOKEN,
      'Content-Type': 'application/json'
    }
  };

  let axiosAPI = axios.create(config);

  try {
    let response = await axiosAPI.post(process.env.START_GG_BASE_URL, data);

    console.log('getGameTournamentNameAndID: ' + JSON.stringify(response.data));

    let tournamentName, eventID, gameName;

    let eventArray = response.data['data']['tournament']['events'];
    let information;
    eventArray.forEach(event => {

      if (compareGameStrings(shortCode, event.videogame.displayName)) {
        console.log(event);
        eventID = event.id;
        gameName = event.videogame.displayName;
        tournamentName = response.data['data']['tournament']['name'];

        information = {
          'gameName': gameName,
          'tournamentName': tournamentName,
          'id': eventID
        }
      } else {
        console.log("COMPARISON ERROR!");
        information = {
          'error': `There is no ${shortCode} tournament at the current link. Please make sure the selected game and bracket link match.`
        }
      }
    });

    return information;

  } catch (error) {
    return logError(error);
  }
}

const getTop8 = async function (slug, eventID, shortCode) {
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
      "slug": slug,
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
  try {
    let response = await axiosAPI.post(process.env.START_GG_BASE_URL, data);
    console.log('TOP 8 RESPONSE:');
    console.log(response.data);
    let sets = getSetsWithID(eventID, response.data['data']['tournament']['events']);

    return await formatTop8String(sets, eventID, shortCode);
  } catch (error) {
    return logError(error);
  }
}

const getTop8Players = async function (slug, eventID) {
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
      "slug": slug,
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
  try {
    let response = await axiosAPI.post(process.env.START_GG_BASE_URL, data);
    let sets = getSetsWithID(eventID, response.data['data']['tournament']['events']);

    return await formatTop8Players(sets);
  } catch (error) {
    return logError(error);
  }
}

const getTop4 = async function (slug, eventID, gameName) {
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
      "slug": slug,
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
  try {
    let response = await axiosAPI.post(process.env.START_GG_BASE_URL, data);
    console.log(response.data);
    let sets = getSetsWithID(eventID, response.data['data']['tournament']['events']);

    return await formatTop4String(sets, eventID, gameName);
  } catch (error) {
    return logError(error);
  }
}

const getLosersSemiFinals = async function (slug, eventID, gameName, matcherino) {
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
      "slug": slug,
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
  try {
    let response = await axiosAPI.post(process.env.START_GG_BASE_URL, data);
    let sets = getSetsWithID(eventID, response.data['data']['tournament']['events']);

    return await formatLosersSemifinalsString(sets, eventID, gameName, matcherino);
  } catch (error) {
    return logError(error);
  }
}

const getLosersFinals = async function (slug, eventID, gameName, matcherino) {
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
      "slug": slug,
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
  try {
    let response = await axiosAPI.post(process.env.START_GG_BASE_URL, data);
    let sets = getSetsWithID(eventID, response.data['data']['tournament']['events']);

    return await formatLosersFinalString(sets, eventID, gameName, matcherino);
  } catch (error) {
    return logError(error);
  }
}

const getGrandFinal = async function (slug, eventID, gameName, matcherino) {
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
      "slug": slug,
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
  try {
    let response = await axiosAPI.post(process.env.START_GG_BASE_URL, data);
    let sets = getSetsWithID(eventID, response.data['data']['tournament']['events']);

    return await formatGrandFinalString(sets, eventID, gameName, matcherino);
  } catch (error) {
    return logError(error);
  }
}

const getGrandFinalReset = async function (slug, eventID, gameName, matcherino) {
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
    variables: { "slug": slug }
  });

  var config = {
    headers: {
      'Authorization': 'Bearer ' + process.env.START_GG_BEARER_TOKEN,
      'Content-Type': 'application/json'
    }
  };

  let axiosAPI = axios.create(config);
  try {
    let response = await axiosAPI.post(process.env.START_GG_BASE_URL, data);
    let sets = getSetsWithID(eventID, response.data['data']['tournament']['events']);

    return await formatGrandFinalResetString(sets, eventID, gameName, matcherino);
  } catch (error) {
    return logError(error);
  }
}

const getFinalResults = async function (slug, eventID) {
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
    variables: { "slug": slug }
  });

  var config = {
    headers: {
      'Authorization': 'Bearer ' + process.env.START_GG_BEARER_TOKEN,
      'Content-Type': 'application/json'
    }
  };

  let axiosAPI = axios.create(config);

  try {
    let response = await axiosAPI.post(process.env.START_GG_BASE_URL, data);
    let standings = getStandingsWithID(eventID, response.data['data']['tournament']['events']);
    let numEntrants = getNumEntrants(eventID, response.data['data']['tournament']['events']);
    return await formatResultsString(standings, numEntrants, eventID);
  } catch (error) {
    return logError(error);
  }
}

const getPlayerTwitterHandle = async function (playerHandle, eventID) {
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
      "eventID": eventID,
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
  try {
    let response = await axiosAPI.post(process.env.START_GG_BASE_URL, data);
    let authorizations = response.data['data']['event']['entrants']['nodes'][0]['participants'][0]['player']['user']['authorizations'];
    let handle;
    if (!authorizations) handle = playerHandle;
    else {
      authorizations.forEach(authorization => {
        if (authorization['type'] === 'TWITTER') handle = authorization['externalUsername'];
      });

      if (!handle) handle = playerHandle;
      else handle = '@' + handle;
    }
    return handle;
  } catch (error) {
    return logError(error);
  }
}

const getStreamQueue = async function (tourneySlug) {
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
      "tourneySlug": tourneySlug
    }
  });

  var config = {
    headers: {
      'Authorization': 'Bearer ' + process.env.START_GG_BEARER_TOKEN,
      'Content-Type': 'application/json'
    }
  };

  let axiosAPI = axios.create(config);
  try {
    let response = await axiosAPI.post(process.env.START_GG_BASE_URL, data);
    let formatedSets = [];
    let sets = response.data?.data?.tournament?.streamQueue?.[0]?.sets ?? null;

    if (sets != null) {
      sets.forEach(function (set) {
        let setID = set['id'];
        let round = set['fullRoundText']

        if (round.toLowerCase().endsWith("final")) {
          round += "s";
        }

        let player1Info = extractPlayerInfo(set['slots'][0]['entrant']);
        let player2Info = extractPlayerInfo(set['slots'][1]['entrant']);

        let player1Name = player1Info.name;
        let player1Tag = player1Info.tag;
        let player1ID = player1Info.id;

        let player2Name = player2Info.name;
        let player2Tag = player2Info.tag;
        let player2ID = player2Info.id;

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
    } else {
      console.log("No stream sets to pull from Queue!");
    }
    return formatedSets;
  } catch (error) {
    return logError(error);
  }
}

const reportSet = async function (setID, winnerID, p1ID, p1Score, p2ID, p2Score) {

  let gameNumber = 1
  let gameArray = []

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

const getEventStatus = async function (slug, eventID) {
  var data = JSON.stringify({
    query: `query TournamentQuery($slug: String) {
      tournament(slug: $slug) {
        events {
          id
          state
      }
    }
  }`,
    variables: { "slug": slug }
  });

  var config = {
    headers: {
      'Authorization': 'Bearer ' + process.env.START_GG_BEARER_TOKEN,
      'Content-Type': 'application/json'
    }
  };

  let axiosAPI = axios.create(config);
  try {
    let response = await axiosAPI.post(process.env.START_GG_BASE_URL, data);
    let status = getStatusWithID(eventID, response.data['data']['tournament']['events']);

    return status;
  } catch (error) {
    return logError(error);
  }
}

module.exports = {
  getEventInfo, getGameTournamentNameAndID, getFinalResults, getEventStatus, getTop8, getTop8Players, getTop4, getLosersSemiFinals, getLosersFinals, getGrandFinal, getGrandFinalReset, getStreamQueue, reportSet, getPlayerTwitterHandle
}