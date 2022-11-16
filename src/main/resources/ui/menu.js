// For top bar & menu

// Top bar Items
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

// Misc Items
let metaThemeColor = document.getElementById("meta-theme-color");

loop.addEventListener('click', function (e) {
    musicLoop = !musicLoop;
    audio.loop = musicLoop;
    if (musicLoop) {
        loop.classList.remove('button-disabled');
    } else {
        loop.classList.add('button-disabled');
    }
});

// Top bar back button 
// <
backBtn.addEventListener('click', function (e) {
    back();
});

// Top bar home button
// ⌂
homeBtn.addEventListener('click', function (e) {
    cd = [];
    list('', false);
});

// menu display style changer
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

// Toggle menu button
menuBtn.addEventListener('click', function (e) {
    menuDisplay = !menuDisplay;
    setMenuVisible(menuDisplay);
});

// Close on click outside of the menu
collapse.addEventListener('click', function (e) {
    if (menuDisplay) {
        setMenuVisible(false);
    }
});

// Close on click on menu item
menu.addEventListener('click', e => {
    if (menuDisplay) {
        setMenuVisible(false);
    }
});

// Dark mode
dark.addEventListener('click', e => {
    config.dark = !config.dark;
    setDarkMode(config.dark);
    update('dark', config.dark);
});

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

// TODO: respond to browser back button

// let last = location.hash;
// window.addEventListener('popstate', e => {
//     if (location.hash != last) {
//         goto(location.hash.substring(1));
//     }
//     console.log(last, location.hash);

//     last = location.hash;
//     list('', false)
// });