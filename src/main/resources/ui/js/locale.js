let defaultLocale = {
    "menu.refresh": "Refresh",
    "menu.settings": "Settings",
    "menu.about": "About",
    "menu.locate": "Locate File",
    "menu.midi-info": "MIDI Info",
    "menu.audio-file": "Audio File",
    "menu.midi-file": "MIDI File",
    "menu.play-mode": "Play Mode",
    "menu.play-mode.single": "Single",
    "menu.play-mode.single-looped": "Single Looped",
    "menu.play-mode.list": "List",
    "menu.play-mode.list-looped": "List Looped",
    "menu.replay": "Replay",
    "menu.languages": "Languages",

    "settings.title": "Settings",
    "settings.general": "General",
    "settings.general.dark-mode": "Dark Mode",
    "settings.players": "Players",
    "settings.players.audio": "Sampled Audio",
    "settings.players.picoaudio": "PicoAudio Synthesizer",
    "settings.audio": "Sampled Audio",
    "settings.audio.midi-src": "Use MIDI as source",
    "settings.picoaudio": "PicoAudio",
    "settings.picoaudio.web-midi": "Use Web MIDI Output",
    "settings.picoaudio.midi-devices": "MIDI Devices",
    "settings.piano-roll": "Piano Roll",
    "settings.piano-roll.span-duration": "Span Duration",
    "settings.piano-roll.max-note-duration": "Max Note Duration",
    "settings.piano-roll.note-transparency": "Note translucence to velocity",
    "settings.piano-roll.highlight-playing-notes":"Highlight playing notes",
    "settings.close-btn": "Close",

    "dialog.close-btn": "Close",

    "about.title": "About",
    "about.name": "Web App",
    "about.version": "Version",
    "about.libraries": "Libraries",

    "midi-info.title": "MIDI Info",
    "midi-info.name": "Name",
    "midi-info.size": "Size",
    "midi-info.last-modified": "Last modified",
    "midi-info.duration": "Duration",
    "midi-info.failed": "Failed to fetch MIDI information.",

    "languages.title": "Languages",
    "languages.auto": "Automatic",

    "player.failed":"Failed to play",
    "player.failed.description":"There's an error in playing this file.",

    "general.error":"Error",

    "browser.not-found":"Directory not found."
};

let currentLocale = {};

const localeList = {
    "en-US": "English",
    "zh-CN": "\u7b80\u4f53\u4e2d\u6587",
    "zh-TW": "\u7e41\u9ad4\u4e2d\u6587",
    "ja-JP": "\u65e5\u672c\u8a9e"
};

async function localeInit() {
    // 检查用户的语言设置
    let lang;
    
    if (config.language == "auto") { lang = navigator.language; }
    else { lang = config.language }

    if (lang !== 'en-US') {
        // 如果用户的语言不是英语，尝试加载对应的语言文件
        try {
            const response = await fetch(`lang/${lang}.json`);
            currentLocale = await response.json();
            updateHTML();
        } catch (err) {
            // 如果对应的语言文件加载失败，则使用默认的 en-US.json
            currentLocale = defaultLocale;
        }
    } else {
        // 如果用户的语言是英语，则使用默认的 en-US.json
        currentLocale = defaultLocale;
    }
}

function getLocale(key) {
    // 先在当前语言文件中查找本地化字符串
    let value = currentLocale[key];
    if (value === undefined) {
        // 如果找不到，则在默认语言文件中查找
        value = defaultLocale[key];
        if (value === undefined) {
            // 如果还是找不到，则直接返回 key
            value = key;
        }
    }
    return value;
}

function updateHTML() {
    $("locale").forEach(element => {
        element.innerText = getLocale(element.getAttribute('key'));
    });
}

function setLocale(language = 'en-US') {
    if (language == 'en-US') {
        currentLocale = defaultLocale;
        updateHTML();
    }
    else {
        fetch("lang/" + language + ".json").then(r => {
            if (r.ok) {
                r.json().then(json => {
                    currentLocale = json;
                    updateHTML();
                })
            }
        })
    }
}

localeInit();