require('dotenv').config();
const bodyParser = require('body-parser');
const cors = require('cors');
const app = require('express')();
const axios = require('axios');
const challonge = require('challonge.js')

let gameName = '';
let tournamentName = '';

const axiosAPI = axios.create({
  baseURL: process.env.CHALLONGE_BASE_URL
});

// Rest API Methods. These are the endpoints that the Svelte app will hit.
app.use(bodyParser.json());
app.use(cors());

app.post('/tweet-gen', async (req, res) => {
  try {
    const response = await axiosAPI.get('tournaments/' + req.body.organization + '-' + req.body.tournament_slug + '/matches.json?api_key=' + process.env.CHALLONGE_API_KEY);
    console.log('RESPONSE: ');
    console.log(response)
    return res.status(200).json(await parseMatches(response.data, req.body));
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

// Helper methods
//Yes I know it's a little messy to pass along all of these variables,
//but it's the path of least resistance to make sure that the correct info get's spit out.
async function parseMatches(matches, body) {
  console.log('BUTTON:');
  console.log(body.button);
  switch (body.button) {
    case 'starting-soon':
      return [{
        'message': 'Boutta start in about 30 minutes! 💪\n\n[EMBED LATEST REMINDER TWEET]'
      }];
      break;
    case 'kickoff':
      await challonge.isTournamentInProgress(body['organization'], body['tournament_slug']);
      return [{
        'message': "Aaaand we're live with " + tournamentName + "!\n\n🎙️ @" + body.com1.replace("@", "") + " & @" + body.com2.replace("@", "") + "\n⚔️ " + body.bracket + "\n\n📺 https://twitch.tv/ImpurestClub\n💰 " + body.matcherino + "\n\n" + getHashtags(gameName)
      }];
      break;
    case 'top-16':
      await challonge.isTournamentInProgress(body['organization'], body['tournament_slug']);
      return [{
        'message': "Top 16 is decided!\n\nStop by the stream and place your bets:\n\n⚔️ " + body.bracket + "\n📺 https://twitch.tv/ImpurestClub\n💰 " + body.matcherino + "\n\n" + getHashtags(gameName)
      }];
      break;
    case 'top-8':
      if (await challonge.isTournamentInProgress(body['organization'], body['tournament_slug'])) {
        var winnersRound = parseInt(matches[matches.length-1]['match']['round']) - 2;
        var losersRound = parseInt(matches[matches.length-3]['match']['round']) + 3;
        var winners = findMatchesInRound(matches, winnersRound);
        var winnersHandles = await challonge.getTwitterHandles(body['organization'], body['tournament_slug'], winners);
        var losers = findMatchesInRound(matches, losersRound);
        var losersHandles = await challonge.getTwitterHandles(body['organization'], body['tournament_slug'], losers);

        return [{
          'message': '🚨 TOP 8 HERE WE GO! 🚨\n\nw:\n' + winnersHandles[0]['player1'] + ' vs ' + winnersHandles[0]['player2'] + '\n' + winnersHandles[1]['player1'] + ' vs ' + winnersHandles[1]['player2'] + '\n\nl:\n' + losersHandles[0]['player1'] + ' vs ' + losersHandles[0]['player2'] + '\n' + losersHandles[1]['player1'] + ' vs ' + losersHandles[1]['player2'] +'\n\n📺 https://twitch.tv/ImpurestClub'
        }]

        return winnersHandles.concat(losersHandles);
      } else {
        return [{
          'error': '⚠️ This command only works if the bracket is IN PROGRESS.'
        }];
      }
      break;
    case 'top-4':
      if (await challonge.isTournamentInProgress(body['organization'], body['tournament_slug'])) {
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
        var finalResults = await challonge.getFinalResults(body['organization'], body['tournament_slug'])
        return [{
          'message': tournamentName + ' Results:\n\n' + finalResults + '\nBracket: ' + body.bracket + '\nVOD:'
        }];
      }
      break;

    case 'populate-top-8':
      if (await challonge.isTournamentInProgress(body['organization'], body['tournament_slug'])) {
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
    case 'Granblue Fantasy Versus':
      return '#GBVS #GranblueFantasy'
      break;
    case 'Under Night In-Birth Exe:Late[cl-r]':
      return '#UNICLR #inbirth'
      break;
    case 'Guilty Gear -Strive-':
      return '#GGST #GuiltyGear'
      break;
    case 'Melty Blood: Type Lumina':
      return '#MBTL #MBTL_Tournament'
      break;
    case 'BlazBlue: Central Fiction':
      return '#BBCF #BlazBlue'
      break;
    case 'Guilty Gear XX Accent Core':
      return '#GGACPR #GuiltyGear'
      break;
    case 'DNF Duel':
      return '#DNF #DNFDuel'
      break;
    case 'Persona 4 Arena Ultimax':
      return '#P4AU #Persona'
      break;
    default:
  }
}
