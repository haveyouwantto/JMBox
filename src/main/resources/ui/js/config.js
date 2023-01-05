// For S&L configs

let defaultValue = {
    dark: false,
    webmidi: false,
    midisrc: false,
    player: "AudioPlayer",
    playMode: 0,
    volume: 1,
    spanDuration: 4,
    maxNoteDuration: 30,
    language: "auto"
}

let config = {};

/**
 * Load configurations from disk
 */
function load() {
    const localStorage = window.localStorage;
    for (const key in defaultValue) {
        if (Object.hasOwnProperty.call(defaultValue, key)) {
            const element = localStorage.getItem(key);
            if (element == null) {
                config[key] = defaultValue[key];
            } else {
                switch (typeof defaultValue[key]) {
                    case 'string':
                        config[key] = element;
                        break;
                    case 'number':
                        config[key] = parseFloat(element);
                        break;
                    case 'boolean':
                        config[key] = element == 'true';
                        break;
                    default:
                        config[key] = element;
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
    for (const key in config) {
        if (Object.hasOwnProperty.call(config, key)) {
            const element = config[key];
            localStorage.setItem(key, element);
        }
    }
    console.log("Config saved.");

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