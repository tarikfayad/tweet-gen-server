require('dotenv').config();
const https = require('https');
const fs = require('fs');

const bodyParser = require('body-parser');
const cors = require('cors');
const app = require('express')();
const challonge = require('./challonge.js');
const startgg = require('./startgg.js');

const { getHashtags } = require('./utils');

// Rest API Methods. These are the endpoints that the Svelte app will hit.
app.use(bodyParser.json());
app.use(cors());

app.post('/tweet-gen', async (req, res) => {
  console.log('service: ' + req.body['service'])
  try {
    if (req.body['service'] === 'challonge') {
      let response = await challonge.getMatches(req);
      return res.status(200).json(await parseChallongeMatches(response.data, req.body));
    } else if (req.body['service'] === 'start') {
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


// Recursively log all directories
function logDirectories(startPath) {
  console.log(`Listing directories in: ${startPath}`);
  
  fs.readdir(startPath, { withFileTypes: true }, (err, files) => {
    if (err) {
      console.error(`Error reading directory: ${startPath}`, err);
      return;
    }

    files.forEach(file => {
      if (file.isDirectory()) {
        console.log(`Directory: ${path.join(startPath, file.name)}`);
        logDirectories(path.join(startPath, file.name)); // Recursively list subdirectories
      }
    });
  });
}

// Start listing directories from root
logDirectories('/');



// Load SSL certificates
const options = {
  key: fs.readFileSync(process.env.PROD_KEY),
  cert: fs.readFileSync(process.env.PROD_CERT)
};

const port = process.env.PORT || 5001;

https.createServer(options, app).listen(port, () => {
  console.log(`HTTPS server running on port ${port}`);
});

// CHALLONGE SWITCH STATEMENT
// Yes I know it's a little messy to pass along all of these variables,
// but it's the path of least resistance to make sure that the correct info get's spit out.
async function parseChallongeMatches(matches, body) {
  console.log('BUTTON:', body.button);
  
  const organization = body['organization'];
  const tournamentSlug = body['tournament_slug'];
  let challongeNames;
  
  const getChallongeNames = async () => {
    challongeNames = await challonge.getGameAndTournamentName(organization, tournamentSlug);
    return challongeNames;
  };
  
  const isTournamentInProgress = async () => {
    return await challonge.isTournamentInProgress(organization, tournamentSlug);
  };
  
  const getMessage = async (messageFunc) => {
    if (await isTournamentInProgress()) {
      const names = await getChallongeNames();
      const gameName = names["gameName"];
      const tournamentName = names["tournamentName"];
      return {
        'message': await messageFunc(gameName, tournamentName)
      };
    } else {
      return {
        'error': '⚠️ This command only works if the bracket is IN PROGRESS.'
      };
    }
  };

  switch (body.button) {
    case 'player-list':
      const participants = await challonge.getPlayerList(organization, tournamentSlug);
      return [{
        'message': "Today's Participants:\n\n" + participants
      }];

    case 'starting-soon':
      return [{
        'message': 'Boutta start in about 30 minutes! 💪\n\n[EMBED LATEST REMINDER TWEET]'
      }];

    case 'kickoff':
    case 'top-16':
      const names = await getChallongeNames();
      const gameName = names["gameName"];
      const tournamentName = names["tournamentName"];
      return [{
        'message': `${body.button === 'kickoff' ? "Aaaand we're live with " : "Top 16 is decided!"}\n\n` +
                   `🎙️ @${body.com1.replace("@", "")} & @${body.com2.replace("@", "")}\n` +
                   `⚔️ ${body.bracket}\n\n` +
                   `📺 https://twitch.tv/ImpurestClub\n💰 ${body.matcherino}\n\n` +
                   getHashtags(gameName)
      }];

    case 'top-8':
    case 'top-4':
    case 'losers-semis':
    case 'losers-finals':
    case 'grand-finals':
    case 'reset':
      return await getMessage(async (gameName, tournamentName) => {
        const roundOffset = {
          'top-8': -2,
          'top-4': -1,
          'losers-semis': -4,
          'losers-finals': -3,
          'grand-finals': -2,
          'reset': -1
        }[body.button];

        const round = parseInt(matches[matches.length + roundOffset]['match']['round']);
        const match = findMatchesInRound(matches, round);
        const handles = await challonge.getTwitterHandles(organization, tournamentSlug, match);

        return {
          'message': `${body.button.replace(/-/g, ' ').toUpperCase()}! 🚨\n\n` +
                     `🥊 ${handles[0]['player1']} vs ${handles[0]['player2']}\n\n` +
                     `💰 ${body.matcherino}\n📺 https://twitch.tv/ImpurestClub\n\n` +
                     getHashtags(gameName)
        };
      });

    case 'results':
      if (await isTournamentInProgress()) {
        return [{
          'error': '⚠️ This command only works if the bracket is COMPLETED.'
        }];
      } else {
        const finalResults = await challonge.getFinalResults(organization, tournamentSlug);
        const names = await getChallongeNames();
        const gameName = names["gameName"];
        const tournamentName = names["tournamentName"];
        return [{
          'message': `${tournamentName} Results:\n\n${finalResults}\n\nBracket: ${body.bracket}\nVOD:`
        }];
      }

    case 'populate-top-8':
      if (await isTournamentInProgress()) {
        const roundOffsets = {
          'winnersTop8': -2,
          'winnersFinals': -1,
          'grandFinals': -2,
          'losersTop8': +3,
          'losersQuarters': -5,
          'losersSemis': -4,
          'losersFinals': -3
        };
        
        const getMatches = (key) => findMatchesInRound(matches, parseInt(matches[matches.length + roundOffsets[key]]['match']['round']));

        const winners = [
          ...getMatches('winnersTop8'),
          ...getMatches('winnersFinals'),
          ...getMatches('grandFinals')
        ];

        const losers = [
          ...getMatches('losersTop8'),
          ...getMatches('losersQuarters'),
          ...getMatches('losersSemis'),
          ...getMatches('losersFinals')
        ];

        const winnersHandles = await challonge.getUsernamesAndScores(organization, tournamentSlug, winners);
        const losersHandles = await challonge.getUsernamesAndScores(organization, tournamentSlug, losers);

        return [{
          'matches': [
            { 'winners': winnersHandles },
            { 'losers': losersHandles }
          ]
        }];
      } else {
        return [{
          'error': '⚠️ This command only works if the bracket is IN PROGRESS.'
        }];
      }

    default:
      return [{ 'error': '⚠️ Unknown command.' }];
  }
}

//STARTGG SWITCH STATEMENT
async function parseStartGGMatches(body) {
  console.log('BUTTON:');
  console.log(body.button);
  console.log(body.game);
  if (body.button === 'stream-queue') {
      return await startgg.getStreamQueue(body.tournament_slug);
  }

  if (body.button === 'update-startgg') {
      console.log('Start Body: ' + JSON.stringify(body));
      return await startgg.reportSet(body.setID, body.winnerID, body.p1ID, body.p1Score, body.p2ID, body.p2Score);
  }

  const startGGNames = await startgg.getGameTournamentNameAndID(body.tournament_slug, body.game);
  if (startGGNames.error) {
    return [{ 'error': startGGNames.error }];
  }

  const gameName = startGGNames.gameName;
  const tournamentName = startGGNames.tournamentName;
  const startGGID = startGGNames.id;
  const status = await startgg.getEventStatus(body.tournament_slug, startGGID);

  // Helper function to return error message
  const getErrorMessage = () => [{
      'error': '⚠️ This command only works if the bracket is ACTIVE.'
  }];

  // Helper function to return message
  const getMessage = (message) => [{
      'message': message
  }];

  switch (body.button) {
      case 'starting-soon':
          return getMessage('Boutta start in about 30 minutes! 💪\n\n[EMBED TWITTER STREAM]');
      case 'kickoff':
          return getMessage(`Aaaand we're live with ${tournamentName}!\n\n🎙️ @${body.com1.replace("@", "")} & @${body.com2.replace("@", "")}\n⚔️ ${body.bracket}\n\n📺 https://twitch.tv/ImpurestClub\n💰 ${body.matcherino}\n\n${getHashtags(gameName)}`);
      case 'top-16':
          return getMessage(`Top 16 is decided!\n\nStop by the stream and place your bets:\n\n⚔️ ${body.bracket}\n📺 https://twitch.tv/ImpurestClub\n💰 ${body.matcherino}\n\n${getHashtags(gameName)}`);
      case 'top-8':
      case 'top-4':
      case 'losers-semis':
      case 'losers-finals':
      case 'grand-finals':
      case 'reset':
          if (status === 'ACTIVE') {
              const fetchFunctions = {
                  'top-8': () => startgg.getTop8(body.tournament_slug, startGGID, body.game),
                  'top-4': () => startgg.getTop4(body.tournament_slug, startGGID, gameName),
                  'losers-semis': () => startgg.getLosersSemiFinals(body.tournament_slug, startGGID, gameName, body.matcherino),
                  'losers-finals': () => startgg.getLosersFinals(body.tournament_slug, startGGID, gameName, body.matcherino),
                  'grand-finals': () => startgg.getGrandFinal(body.tournament_slug, startGGID, gameName, body.matcherino),
                  'reset': () => startgg.getGrandFinalReset(body.tournament_slug, startGGID, gameName, body.matcherino)
              };
              return getMessage(await fetchFunctions[body.button]());
          } else {
              return getErrorMessage();
          }
      case 'results':
          if (status === 'COMPLETED') {
              const finalResults = await startgg.getFinalResults(body.tournament_slug, startGGID);
              return getMessage(`${tournamentName} Results:\n\n${finalResults}\n\nBracket: ${body.bracket}\nVOD:`);
          } else {
              return [{
                  'error': '⚠️ This command only works if the bracket is COMPLETED.'
              }];
          }
      case 'populate-top-8':
          if (status === 'ACTIVE' || status === 'COMPLETED') {
              return await startgg.getTop8Players(body.tournament_slug, startGGID);
          } else {
              return [{
                  'error': '⚠️ Something went wrong fetching top 8!'
              }];
          }
      default:
          return []; // Handle default case if needed
  }
}

// HELPER METHODS
function findMatchesInRound(matches, round) {
  var foundMatches = [];
  matches.forEach((tourneyMatch, i) => {
    var dictionary = tourneyMatch['match'];
    if (dictionary['round'] === round) {
      foundMatches.push(dictionary);
    }
  });
  return foundMatches;
}