let serverName = "JMBox";

let files = [];
let playing = [];

let musicLoop = true;

let prefix = location.pathname;
let urlDir = location.hash.substring(1);

let cdMem = '';
let filesMem = [];


let pathman = new PathMan();

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
function list() {
    let path = pathman.getPath();
    return fetch("api/list" + path)
        .then(response => response.json())
        .then(result => {

            location.hash = "#" + path;
            content.innerHTML = '';

            if (pathman.isRoot()) {
                backBtn.classList.add('hidden');
                homeBtn.classList.add('hidden');
            } else {
                backBtn.classList.remove('hidden');
                homeBtn.classList.remove('hidden');
            }

            // Sorting files
            result.sort((a, b) => {
                // Directories first
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
    console.log(file);
    let url = dir + "/" + encodeURIComponent(file);

    document.title = serverName + " - " + file;
    wav.setAttribute("href", "api/play" + url);
    mid.setAttribute("href", "api/midi" + url);
    midiInfo.setAttribute("value", url);
    songTitle.innerText = file;

    player.load(url, () => {
        player.play();
    });


    if ('mediaSession' in navigator) {
        navigator.mediaSession.metadata.title = file;
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

function midiinfo(url) {
    fetch("api/midiinfo" + url)
        .then(response => response.json())
        .then(data => {
            alert(
                "name: " + data.name + "\n" +
                "path: " + url + "\n" +
                "size: " + toSI(data.size, true) + "B\n" +
                "last modified: " + new Date(data.lastModified).toLocaleString() + "\n" +
                "duration: " + formatTime(player.duration())
            )
        });
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
    navigator.mediaSession.setActionHandler('stop', () => { player.stop(); });
    navigator.mediaSession.setActionHandler('seekbackward', () => { player.seek(player.currentTime() + 5) });
    navigator.mediaSession.setActionHandler('seekforward', () => { player.seek(player.currentTime() - 5) });
    navigator.mediaSession.setActionHandler('seekto', () => { });
    navigator.mediaSession.setActionHandler('nexttrack', next);
    navigator.mediaSession.setActionHandler('previoustrack', previous);
}

// Reads path from url (runs on initialize)
if (urlDir != null) {
    pathman.setPath(urlDir);
}

// Initialize view
info();
list();