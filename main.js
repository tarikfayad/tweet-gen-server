require('dotenv').config();
const bodyParser = require('body-parser');
const cors = require('cors');
const app = require('express')();
const challonge = require('./challonge.js');
const startgg = require('./startgg.js');

let gameName, tournamentName, startGGID;

// Rest API Methods. These are the endpoints that the Svelte app will hit.
app.use(bodyParser.json());
app.use(cors());

app.post('/tweet-gen', async (req, res) => {
  console.log('service: ' + req.body['service'])
  try {
    if(req.body['service']==='challonge') {
      let response = await challonge.getMatches(req);
      return res.status(200).json(await parseChallongeMatches(response.data, req.body));
    } else if(req.body['service']==='start') {
      return res.status(200).json(await parseStartGGMatches(req.body));
    }
  } catch (e) {
    console.log(e);
  }
});

// 404 error handler
app.use((req, res) => {
  res
    .status(404)
    .json({
      message: 'not found'
    })
});

// Other errors handler
app.use((err, req, res, next) => {
  let error = {
    status: err.status || 500,
    message: err.message || 'Something went wrong!'
  }
  if (process.env.NODE_ENV === 'development') {
    error['stack'] = err.stack
  }
  res
    .status(err.status || 500)
    .json(error)
})

// Running the app
const port = process.env.PORT || 5001
app.listen(port, () => console.log(`Tweet app backend is running on port ${port}`))

