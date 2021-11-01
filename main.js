require('dotenv').config();
const bodyParser = require('body-parser');
const cors = require('cors');
const app = require('express')();
const axios = require('axios');

let gameName ='';

const axiosAPI = axios.create({
  baseURL: process.env.CHALLONGE_BASE_URL
});

// Rest API Methods. These are the endpoints that the Svelte app will hit.
app.use(bodyParser.json());
app.use(cors());

app.get('/:service/:organization/:tournament/:button', async (req, res) => {
  const response = await axiosAPI.get('tournaments/' + req.params.organization + '-' + req.params.tournament + '/matches.json?api_key=' + process.env.CHALLONGE_API_KEY);
  return res.status(200).json(await parseMatches(response.data, req.params.button, req.params.service, req.params.organization, req.params.tournament));
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
async function parseMatches(matches, button, service, organization, tournament) {
  switch (button) {
    case 'starting-soon':
      return [];
      break;
    case 'kickoff':
      return [];
      break;
    case 'top-16':
      return [];
      break;
    case 'top-8':
      if (await isTournamentInProgress(service, organization, tournament)) {
        var winnersRound = parseInt(matches[matches.length-1]['match']['round']) - 2;
        var losersRound = parseInt(matches[matches.length-3]['match']['round']) + 3;
        var winners = findMatchesInRound(matches, winnersRound);
        var losers = findMatchesInRound(matches, losersRound);
        return winners.concat(losers);
      } else {
        return [{
          'error': '⚠️ This command only works if the bracket is IN PROGRESS.'
        }];
      }
      break;
    case 'top-4':
      if (await isTournamentInProgress(service, organization, tournament)) {
        var winnersFinalsRound = parseInt(matches[matches.length-1]['match']['round']) - 1;
        return findMatchesInRound(matches, winnersFinalsRound);
      } else {
        return [{
          'error': '⚠️ This command only works if the bracket is IN PROGRESS.'
        }];
      }
      break;
    case 'losers-semis':
      if (await isTournamentInProgress(service, organization, tournament)) {
        return [matches[matches.length-4]];
      } else {
        return [{
          'error': '⚠️ This command only works if the bracket is IN PROGRESS.'
        }];
      }
      break;
    case 'losers-finals':
      if (await isTournamentInProgress(service, organization, tournament)) {
      } else {
        return [matches[matches.length-3]];
        return [{
          'error': '⚠️ This command only works if the bracket is IN PROGRESS.'
        }];
      }
      break;
    case 'grand-finals':
      if (await isTournamentInProgress(service, organization, tournament)) {
      } else {
        return [matches[matches.length-2]];
        return [{
          'error': '⚠️ This command only works if the bracket is IN PROGRESS.'
        }];
      }
      break;
    case 'reset':
      if (await isTournamentInProgress(service, organization, tournament)) {
      } else {
        return [matches[matches.length-1]];
        return [{
          'error': '⚠️ This command only works if the bracket is IN PROGRESS.'
        }];
      }
      break;
    case 'results':
      if (await isTournamentInProgress(service, organization, tournament)) {
        return [{
          'error': '⚠️ This command only works if the bracket is COMPLETED.'
        }];
      } else {
        return [];
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

async function isTournamentInProgress(service, organization, tournament) {
  // Will eventually use the below to support Smash.gg
  // if (service === 'challonge') {
  // }
  const response = await axiosAPI.get('tournaments/' + organization + '-' + tournament + '.json?api_key=' + process.env.CHALLONGE_API_KEY);
  var tournamentDictionary = response.data['tournament'];
  gameName = tournamentDictionary['game_name']; //Yes this is a janky place to set the game name.
  if (tournamentDictionary['state'] === 'complete') {
    return false;
  } else {return true;}
}

function formatTweet() {

}
