let serverName = "JMBox";

let cd = [];
let files = [];
let playing = [];

let musicLoop = true;

let prefix = location.pathname;
let urlDir = location.hash.substring(1);

let cdMem = [];
let filesMem = [];


// TODO: Reimplement api client

/** 
 * Gets server information
 */
function info() {
    fetch('api/info').then(r => r.json()).then(result => {
        serverName = result.serverName;
        document.title = serverName;
        title.innerText = serverName;

        if ('mediaSession' in navigator) {
            navigator.mediaSession.metadata.album = serverName;
        }

        document.documentElement.style.setProperty('--theme-color', result.themeColor);
        metaThemeColor.content = result.themeColor;
    });
}

/** 
 * Listing a directory
 * @param {string} dir The absolute path of directory to enter
 * @param add Add this directory to stack
 */
function list(dir, add = true) {
    let url = getURL(dir);
    let split = dir.split('/');
    let filename = split[split.length - 1];
    fetch("api/list/" + url)
        .then(response => response.json())
        .then(result => {
            if (add && filename != "") {
                cd.push(filename);
            }
            console.log(cd);


            location.hash = "#/" + encodeURI(dir);
            content.innerHTML = '';

            if (cd.length > 0) {
                backBtn.classList.remove('hidden');
                homeBtn.classList.remove('hidden');
            } else {
                backBtn.classList.add('hidden');
                homeBtn.classList.add('hidden');
            }

            result.sort((a, b) => {
                let av = a.isDir ? -1000 : 0;
                let bv = b.isDir ? -1000 : 0;
                return a.name.localeCompare(b.name) + (av - bv);
            });

            files = [];

            for (let element of result) {
                let file = document.createElement("div");
                file.setAttribute("class", "link");
                file.setAttribute("value", element.name);
                if (element.isDir) {
                    file.innerText = "\u26D8 " + element.name;
                    file.setAttribute("onclick", `elist(this);`);
                } else {
                    file.innerText = "\u266b " + element.name;
                    file.setAttribute("onclick", `eplay(this);`);
                    files.push(element.name);
                }
                content.appendChild(file);
            };

            // Scroll to top
            scrollTo(0, 0);
        });
}

/** Build absolute path
 * @param {string} file The new file
 * @param {string[]} cd1 The base dir
 */
function concatDir(file, cd1 = cd) {
    let base = cd1.join('/');
    if (cd1.length > 0) {
        base += "/";
    }
    return base + file;
}

function getURL(path) {
    return encodeURIComponent(path);
}

/**
 * Back to parent directory
 */
function back() {
    cd.pop();
    list(concatDir('', cd), false);
}

/**
 * 
 * @param {HTMLElement} e 
 */
function elist(e) {
    list(concatDir(e.getAttribute('value'), cd));
}

/**
 * 
 * @param {HTMLElement} e 
 */
function eplay(e) {
    playing = files.indexOf(e.getAttribute('value'));
    cdMem = [...cd];
    filesMem = [...files];
    play(concatDir(e.getAttribute('value')));
}

/**
 * Loads a file and play it
 * @param {string} file The absolute path to file
 */
function play(file) {
    console.log(file);

    let split = file.split('/');
    let filename = split[split.length - 1];
    let url = "api/play/" + getURL(file);

    document.title = serverName + " - " + filename;
    wav.setAttribute("href", "api/play/" + file);
    mid.setAttribute("href", "api/midi/" + file);
    songTitle.innerText = filename;

    player.load(url);
    player.play();


    if ('mediaSession' in navigator) {
        navigator.mediaSession.metadata.title = filename;
        navigator.mediaSession.playbackState = 'playing';
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
    play(concatDir(filesMem[playing], cdMem));
}

/**
 * Plays previous file
 */
function previous() {
    playing--;
    if (playing < 0) {
        playing = filesMem.length - 1;
    }
    play(concatDir(filesMem[playing], cdMem));
}

/**
 * Go to absolute path
 * @param {string} dir 
 */
function goto(dir) {
    let dirs = dir.split('/');
    cd = [];
    for (let dir of dirs) {
        if (dir != '') {
            cd.push(dir);
        }
    }
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
        navigator.mediaSession.playbackState = 'playing';
    });
    navigator.mediaSession.setActionHandler('pause', () => {
        player.pause();
        navigator.mediaSession.playbackState = 'paused';
    });
    navigator.mediaSession.setActionHandler('stop', () => { audio.stop(); });
    navigator.mediaSession.setActionHandler('seekbackward', () => { audio.currentTime -= 5; });
    navigator.mediaSession.setActionHandler('seekforward', () => { audio.currentTime += 5; });
    navigator.mediaSession.setActionHandler('seekto', () => { });
    navigator.mediaSession.setActionHandler('nexttrack', next);
    navigator.mediaSession.setActionHandler('previoustrack', previous);
}

// Reads path from url (runs on initialize)
if (urlDir != null) {
    goto(decodeURI(urlDir));
}

// Initialize view
info();
list(concatDir('', cd), false);