// CHALLONGE SWITCH STATEMENT
//Yes I know it's a little messy to pass along all of these variables,
//but it's the path of least resistance to make sure that the correct info get's spit out.
async function parseChallongeMatches(matches, body) {
  console.log('BUTTON:');
  console.log(body.button);
  let challongeNames;
  switch (body.button) {
    case 'player-list':
      var participants = await challonge.getPlayerList(body['organization'], body['tournament_slug']);
      return [{
        'message': "Today's Participants:\n\n" + participants
      }];
      break
    case 'starting-soon':
      return [{
        'message': 'Boutta start in about 30 minutes! 💪\n\n[EMBED LATEST REMINDER TWEET]'
      }];
      break;
    case 'kickoff':
      challongeNames = await challonge.getGameAndTournamentName(body['organization'], body['tournament_slug']);
      gameName = challongeNames["gameName"];
      tournamentName = challongeNames["tournamentName"];
      return [{
        'message': "Aaaand we're live with " + tournamentName + "!\n\n🎙️ @" + body.com1.replace("@", "") + " & @" + body.com2.replace("@", "") + "\n⚔️ " + body.bracket + "\n\n📺 https://twitch.tv/ImpurestClub\n💰 " + body.matcherino + "\n\n" + getHashtags(gameName)
      }];
      break;
    case 'top-16':
      challongeNames = await challonge.getGameAndTournamentName(body['organization'], body['tournament_slug']);
      gameName = challongeNames["gameName"];
      tournamentName = challongeNames["tournamentName"];
      return [{
        'message': "Top 16 is decided!\n\nStop by the stream and place your bets:\n\n⚔️ " + body.bracket + "\n📺 https://twitch.tv/ImpurestClub\n💰 " + body.matcherino + "\n\n" + getHashtags(gameName)
      }];
      break;
    case 'top-8':
      if (await challonge.isTournamentInProgress(body['organization'], body['tournament_slug'])) {
        challongeNames = await challonge.getGameAndTournamentName(body['organization'], body['tournament_slug']);
        gameName = challongeNames["gameName"];
        tournamentName = challongeNames["tournamentName"];
        var winnersRound = parseInt(matches[matches.length-1]['match']['round']) - 2;
        var losersRound = parseInt(matches[matches.length-3]['match']['round']) + 3;
        var winners = findMatchesInRound(matches, winnersRound);
        var winnersHandles = await challonge.getTwitterHandles(body['organization'], body['tournament_slug'], winners);
        var losers = findMatchesInRound(matches, losersRound);
        var losersHandles = await challonge.getTwitterHandles(body['organization'], body['tournament_slug'], losers);

        return [{
          'message': '🚨 TOP 8 HERE WE GO! 🚨\n\nw:\n' + winnersHandles[0]['player1'] + ' vs ' + winnersHandles[0]['player2'] + '\n' + winnersHandles[1]['player1'] + ' vs ' + winnersHandles[1]['player2'] + '\n\nl:\n' + losersHandles[0]['player1'] + ' vs ' + losersHandles[0]['player2'] + '\n' + losersHandles[1]['player1'] + ' vs ' + losersHandles[1]['player2'] +'\n\n📺 https://twitch.tv/ImpurestClub'
        }];
      } else {
        return [{
          'error': '⚠️ This command only works if the bracket is IN PROGRESS.'
        }];
      }
      break;
    case 'top-4':
      if (await challonge.isTournamentInProgress(body['organization'], body['tournament_slug'])) {
        challongeNames = await challonge.getGameAndTournamentName(body['organization'], body['tournament_slug']);
        gameName = challongeNames["gameName"];
        tournamentName = challongeNames["tournamentName"];
        var winnersFinalsRound = parseInt(matches[matches.length-1]['match']['round']) - 1;
        var winnersFinal =  findMatchesInRound(matches, winnersFinalsRound);
        var handles = await challonge.getTwitterHandles(body['organization'], body['tournament_slug'], winnersFinal);
        return [{
          'message': "We're in the Top 4 home stretch!\n\nFirst up ➡️ " + handles[0]['player1'] + " vs " + handles[0]['player2'] + "\n\n" + getHashtags(gameName) + "\n\n" + "📺 https://twitch.tv/ImpurestClub"
        }]
      } else {
        return [{
          'error': '⚠️ This command only works if the bracket is IN PROGRESS.'
        }];
      }
      break;
    case 'losers-semis':
      if (await challonge.isTournamentInProgress(body['organization'], body['tournament_slug'])) {
        challongeNames = await challonge.getGameAndTournamentName(body['organization'], body['tournament_slug']);
        gameName = challongeNames["gameName"];
        tournamentName = challongeNames["tournamentName"];
        var losersSemiRound = parseInt(matches[matches.length-4]['match']['round']);
        var losersSemi = findMatchesInRound(matches, losersSemiRound);
        var handles = await challonge.getTwitterHandles(body['organization'], body['tournament_slug'], losersSemi);
        return [{
          'message': "⏬ Losers Semifinals ⏬\n\n🥊 " + handles[0]['player1'] + " vs " + handles[0]['player2'] + "\n\n💰 " + body.matcherino + "\n📺 https://twitch.tv/ImpurestClub\n\n" + getHashtags(gameName)
        }]
      } else {
        return [{
          'error': '⚠️ This command only works if the bracket is IN PROGRESS.'
        }];
      }
      break;
    case 'losers-finals':
      if (await challonge.isTournamentInProgress(body['organization'], body['tournament_slug'])) {
        challongeNames = await challonge.getGameAndTournamentName(body['organization'], body['tournament_slug']);
        gameName = challongeNames["gameName"];
        tournamentName = challongeNames["tournamentName"];
        var losersFinalsRound = parseInt(matches[matches.length-3]['match']['round']);
        var losersFinal =  findMatchesInRound(matches, losersFinalsRound);
        var handles = await challonge.getTwitterHandles(body['organization'], body['tournament_slug'], losersFinal);
        return [{
          'message': "⚠️ Losers Finals ⚠️\n\n🥊 " + handles[0]['player1'] + " vs " + handles[0]['player2'] + "\n\n💰 " + body.matcherino + "\n📺 https://twitch.tv/ImpurestClub\n\n" + getHashtags(gameName)
        }]
      } else {
        return [{
          'error': '⚠️ This command only works if the bracket is IN PROGRESS.'
        }];
      }
      break;
    case 'grand-finals':
      if (await challonge.isTournamentInProgress(body['organization'], body['tournament_slug'])) {
        challongeNames = await challonge.getGameAndTournamentName(body['organization'], body['tournament_slug']);
        gameName = challongeNames["gameName"];
        tournamentName = challongeNames["tournamentName"];
        var grandFinalsRound = parseInt(matches[matches.length-2]['match']['round']);
        var grandFinals =  findMatchesInRound(matches, grandFinalsRound);
        var handles = await challonge.getTwitterHandles(body['organization'], body['tournament_slug'], grandFinals);
        return [{
          'message': "🚨 GRAND FINALS! 🚨\n\n🥊 " + handles[0]['player1'] + " vs " + handles[0]['player2'] + "\n\n💰 " + body.matcherino + "\n📺 https://twitch.tv/ImpurestClub\n\n" + getHashtags(gameName)
        }]
      } else {
        return [{
          'error': '⚠️ This command only works if the bracket is IN PROGRESS.'
        }];
      }
      break;
    case 'reset':
      if (await challonge.isTournamentInProgress(body['organization'], body['tournament_slug'])) {
        challongeNames = await challonge.getGameAndTournamentName(body['organization'], body['tournament_slug']);
        gameName = challongeNames["gameName"];
        tournamentName = challongeNames["tournamentName"];
        var grandFinalsResetRound = parseInt(matches[matches.length-1]['match']['round']);
        var grandFinalsReset =  findMatchesInRound(matches, grandFinalsResetRound);
        var handles = await challonge.getTwitterHandles(body['organization'], body['tournament_slug'], grandFinalsReset);
        return [{
          'message': "WE HAVE A RESET!\n\n🥊 " + handles[0]['player1'] + " vs " + handles[0]['player2'] + "\n\n💰 " + body.matcherino + "\n📺 https://twitch.tv/ImpurestClub\n\n" + getHashtags(gameName)
        }]
      } else {
        return [{
          'error': '⚠️ This command only works if the bracket is IN PROGRESS.'
        }];
      }
      break;
    case 'results':
      if (await challonge.isTournamentInProgress(body['organization'], body['tournament_slug'])) {
        return [{
          'error': '⚠️ This command only works if the bracket is COMPLETED.'
        }];
      } else {
        var finalResults = await challonge.getFinalResults(body['organization'], body['tournament_slug']);
        challongeNames = await challonge.getGameAndTournamentName(body['organization'], body['tournament_slug']);
        gameName = challongeNames["gameName"];
        tournamentName = challongeNames["tournamentName"];
        return [{
          'message': tournamentName + ' Results:\n\n' + finalResults + '\nBracket: ' + body.bracket + '\nVOD:'
        }];
      }
      break;

    case 'populate-top-8':
      if (await challonge.isTournamentInProgress(body['organization'], body['tournament_slug'])) {
        challongeNames = await challonge.getGameAndTournamentName(body['organization'], body['tournament_slug']);
        gameName = challongeNames["gameName"];
        tournamentName = challongeNames["tournamentName"];

        var winnersRound = parseInt(matches[matches.length-1]['match']['round']) - 2
        var winnersFinalsRound = parseInt(matches[matches.length-1]['match']['round']) - 1;
        var grandFinalsRound = parseInt(matches[matches.length-2]['match']['round']);

        var losersRound = parseInt(matches[matches.length-3]['match']['round']) + 3;
        var losersQuarterRound = parseInt(matches[matches.length-5]['match']['round']);
        var losersSemiRound = parseInt(matches[matches.length-4]['match']['round']);
        var losersFinalsRound = parseInt(matches[matches.length-3]['match']['round']);

        var winnersTop8 = findMatchesInRound(matches, winnersRound);
        var winnersFinals = findMatchesInRound(matches, winnersFinalsRound);
        var grandFinals = findMatchesInRound(matches, grandFinalsRound);

        var losersTop8 = findMatchesInRound(matches, losersRound);
        var losersQuarters = findMatchesInRound(matches, losersQuarterRound);
        var losersSemis = findMatchesInRound(matches, losersSemiRound);
        var losersFinals = findMatchesInRound(matches, losersFinalsRound);

        let winners = winnersTop8.concat(winnersFinals, grandFinals)
        let losers = losersTop8.concat(losersQuarters, losersSemis, losersFinals)

        var winnersHandles = await challonge.getUsernamesAndScores(body['organization'], body['tournament_slug'], winners);
        var losersHandles = await challonge.getUsernamesAndScores(body['organization'], body['tournament_slug'], losers);

        return [{
          'matches': [
            {
              'winners': winnersHandles
            },
            {
              'losers': losersHandles
            }
          ]
        }];
      } else {
        return [{
          'error': '⚠️ This command only works if the bracket is IN PROGRESS.'
        }];
      }
      break;
    default:
  }
}

