// For S&L configs

let defaultValue = {
    dark: false,
    showInfo: false,
    webmidi: false,
    midisrc: false,
    player: "AudioPlayer",
    playMode: 0,
    volume: 1,
    midiLatency: 250,
    spanDuration: 4,
    maxNoteDuration: 30,
    language: "auto",
    noteTransparency: false,
    highlightNotes: false,
    sortFunc : "sortName",
    showNoteCounter : false
}

let settings = {};

/**
 * Load configurations from disk
 */
function load() {
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
let saving = false;
function saveNow() {
    const localStorage = window.localStorage;
    for (const key in settings) {
        if (Object.hasOwnProperty.call(settings, key)) {
            const element = settings[key];
            localStorage.setItem(key, element);
        }
    }
    console.log("Settings saved.");

    saving = false;
}

function save() {
    if (!saving) setTimeout(saveNow, 1000);
    saving = true;
}

/**
 * Update a configuration to disk
 * @param {string} key 
 * @param {string} value 
 */
function update(key, value) {
    window.localStorage.setItem(key, value);
}

load();