let serverName = "JMBox";

let cd = [];
let files = [];
let playing = [];

let musicLoop = true;

let prefix = location.pathname;
let urlDir = location.hash.substring(1);



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
 * Listing a directory (relative)
 * @param {string} dir The directory to enter
 * @param add Add this directory to stack
 */
function list(dir, add = true) {
    let cwd = concatDir(dir);

    fetch("api/list/" + cwd)
        .then(response => response.json())
        .then(result => {
            if (add && dir != "") {
                cd.push(dir);
                window.scrollTo(0, 0);
            }

            location.hash = "#/" + cwd;
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
        });
}

/** Build absolute path
 * @param {string} dir The directory to enter
 */
function concatDir(dir) {
    let base = cd.join('/');
    if (cd.length > 0) {
        base += "/";
    }
    return base + encodeURIComponent(dir);
}

/**
 * Back to parent directory
 */
function back() {
    cd.pop();
    list('', false);
}

/**
 * 
 * @param {HTMLElement} e 
 */
function elist(e) {
    list(e.getAttribute('value'));
}

/**
 * 
 * @param {HTMLElement} e 
 */
function eplay(e) {
    play(e.getAttribute('value'));
}

/**
 * Loads a file and play it
 * @param {string} file The absolute path to file
 */
function play(file) {
    let url = "api/play/" + concatDir(file);
    console.log(url);


    document.title = serverName + " - " + file;
    wav.setAttribute("href", "api/play/" + concatDir(file));
    mid.setAttribute("href", "api/midi/" + concatDir(file));
    songTitle.innerText = file
    
    player.load(url);
    player.play();

    playing = files.indexOf(file);

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
    if (playing >= files.length) {
        playing = 0;
    }
    play(files[playing]);
}

/**
 * Plays previous file
 */
function previous() {
    playing--;
    if (playing < 0) {
        playing = files.length - 1;
    }
    play(files[playing]);
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
    goto(urlDir);
}

// Initialize view
info()
list('', false)