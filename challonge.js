require('dotenv').config();
const axios = require('axios');

const axiosAPI = axios.create({
    baseURL: process.env.CHALLONGE_BASE_URL
  });

const getMatches = async function(req) {
    return await axiosAPI.get('tournaments/' + req.body.organization + '-' + req.body.tournament_slug + '/matches.json?api_key=' + process.env.CHALLONGE_API_KEY);
}

const getGameAndTournamentName = async function(organization, tournament){
    const response = await axiosAPI.get('tournaments/' + organization + '-' + tournament + '.json?api_key=' + process.env.CHALLONGE_API_KEY);
    var tournamentDictionary = response.data['tournament'];
    return {
        "gameName": tournamentDictionary['game_name'],
        "tournamentName": tournamentDictionary['name']
    }
}

const isTournamentInProgress = async function(organization, tournament) {
    console.log('Checking Tournament Status . . .');
    const response = await axiosAPI.get('tournaments/' + organization + '-' + tournament + '.json?api_key=' + process.env.CHALLONGE_API_KEY);
    var tournamentDictionary = response.data['tournament'];
    console.log(tournamentDictionary['state']);
    if (tournamentDictionary['state'] === 'complete' || tournamentDictionary['state'] === 'pending') {
    return false;
    } else {return true;}
}

const getTwitterHandles = async function(organization, tournament, matches) {
    var handles = [];
    var playerIDs = [];

    matches.forEach((tourneyMatch, i) => {
    var pIDs = {
        'player1_id': tourneyMatch['player1_id'],
        'player2_id': tourneyMatch['player2_id']
    }
    playerIDs.push(pIDs);
    });
    const response = await axiosAPI.get('tournaments/' + organization + '-' + tournament + '/participants.json?api_key=' + process.env.CHALLONGE_API_KEY);

    playerIDs.forEach((tourneyMatch, i) => {
    let player1;
    let player2;

    response.data.forEach((participant, n) => {
        let dictionary = participant['participant'];

        if (dictionary['id'] === tourneyMatch['player1_id']) {
        let customResponses = dictionary['custom_field_response'];
        let keys = Object.keys(customResponses);
        keys.forEach((key, i) => {
            if (customResponses[key] !== 'true') {
            if (customResponses[key].toUpperCase() === 'N/A') {
                player1 = dictionary['name'];
            } else {
                let tHandle = customResponses[key];
                player1 = '@' + tHandle.replace('@', '');
            }
            }
        });
        }

        if (dictionary['id'] === tourneyMatch['player2_id']) {
        let customResponses = dictionary['custom_field_response'];
        let keys = Object.keys(customResponses);
        keys.forEach((key, i) => {
            if (customResponses[key] !== 'true') {
            if (customResponses[key].toUpperCase() === 'N/A') {
                player2 = dictionary['name'];
            } else {
                let tHandle = customResponses[key];
                player2 = '@' + tHandle.replace('@', '');
            }
            }
        });
        }
    });

    if (typeof player1 !== 'undefined' && typeof player2 !== 'undefined') {
        handles.push ({
        'player1': player1,
        'player2': player2
        });
    }

    });
    return handles;
}

