let serverName = "JMBox";

// Main player Items
let content = document.getElementById("content");
let audio = document.getElementById("audio");
let loop = document.getElementById("loop");

// Header Items
let head = document.getElementById("head");
let title = head.querySelector("#title");
let backBtn = head.querySelector("#back");
let homeBtn = head.querySelector("#home");
let menuBtn = head.querySelector("#menu");

let menu = head.querySelector(".menu");
let collapse = document.querySelector("#collapse");

// Menu Items
let wav = document.getElementById("wav");
let mid = document.getElementById("mid");
let dark = document.getElementById("dark");

let cd = [];
let files = [];
let playing = [];

let musicLoop = true;

let prefix = location.pathname;
let urlDir = location.hash.substring(1);

let config = {
    dark: false
}

function info() {
    fetch('api/info').then(r => r.json()).then(result => {
        serverName = result.serverName;
        document.title = serverName;
        title.innerText = serverName;

        if ('mediaSession' in navigator) {
            navigator.mediaSession.metadata.album = serverName;
        }
    });
}

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

function concatDir(dir) {
    let base = cd.join('/');
    if (cd.length > 0) {
        base += "/";
    }
    return base + encodeURIComponent(dir);
}

function back() {
    cd.pop();
    list('', false);
}

function elist(e) {
    list(e.getAttribute('value'));
}

function eplay(e) {
    play(e.getAttribute('value'));
}

function play(file) {
    let url = "api/play/" + concatDir(file);
    console.log(file);

    document.title = serverName + " - " + file;
    audio.src = url;
    audio.loop = musicLoop;
    wav.setAttribute("href", "api/play/" + concatDir(file));
    mid.setAttribute("href", "api/midi/" + concatDir(file));
    playing = files.indexOf(file);

    if ('mediaSession' in navigator) {
        navigator.mediaSession.metadata.title = file;
        navigator.mediaSession.playbackState = 'playing';
    }
}

function next() {
    playing++;
    if (playing >= files.length) {
        playing = 0;
    }
    play(files[playing]);
}

function previous() {
    playing--;
    if (playing < 0) {
        playing = files.length - 1;
    }
    play(files[playing]);
}

function goto(dir) {
    let dirs = dir.split('/');
    cd = [];
    for (let dir of dirs) {
        if (dir != '') {
            cd.push(dir);
        }
    }
}

loop.addEventListener('click', function (e) {
    musicLoop = !musicLoop;
    audio.loop = musicLoop;
    loop.style.backgroundColor = musicLoop ? '#00796b' : '#616161';
});

backBtn.addEventListener('click', function (e) {
    back();
});

homeBtn.addEventListener('click', function (e) {
    cd = [];
    list('', false);
});

let menuDisplay = false;
function setMenuVisible(visible) {
    menuDisplay = visible;
    let actual = menu.classList.contains('menu-visible');

    if (visible != actual) {
        if (visible) {
            menu.classList.add('menu-visible');
            menu.classList.remove('menu-hidden');
            collapse.classList.remove('hidden');
        } else {
            menu.classList.remove('menu-visible');
            menu.classList.add('menu-hidden');
            collapse.classList.add('hidden')
        }
    }
    menuDisplay = !actual;
}

menuBtn.addEventListener('click', function (e) {
    menuDisplay = !menuDisplay;
    setMenuVisible(menuDisplay);
});

collapse.addEventListener('click', function (e) {
    if (menuDisplay) {
        setMenuVisible(false);
    }
});

menu.addEventListener('click', e => {
    if (menuDisplay) {
        setMenuVisible(false);
    }
});

dark.addEventListener('click', e => {
    config.dark = !config.dark;

    let root = document.documentElement.style;
    if (config.dark) {
        root.setProperty('--text-color', '#cccccc');
        root.setProperty('--bg-color', '#101010');
        root.setProperty('--hover-color', '#ffffff20');
    } else {
        root.setProperty('--text-color', 'black');
        root.setProperty('--bg-color', '#f0f0f0');
        root.setProperty('--hover-color', '#00000020');
    }
});

if ('mediaSession' in navigator) {
    navigator.mediaSession.metadata = new MediaMetadata({
        artwork: [
            { src: 'favicon.ico', type: 'image/x-icon' }
        ]
    });
    navigator.mediaSession.setActionHandler('play', () => {
        audio.play();
        navigator.mediaSession.playbackState = 'playing';
    });
    navigator.mediaSession.setActionHandler('pause', () => {
        audio.pause();
        navigator.mediaSession.playbackState = 'paused';
    });
    navigator.mediaSession.setActionHandler('stop', () => { audio.stop(); });
    navigator.mediaSession.setActionHandler('seekbackward', () => { audio.currentTime -= 5; });
    navigator.mediaSession.setActionHandler('seekforward', () => { audio.currentTime += 5; });
    navigator.mediaSession.setActionHandler('seekto', () => { });
    navigator.mediaSession.setActionHandler('nexttrack', next);
    navigator.mediaSession.setActionHandler('previoustrack', previous);
}

if (urlDir != null)
    goto(urlDir);

list('', false);
setTimeout(info, 1000);