//STARTGG SWITCH STATEMENT
async function parseStartGGMatches(body) {
  console.log('BUTTON:');
  console.log(body.button);
  console.log(body.game);

  if (body.button === 'stream-queue') {
    return await startgg.getStreamQueue(body['tournament_slug'])
  }

  let startGGNames = await startgg.getGameTournamentNameAndID(body.tournament_slug, body.game);
  gameName = startGGNames["gameName"];
  tournamentName = startGGNames["tournamentName"];
  startGGID = startGGNames["id"];
  let status = await startgg.getEventStatus(body['tournament_slug'], startGGID);

  switch (body.button) {
    case 'starting-soon':
      return [{
        'message': 'Boutta start in about 30 minutes! 💪\n\n[EMBED LATEST REMINDER TWEET]'
      }];
      break;
    case 'kickoff':
      
      return [{
        'message': "Aaaand we're live with " + tournamentName + "!\n\n🎙️ @" + body.com1.replace("@", "") + " & @" + body.com2.replace("@", "") + "\n⚔️ " + body.bracket + "\n\n📺 https://twitch.tv/ImpurestClub\n💰 " + body.matcherino + "\n\n" + getHashtags(gameName)
      }];
      break;
    case 'top-16':
      return [{
        'message': "Top 16 is decided!\n\nStop by the stream and place your bets:\n\n⚔️ " + body.bracket + "\n📺 https://twitch.tv/ImpurestClub\n💰 " + body.matcherino + "\n\n" + getHashtags(gameName)
      }];
      break;
    case 'top-8':
      if (status === 'ACTIVE') {
        return [{
          'message': await startgg.getTop8(body['tournament_slug'], startGGID, body.game)
      }]
      } else {
        return [{
          'error': '⚠️ This command only works if the bracket is ACTIVE.'
        }];
      }
      break;
    case 'top-4':
      if (status === 'ACTIVE') {
        return [{
          'message': await startgg.getTop4(body['tournament_slug'], startGGID, gameName)
      }]
      } else {
        return [{
          'error': '⚠️ This command only works if the bracket is ACTIVE.'
        }];
      }
      break;
    case 'losers-semis':
      if (status === 'ACTIVE') {
        return [{
          'message': await startgg.getLosersSemiFinals(body['tournament_slug'], startGGID, gameName, body.matcherino)
      }]
      } else {
        return [{
          'error': '⚠️ This command only works if the bracket is ACTIVE.'
        }];
      }
      break;
    case 'losers-finals':
      if (status === 'ACTIVE') {
        return [{
          'message': await startgg.getLosersFinals(body['tournament_slug'], startGGID, gameName, body.matcherino)
      }]
      } else {
        return [{
          'error': '⚠️ This command only works if the bracket is ACTIVE.'
        }];
      }
      break;
    case 'grand-finals':
      if (status === 'ACTIVE') {
        return [{
          'message': await startgg.getGrandFinal(body['tournament_slug'], startGGID, gameName, body.matcherino)
      }]
      } else {
        return [{
          'error': '⚠️ This command only works if the bracket is ACTIVE.'
        }];
      }
      break;
    case 'reset':
      if (status === 'ACTIVE') {
        return [{
          'message': await startgg.getGrandFinalReset(body['tournament_slug'], startGGID, gameName, body.matcherino)
      }]
      } else {
        return [{
          'error': '⚠️ This command only works if the bracket is ACTIVE.'
        }];
      }
      break;
    case 'results':
      if (status === 'COMPLETED') {
        var finalResults = await startgg.getFinalResults(body['tournament_slug'], startGGID);
      return [{
        'message': tournamentName + ' Results:\n\n' + finalResults + '\nBracket: ' + body.bracket + '\nVOD:'
      }];
      } else {
        return [{
          'error': '⚠️ This command only works if the bracket is COMPLETED.'
        }];
      }
      break;

    case 'populate-top-8':
      if (status === 'ACTIVE' || status === 'COMPLETED') {

        return await startgg.getTop8Players(body['tournament_slug'], startGGID);
      } else {
        return [{
          'error': '⚠️ Something went wrong fetching top 8!'
        }];
      }
      break;
    default:
  }
}

