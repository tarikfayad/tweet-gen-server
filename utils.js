function getStandingsWithID(id, eventArray) {
    let standings;
    eventArray.forEach(event => {
        if (id === event.id) standings = event.standings.nodes;
    });

    return standings;
}

function getNumEntrants(id, eventArray) {
    let entrants;
    eventArray.forEach(event => {
        if (id === event.id) entrants = event.numEntrants;
    });

    return entrants;
}

function getStatusWithID(id, eventArray) {
    let status;
    eventArray.forEach(event => {
        if (id === event.id) status = event.state;
    });

    return status;
}

function getSetsWithID(id, eventArray) {
    let sets;
    eventArray.forEach(event => {
        if (id === event.id) sets = event.sets.nodes;
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
        case 'Granblue Fantasy Versus: Rising':
            return '#GBVSR #GranblueFantasy';
        case 'Under Night In-Birth Exe:Late[cl-r]':
            return '#UNICLR #inbirth';
        case 'Under Night In-Birth II Sys:Celes':
            return '#UNISC #UNI2 #inbirth';
        case 'Guilty Gear: Strive':
            return '#GGST #GuiltyGear';
        case 'Guilty Gear Xrd REV2':
            return '#GGXRD #GuiltyGear';
        case 'Melty Blood: Type Lumina':
            return '#MBTL #MeltyBlood';
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

function mergeSponsorTags(sponsors) {
    let sponsorTags = '';
    for (let i = 0; i < sponsors.length; i++) {
        const tag = sponsors[i];
        if (i === sponsors.length - 1) { sponsorTags = sponsorTags + tag; }
        else { sponsorTags = sponsorTags + tag + ' | '; }
    }

    return sponsorTags;
}

function extractPlayerInfo(entrant) {
    let name, tag, id;

    if (entrant != null) {
        let fullString = entrant['name'];
        let stringParts = fullString.split('|');

        if (stringParts.length > 1) {
            name = stringParts[stringParts.length - 1].trim();
            let tags = stringParts.slice(0, -1).map(part => part.trim());
            tag = mergeSponsorTags(tags);
        } else {
            tag = '';
            name = fullString;
        }

        id = entrant['id'];
    } else {
        tag = '';
        name = '??';
        id = 0;
    }

    return { name, tag, id };
}


function logError(error) {
    console.log(error);
    console.log('Error status:', error.response.status); // e.g., 503
    console.log('Error data:', error.response.data); // Error data from the response
    console.log('Error headers:', error.response.headers);
    return 'An error occurred while processing your request (' + error.response.status + '). Please try again later.';
}

module.exports = {
    getStandingsWithID,
    getNumEntrants,
    getStatusWithID,
    getSetsWithID,
    compareGameStrings,
    getHashtags,
    extractPlayerInfo,
    mergeSponsorTags,
    logError
};