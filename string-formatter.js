async function formatResultsString(standings, numEntrants, eventID) {
    const { getPlayerTwitterHandle } = await import('./startgg.js'); // This feels janky but it avoid circular dependency 

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
        if (set['fullRoundText'] === 'Winners Semi-Final') {
            let handles = [];
            let p1Handle = await getPlayerTwitterHandle(set['slots'][0]['entrant']['name'], eventID);
            let p2Handle = await getPlayerTwitterHandle(set['slots'][1]['entrant']['name'], eventID);
            handles.push(p1Handle);
            handles.push(p2Handle);
            winners.push(handles);
        } else if (set['fullRoundText'] === 'Losers Quarter-Final') {
            if (!losersRoundSet) {
                losersRound = set['round'] + 1;
                losersRoundSet = true;
            }
        }
    }

    for (var i = 0; i < sets.length; i++) {
        let set = sets[i];
        if (set['round'] === losersRound) {
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

    // Helper function to extract player handle
    function getPlayerHandle(slot) {
        if (slot['entrant'] === null) return '';
        return slot['entrant']['name'] || '';
    }

    // Helper function to process and add a match
    function processMatch(roundText, list) {
        for (let i = 0; i < sets.length; i++) {
            let set = sets[i];
            if (set['fullRoundText'] === roundText || (roundText === 'Losers Round' && set['round'] === losersRound)) {
                let p1Handle = getPlayerHandle(set['slots'][0]);
                let p2Handle = getPlayerHandle(set['slots'][1]);

                list.push({
                    'player1': p1Handle,
                    'player2': p2Handle,
                    'player1score': 0,
                    'player2score': 0
                });
            }
        }
    }

    // Process winners
    processMatch('Winners Semi-Final', winners);
    processMatch('Winners Final', winners);
    processMatch('Grand Final', winners);

    // Process losers
    processMatch('Losers Quarter-Final', losers);
    processMatch('Losers Semi-Final', losers);
    processMatch('Losers Final', losers);

    // Determine losersRound
    for (let i = 0; i < sets.length; i++) {
        let set = sets[i];
        if (set['fullRoundText'] === 'Losers Quarter-Final') {
            if (!losersRoundSet) {
                losersRound = set['round'] + 1;
                losersRoundSet = true;
            }
        }
    }

    // Process losers round
    processMatch('Losers Round', losers);

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
        if (set['fullRoundText'] === 'Winners Final') {
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
        if (set['fullRoundText'] === 'Losers Semi-Final') {
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
        if (set['fullRoundText'] === 'Losers Final') {
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
        if (set['fullRoundText'] === 'Grand Final') {
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
        if (set['fullRoundText'] === 'Grand Final Reset') {
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

module.exports = {
    formatResultsString,
    formatTop8String,
    formatTop8Players,
    formatTop4String,
    formatLosersSemifinalsString,
    formatLosersFinalString,
    formatGrandFinalString,
    formatGrandFinalResetString
};