// HELPER METHODS
function findMatchesInRound (matches, round) {
  var foundMatches = [];
  matches.forEach((tourneyMatch, i) => {
    var dictionary = tourneyMatch['match'];
    if (dictionary['round'] === round) {
      foundMatches.push(dictionary);
    }
  });
  return foundMatches;
}

function getHashtags(game) {
  switch (game) {
    case 'Granblue Fantasy: Versus':
      return '#GBVS #GranblueFantasy'
    case 'Granblue Fantasy Versus: Rising':
      return '#GBVSR #GranblueFantasy'
    case 'Under Night In-Birth Exe:Late[cl-r]':
      return '#UNICLR #inbirth'
    case 'Under Night In-Birth II Sys:Celes':
      return '#UNISC #UNI2 #inbirth'
    case 'Guilty Gear -Strive-':
      return '#GGST #GuiltyGear'
    case 'Melty Blood: Type Lumina':
      return '#MBTL #MeltyBlood'
    case 'BlazBlue: Central Fiction':
      return '#BBCF #BlazBlue'
    case 'Guilty Gear XX Accent Core':
      return '#GGACPR #GuiltyGear'
    case 'DNF Duel':
      return '#DNF #DNFDuel'
    case 'Persona 4 Arena Ultimax':
      return '#P4AU #Persona'
    default:
  }
}