const getUsernamesAndScores = async function(organization, tournament, matches) {
    var handles = [];
    var playerIDs = [];

    matches.forEach((tourneyMatch, i) => {
    var pIDs = {
        'player1_id': tourneyMatch['player1_id'],
        'player2_id': tourneyMatch['player2_id'],
        'scores_csv': tourneyMatch['scores_csv']
    }
    playerIDs.push(pIDs);
    });
    const response = await axiosAPI.get('tournaments/' + organization + '-' + tournament + '/participants.json?api_key=' + process.env.CHALLONGE_API_KEY);

    playerIDs.forEach((tourneyMatch, i) => {
    console.log(tourneyMatch);
    let player1;
    let player2;
    let player1score;
    let player2score
    let scores = tourneyMatch['scores_csv'];
    console.log(scores);

    if (typeof scores !== 'undefined') {
        player1score = scores.split('-')[0];
        player2score = scores.split('-')[1];
    } else {
        player1score = '';
        player2score = '';
    }

    console.log(player1score);
    console.log(player2score);

    response.data.forEach((participant, n) => {
        let dictionary = participant['participant'];

        if (dictionary['id'] === tourneyMatch['player1_id']) {
        player1 = dictionary['name'];
        }

        if (dictionary['id'] === tourneyMatch['player2_id']) {
        player2 = dictionary['name'];
        }
    });

    if (typeof player1 === 'undefined') {
        player1 = '';
    }

    if (typeof player2 === 'undefined') {
        player2 = '';
    }

    if (typeof player1 !== 'undefined' && typeof player2 !== 'undefined') {
        handles.push ({
        'player1': player1,
        'player2': player2,
        'player1score': player1score,
        'player2score': player2score
        });
    }

    });
    return handles;
}

const getPlayerList = async function(organization, tournament) {
    const response = await axiosAPI.get('tournaments/' + organization + '-' + tournament + '/participants.json?api_key=' + process.env.CHALLONGE_API_KEY);
    var participants = response.data;
    var toSort = [];
    var players = '';

    participants.forEach((item, i) => {
        if (item['participant']['display_name'] !== null) {
            toSort.push(item['participant']['display_name']);
        }
    });

    console.log(toSort.sort());

    for (var i = 0; i < 8; i++) {
        let participant = toSort.sort()[i];
        players = players + participant + '\n';
    };

    return players;
}

const getFinalResults = async function(organization, tournament, matches) {
    console.log('Getting Tournament Results . . .');

    var results = '';
    var topThree = ['🏆', '🥈', '🥉'];

    const response = await axiosAPI.get('tournaments/' + organization + '-' + tournament + '/participants.json?api_key=' + process.env.CHALLONGE_API_KEY);
    var participants = response.data;
    var toSort = [];

    participants.forEach((item, i) => {
    if (item['participant']['final_rank'] !== null) {
        toSort.push(item);
    }
    });

    toSort.sort((player1, player2) => {
    return compareResults(player1, player2);
    });

    var player;

    if (toSort.length < 16) {
    // Return top 3 if there are less than 16 entries
    for (var i = 0; i < 3; i++) {
        let participant = toSort[i];
        let customResponses = participant['participant']['custom_field_response'];
        let keys = Object.keys(customResponses);
        keys.forEach((key, j) => {
        if (customResponses[key] !== 'true') {
            if (customResponses[key].toUpperCase() === 'N/A') {
            player = dictionary['name'];
            } else {
            let tHandle = customResponses[key];
            player = '@' + tHandle.replace('@', '');
            }
            results = results + topThree[i] + ' ' + player + '\n';
        }
        });
    }
    } else {
    for (var i = 0; i < 8; i++) {
        let participant = toSort[i];

        let customResponses = participant['participant']['custom_field_response'];
        let keys = Object.keys(customResponses);
        keys.forEach((key, j) => {
        if (customResponses[key] !== 'true') {
            if (customResponses[key].toUpperCase() === 'N/A') {
            player = participant['participant']['name'];
            player = player + ' ()';
            } else {
            let tHandle = customResponses[key];
            player = '@' + tHandle.replace('@', '');
            player = player + ' ()';
            }
            let position;
            if (i + 1 < 6) {
            position = i + 1;
            } else if (i + 1 === 6) {
            position = 5;
            } else {
            position = 7;
            }
            results = results + position.toString() + '. ' + player + '\n';
        }
        });
    }
    }

    return results;
}

function compareResults(player1, player2) {
    const pla1 = player1['participant']['final_rank'];
    const pla2 = player2['participant']['final_rank'];

    if (pla1 < pla2) {
    return -1;
    }

    if (pla1 > pla2) {
    return 1;
    }

    return 0;
}

module.exports = {
    getGameAndTournamentName, isTournamentInProgress, getTwitterHandles, getUsernamesAndScores, getFinalResults, getMatches, getPlayerList
}