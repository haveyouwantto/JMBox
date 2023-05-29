// For top bar & menu

// Top bar Items
let head = $("#head");
let title = head.querySelector("#title");
let backBtn = head.querySelector("#back");
let homeBtn = head.querySelector("#home");
let menuBtn = head.querySelector("#menu");

let menu = $("#topMenu");
let collapse = $("#collapse");

// Menu Items
let wav = $("#wav");
let mid = $("#mid");
// let darkModeBtn = $("#dark");

let refresh = $("#refresh");


// Browser metadata theme color
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
// darkModeBtn.addEventListener('click', e => {
//     settings.dark = !settings.dark;
//     setDarkMode(settings.dark);
//     update('dark', settings.dark);
// });

function setDarkMode(dark) {
    // let root = document.documentElement.style;
    // if (dark) {
    //     root.setProperty('--text-color', '#cccccc');
    //     root.setProperty('--bg-color', '#101010');
    //     root.setProperty('--hover-color', '#ffffff20');
    //     root.setProperty('--bg-color-alt', '#202020');
    //     root.setProperty('--bar-color', '#303030');
    //     fillColor = '#101010';
    // } else {
    //     root.setProperty('--text-color', '#202020');
    //     root.setProperty('--bg-color', 'white');
    //     root.setProperty('--hover-color', '#00000020');
    //     root.setProperty('--bg-color-alt', 'white');
    //     root.setProperty('--bar-color', '#e0e0e0');
    //     fillColor = '#f0f0f0';
    // }
    // updateChecker(darkModeBtn, settings.dark);
}

refresh.addEventListener('click', e => {
    list(true);
});

setDarkMode(settings.dark);

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



const aboutButton = $("#about-button");
aboutButton.addEventListener('click', e => {
    let dialog = new Dialog();
    dialog.setTitle(getLocale('about.title'));
    dialog.addText('<a href="https://github.com/haveyouwantto/JMBox" class="link">JMBox</a> ' + getLocale("about.name"));
    dialog.addText(getLocale("about.version") + " " + version);
    dialog.addText("\u00a9 2023 haveyouwantto");
    dialog.addText("Licensed under MIT License.");

    let section = document.createElement("a");
    section.classList.add('dialog-subtitle');
    section.innerText = getLocale("about.libraries");
    dialog.addElement(section);
    dialog.addText('<a href="https://github.com/cagpie/PicoAudio.js" class="link">PicoAudio</a> \u00a9 cagpie (MIT License)');
    dialog.setVisible(true);
});

const languageButton = $("#language-button");

languageButton.addEventListener('click', e => {
    let dialog = new Dialog();
    dialog.setTitleElement(createLocaleItem('languages.title'));

    let item = createDialogItem(null, true);
    item.classList.add('button-flash');
    item.appendChild(createLocaleItem('languages.auto'));
    item.addEventListener('click', e => {
        setLocale(navigator.language);
        settings.language = "auto";
        saveSettings();
    });
    dialog.addElement(item);

    for (let language in localeList) {
        let item = createDialogItem(localeList[language], true);
        item.classList.add('button-flash');
        item.addEventListener('click', e => {
            setLocale(language);
            settings.language = language;
            saveSettings();
        });
        dialog.addElement(item);
    }
    dialog.setVisible(true);
});

// Show Info
let showInfoBtn = $('#showInfo');
showInfoBtn.addEventListener('click', e => {
    settings.showInfo = !settings.showInfo;
    list();
    saveSettings();
    updateChecker(showInfoBtn, settings.showInfo);
});
updateChecker(showInfoBtn, settings.showInfo);

function listByUrl() {
    console.log(location.hash.substring(2));
    pathman.setPath(location.hash.substring(2));
    list(false, true);
}

window.onpopstate = event => {
    listByUrl();
}

document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape') {
        back();
    }
});

var select = document.getElementById("sort-select");
select.addEventListener("change", function () {
    var selectedOption = select.options[select.selectedIndex].value;
    updateSorting(selectedOption);
    list();
});

function updateSorting(func) {
    settings.sortFunc = func;
    if (func.startsWith("-")) {
        func = func.substr(1);
        sortReversed = true;
    } else {
        sortReversed = false;
    }
    saveSettings()
    sortFunc = window[func];
}
