let serverName = "JMBox";

let files = [];
let playing = [];

let prefix = location.pathname;
let urlDir = location.hash.substring(2);

let cdMem = '';
let filesMem = [];

let player = null;

/**
 * File list cache
 */

let cache = {};

let pathman = new PathMan();

let sortFunc = sortName;
let sortReversed = false;


function init() {
    select.value = settings.sortFunc;
    updateSorting(settings.sortFunc);
}

/** 
 * Gets server information
 */
function info() {
    fetch('api/info').then(r => r.json()).then(result => {
        serverName = result.serverName;
        document.title = serverName;
        title.innerText = serverName;

        if (!result.capabilities.play) {
            player = new PlayerWrapper("PicoAudioPlayer");
            $('#player-section').style.display = 'none';
            $('#audio-section').style.display = 'none';
        } else {
            player = new PlayerWrapper(settings.player);
        }
        setVolume(settings.volume);
        updatePlayer(settings.playMode);
        updatePlayerChecker(settings.player);


        if ('mediaSession' in navigator) {
            navigator.mediaSession.metadata.album = serverName;
        }

        setThemeColor(result.themeColor);
    });
}

function setThemeColor(color) {
    document.documentElement.style.setProperty('--theme-color', color);
    document.documentElement.style.setProperty('--theme-color-80', color + "80");
    document.documentElement.style.setProperty('--theme-color-60', color + "60");
    document.documentElement.style.setProperty('--theme-color-50', color + "50");
    document.documentElement.style.setProperty('--theme-color-40', color + "40");
    document.documentElement.style.setProperty('--theme-color-20', color + "20");
    // Browser metadata theme color
    $("#meta-theme-color").content = color;
}

/** 
 * Listing a directory
 */
function list(ignoreCache = false, back = false) {
    content.innerHTML = '';
    let path = pathman.getPath();

    if (pathman.isRoot()) {
        backBtn.classList.add('hidden');
        homeBtn.classList.add('hidden');
        title.innerText = serverName;
    } else {
        backBtn.classList.remove('hidden');
        homeBtn.classList.remove('hidden');
        title.innerText = pathman.dirName();
    }

    if (cache[path] == null || ignoreCache) {
        return fetch("api/list" + path)
            .then(response => {
                if (response.ok) {
                    return response.json();
                } else {
                    let dialog = new Dialog();
                    dialog.setTitleElement(createLocaleItem('general.error'));
                    dialog.addText(getLocale('browser.not-found'));
                    dialog.setVisible(true);
                }
            })
            .then(result => {
                updateList(path, result, back);
                cache[path] = result;
            });
    }
    else {
        return updateList(path, cache[path], back);
    }
}

/** Update File list (UI) */
async function updateList(path, result, back = false) {
    if (!back) history.pushState({ page: 1 }, serverName, ("#!" + path));

    content.innerHTML = '';


    // Sorting files
    result.sort(sortFunc);
    if (sortReversed) result.reverse();

    files = [];
    for (let element of result) {
        let file = document.createElement("button");
        file.classList.add('file');
        file.setAttribute("value", element.name);

        let fileName = document.createElement('div');
        fileName.classList.add('filename');

        let icon = document.createElement('file-icon');
        fileName.appendChild(icon);
        if (element.isDir) {
            icon.innerText = "\ue016";
            file.setAttribute("onclick", `elist(this);`);
        } else {
            icon.innerText = "\ue00a";
            file.setAttribute("onclick", `eplay(this);`);
            files.push(element.name);
        }
        fileName.appendChild(document.createTextNode(element.name))
        file.appendChild(fileName);

        if (settings.showInfo) {
            let props = document.createElement('div');
            props.classList.add('fileprops');

            if (element.date != null) {
                let date = document.createElement('span');
                date.innerText = new Date(element.date).toLocaleString();
                date.style.float = 'left';
                props.appendChild(date);
            }

            if (!element.isDir && element.date != null) {
                let size = document.createElement('span');
                size.innerText = toSI(element.size) + "B";
                props.appendChild(size);
            }
            file.appendChild(props);
        }

        content.appendChild(file);
    };

    // Scroll to top
    scrollTo(0, 0);
}

/**
 * Back to parent directory
 */
function back() {
    pathman.remove();
    list();
}

/**
 * 
 * @param {HTMLElement} e 
 */
function elist(e) {
    pathman.add(e.getAttribute('value'));
    list();
}

/**
 * 
 * @param {HTMLElement} e 
 */
function eplay(e) {
    playing = files.indexOf(e.getAttribute('value'));
    cdMem = pathman.getPath();
    filesMem = [...files];
    play(cdMem, e.getAttribute('value'));
}

/**
 * Loads a file and play it
 * @param {string} dir The url of parent dir
 * @param {string} file The file name
 */
function play(dir, file) {
    let url = dir + "/" + encodeURIComponent(file);

    document.title = serverName + " - " + file;
    wav.setAttribute("href", "api/play" + url);
    mid.setAttribute("href", "api/midi" + url);
    // midiInfo.setAttribute("value", url);
    songTitle.innerText = file;

    player.stop();
    player.load(url, () => {
        player.play();
    });


    if ('mediaSession' in navigator) {
        navigator.mediaSession.metadata.title = file;
    }
}

/**
 * Plays next file
 */
function next() {
    playing++;
    if (playing >= filesMem.length) {
        playing = 0;
    }
    play(cdMem, filesMem[playing]);
}

/**
 * Plays previous file
 */
function previous() {
    playing--;
    if (playing < 0) {
        playing = filesMem.length - 1;
    }
    play(cdMem, filesMem[playing]);
}

function midiinfo() {
    let dialog = new Dialog();
    dialog.setTitle(getLocale("midi-info.title"));

    let data = cache[cdMem].find(i => i.name === filesMem[playing]);
    let notes = smfData.channels.reduce((prev, cur) => prev + cur.notes.length, 0);

    dialog.addText(getLocale("midi-info.name") + ": " + data.name);
    dialog.addText(getLocale("midi-info.size") + ": " + toSI(data.size, true) + "B");
    dialog.addText(getLocale("midi-info.last-modified") + ": " + new Date(data.date).toLocaleString());
    dialog.addText(getLocale("midi-info.duration") + ": " + formatTime(smfData.lastEventTime));
    dialog.addText(getLocale("midi-info.notes") + ": " + notes);
    dialog.setVisible(true);
}

// Set browser media control
if ('mediaSession' in navigator) {
    navigator.mediaSession.metadata = new MediaMetadata({
        // artwork: [
        //     { src: 'favicon.ico', type: 'image/x-icon' }
        // ]
    });
    navigator.mediaSession.setActionHandler('play', () => {
        player.play();
    });
    navigator.mediaSession.setActionHandler('pause', () => {
        player.pause();
    });
    navigator.mediaSession.setActionHandler('stop', () => player.stop);
    navigator.mediaSession.setActionHandler('seekbackward', () => { player.seek(player.currentTime() - 5) });
    navigator.mediaSession.setActionHandler('seekforward', () => { player.seek(player.currentTime() + 5) });
    navigator.mediaSession.setActionHandler('seekto', action => { player.seek(action.seekTime) });
    navigator.mediaSession.setActionHandler('nexttrack', next);
    navigator.mediaSession.setActionHandler('previoustrack', previous);
}

// Reads path from url (runs on initialize)
if (urlDir != null) {
    pathman.setPath(urlDir);
}

// Initialize view
init();
info();
list();