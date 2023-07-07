// For S&L configs

let defaultValue = {
    dark: 'unset',
    showInfo: true,
    webmidi: false,
    midisrc: false,
    player: "AudioPlayer",
    playMode: 0,
    volume: 1,
    waveType: true,
    midiLatency: 250,
    lastMidiDevice: "",
    spanDuration: 4,
    maxNoteDuration: 30,
    language: "auto",
    noteTransparency: false,
    highlightNotes: true,
    sortFunc : "sortName",
    prefmon : false,
    fancyMode : false,
    showLyrics : true,
    lyricsEncoding: "UTF-8"
}

let settings = {};

/**
 * Load configurations from disk
 */
function loadSettings() {
    const localStorage = window.localStorage;
    for (const key in defaultValue) {
        if (Object.hasOwnProperty.call(defaultValue, key)) {
            const element = localStorage.getItem(key);
            if (element == null) {
                settings[key] = defaultValue[key];
            } else {
                switch (typeof defaultValue[key]) {
                    case 'string':
                        settings[key] = element;
                        break;
                    case 'number':
                        settings[key] = parseFloat(element);
                        break;
                    case 'boolean':
                        settings[key] = element == 'true';
                        break;
                    default:
                        settings[key] = element;
                }
            }
        }
    }
}

/**
 * Save configurations to disk
 */
let savingSettings = false;
function saveNow() {
    const localStorage = window.localStorage;
    for (const key in settings) {
        if (Object.hasOwnProperty.call(settings, key)) {
            const element = settings[key];
            localStorage.setItem(key, element);
        }
    }
    console.log("Settings saved.");

    savingSettings = false;
}

function saveSettings() {
    if (!savingSettings) setTimeout(saveNow, 1000);
    savingSettings = true;
}

/**
 * Update a configuration to disk
 * @param {string} key 
 * @param {string} value 
 */
function update(key, value) {
    window.localStorage.setItem(key, value);
}

loadSettings();