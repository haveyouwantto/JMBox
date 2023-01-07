// For top bar & menu

// Top bar Items
let head = $("#head");
let title = head.querySelector("#title");
let backBtn = head.querySelector("#back");
let homeBtn = head.querySelector("#home");
let menuBtn = head.querySelector("#menu");

let menu = head.querySelector(".menu");
let collapse = $("#collapse");

// Menu Items
let wav = $("#wav");
let mid = $("#mid");
let dark = $("#dark");

let refresh = $("#refresh");


// Misc Items
let metaThemeColor = $("#meta-theme-color");

// loop.addEventListener('click', function (e) {
//     musicLoop = !musicLoop;
//     audio.loop = musicLoop;
//     if (musicLoop) {
//         loop.classList.remove('button-disabled');
//     } else {
//         loop.classList.add('button-disabled');
//     }
// });

// Top bar back button 
// <
backBtn.addEventListener('click', function (e) {
    back();
});

// Top bar home button
// ⌂
homeBtn.addEventListener('click', function (e) {
    pathman.home();
    list();
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
            collapse.classList.add('hidden');
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
        root.setProperty('--bg-color-alt', '#202020');
        root.setProperty('--bar-color', '#303030');
        fillColor = '#101010';
    } else {
        root.setProperty('--text-color', '#202020');
        root.setProperty('--bg-color', 'white');
        root.setProperty('--hover-color', '#00000020');
        root.setProperty('--bg-color-alt', 'white');
        root.setProperty('--bar-color', '#e0e0e0');
        fillColor = '#f0f0f0';
    }
}

refresh.addEventListener('click', e => {
    list(true);
});

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


const openSettingsButton = $("#open-settings-button");
const closeSettingsButton = $("#close-settings-button");
const settingsDialog = $("#settings-dialog");

settingsDialog.addEventListener('animationend', function () {
    if (settingsDialog.classList.contains('fade-out')) {
        settingsDialog.classList.remove('fade-out')
        settingsDialog.close();
    }
});

openSettingsButton.addEventListener('click', () => {
    settingsDialog.classList.remove("fade-out");
    settingsDialog.showModal();
});

closeSettingsButton.addEventListener('click', () => {
    settingsDialog.classList.add("fade-out");
});


const dialog = $("#common-dialog");
const dialogTitle = dialog.querySelector('.title');
const dialogContent = dialog.querySelector('.dialog-container');
const closeDialogButton = $("#close-dialog-button");

dialog.addEventListener('animationend', function () {
    if (dialog.classList.contains('fade-out')) {
        dialog.classList.remove('fade-out')
        dialog.close();
    }
});

closeDialogButton.addEventListener('click', () => {
    dialog.classList.add('fade-out')
});

const aboutButton = $("#about-button");
aboutButton.addEventListener('click', e => {
    dialogTitle.innerText = getLocale('about.title');
    dialogContent.innerHTML = '';
    dialogContent.appendChild(createDialogItem('<a href="https://github.com/haveyouwantto/JMBox" class="link">JMBox</a> ' + getLocale("about.name")));
    dialogContent.appendChild(createDialogItem(getLocale("about.version") + " " + version));
    dialogContent.appendChild(createDialogItem("\u00a9 2022 haveyouwantto"));
    dialogContent.appendChild(createDialogItem("Licensed under MIT License."));

    let section = document.createElement("a");
    section.classList.add('dialog-subtitle');
    section.innerText = getLocale("about.libraries");
    dialogContent.appendChild(section);
    dialogContent.appendChild(createDialogItem('<a href="https://github.com/cagpie/PicoAudio.js" class="link">PicoAudio</a> \u00a9 cagpie (MIT License)'));
    dialog.showModal();
});

const languageButton = $("#language-button");

languageButton.addEventListener('click', e => {
    dialogTitle.innerHTML = '';
    dialogTitle.appendChild(createLocaleItem('languages.title'));
    dialogContent.innerHTML = '';

    let item = createDialogItem();
    item.appendChild(createLocaleItem('languages.auto'));
    item.addEventListener('click', e => {
        setLocale(navigator.language);
        config.language = "auto";
        save();
    });
    dialogContent.appendChild(item);

    for (let language in localeList) {
        let item = createDialogItem(localeList[language]);
        item.addEventListener('click', e => {
            setLocale(language);
            config.language = language;
            save();
        });
        dialogContent.appendChild(item);
    }
    dialog.showModal();
});
