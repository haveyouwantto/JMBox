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

loop.addEventListener('click', function (e) {
    musicLoop = !musicLoop;
    audio.loop = musicLoop;
    loop.style.backgroundColor = musicLoop ? 'var(--theme-color)' : '#616161';
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
    setDarkMode(config.dark);
    save();
});

// window.addEventListener('popstate', e => {
//     console.log(navigator);
// });


function setDarkMode(dark) {
    let root = document.documentElement.style;
    if (dark) {
        root.setProperty('--text-color', '#cccccc');
        root.setProperty('--bg-color', '#101010');
        root.setProperty('--hover-color', '#ffffff20');
    } else {
        root.setProperty('--text-color', 'black');
        root.setProperty('--bg-color', '#f0f0f0');
        root.setProperty('--hover-color', '#00000020');
    }
}

setDarkMode(config.dark);