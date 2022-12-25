// For audio player

let loop = document.getElementById("loop");

// Main player Items
let content = document.getElementById("content");
let progressBar = document.getElementById("progress");
let progressBarInner = document.getElementById("playtime");

let songTitle = document.getElementById('songTitle');
let timeDisplay = document.getElementById('timeDisplay');
let durationDisplay = document.getElementById('durationDisplay');

let playButton = document.getElementById("play");
let nextButton = document.getElementById('next');
let prevButton = document.getElementById('prev');
let replayButton = document.getElementById('replay');
let playModeButton = document.getElementById('playMode');
let volumeControl = document.getElementById('volume');
let volumeControlInner = document.getElementById('volume-inner');

let playModeAltButton = document.getElementById('playModeAlt');
let altIcon = playModeAltButton.querySelector('icon');
let altText = playModeAltButton.querySelector('div');

let midiInfo = document.getElementById('midiInfo');

let locateFileBtn = document.getElementById('locate');

// Menu player options

let audioPlayer = document.getElementById('audioPlayer');
let picoAudioPlayer = document.getElementById('picoAudioPlayer');


let midiBtn = document.getElementById("picoAudioMIDI");
let midiSrcBtn = document.getElementById("midiSrc");

// Player flags
let paused = true;

/**
 * 0 = single
 * 1 = single looped
 * 2 = list
 * 3 = list looped
 */
// let playMode = 0;

/**
 * Audio Player
 */
function AudioPlayer() {
    this.audio = document.getElementById("audio");
    /**
     * Loads a url
     * @param {string} url 
     * @param {Function} callback
     */
    this.load = function (path, callback) {
        this.audio.src = (config.midisrc ? "api/midi" : "api/play") + path;
        callback();
    }

    /**
     * Play the audio
     */
    this.play = function () {
        playButton.innerText = '\ue00f';
        paused = false;
        this.audio.play();
    }

    /**
     * Pause the audio
     */
    this.pause = function () {
        playButton.innerText = '\ue000';
        paused = true;
        this.audio.pause();
    }

    /**
     * Gets audio duration
     * @returns duration in seconds
     */
    this.duration = function () {
        return this.audio.duration;
    }

    /**
     * Gets current audio progress
     * @returns progress in seconds
     */
    this.currentTime = function () {
        return this.audio.currentTime;
    }

    /**
     * Seek audio in seconds
     * @param {float} seconds 
     */
    this.seek = function (seconds) {
        this.audio.currentTime = seconds;
    }

    /**
     * Seek audio by percentage
     * @param {float} percentage 
     */
    this.seekPercentage = function (percentage) {
        this.seek(this.audio.duration * percentage);
    }

    this.destroy = function () {
        this.pause();
        this.audio.src = '';
    }

    this.isPaused = function () {
        return this.audio.paused;
    }

    this.setLoop = function (loop) {
        this.audio.loop = loop;
    }

    this.getVolume = function () {
        return this.audio.volume;
    }

    this.setVolume = function (volume) {
        this.audio.volume = volume;
    }

    this.audio.addEventListener('pause', e => {
        this.pause();
    });

    this.audio.addEventListener('play', e => {
        this.play();
    })

    this.audio.addEventListener('timeupdate', e => {
        updatePlayback();
    })

    this.audio.addEventListener('ended', onended);
}

// singleton picoaudio
let picoAudio = null;

function PicoAudioPlayer() {
    if (picoAudio == null) {
        picoAudio = new PicoAudio();
        picoAudio.init();
    }
    /**
     * Loads a url
     * @param {string} url 
     * @param {Function} callback
     */
    this.load = function (path, callback) {
        fetch("api/midi" + path).then(r => {
            if (r.ok) {
                r.arrayBuffer().then(data => {
                    const parsedData = picoAudio.parseSMF(data);
                    picoAudio.setData(parsedData);
                    callback();
                })
            }
        });
    }

    /**
     * Play the audio
     */
    this.play = function () {
        if (this.isEnded()) this.seek(0);
        playButton.innerText = '\ue00f';
        paused = false;
        picoAudio.play();
        updatePlayback();
    }

    /**
     * Pause the audio
     */
    this.pause = function () {
        playButton.innerText = '\ue000';
        paused = true;
        picoAudio.pause();
        updatePlayback();
    }

    /**
     * Gets audio duration
     * @returns duration in seconds
     */
    this.duration = function () {
        if (picoAudio.playData == null) return NaN;
        else return picoAudio.getTime(picoAudio.playData.songLength);
    }

    /**
     * Gets current audio progress
     * @returns progress in seconds
     */
    this.currentTime = function () {
        if (picoAudio.playData == null) return NaN;
        else return picoAudio.context.currentTime - picoAudio.states.startTime;
    }

    /**
     * Seek audio in seconds
     * @param {float} seconds 
     */
    this.seek = function (seconds) {
        let playing = picoAudio.states.isPlaying;
        picoAudio.stop();
        picoAudio.initStatus(false, true);
        picoAudio.setStartTime(seconds);
        if (playing) picoAudio.play();
    }

    /**
     * Seek audio by percentage
     * @param {float} percentage 
     */
    this.seekPercentage = function (percentage) {
        this.seek(this.duration() * percentage);
    }

    this.destroy = function () {
        this.pause();
    }

    this.isPaused = function () {
        return !picoAudio.states.isPlaying;
    }

    this.isEnded = function () {
        return player.currentTime() >= player.duration();
    }

    this.setLoop = function (loop) {
        picoAudio.setLoop(loop);
    }

    this.getVolume = function () {
        return picoAudio.getMasterVolume();
    }

    this.setVolume = function (volume) {
        picoAudio.setMasterVolume(volume);
    }

    picoAudio.addEventListener('noteOn', e => {
        updatePlayback();
    });

    picoAudio.addEventListener('noteOff', e => {
        updatePlayback();
    });

    picoAudio.addEventListener('play', e => {
        updatePlayback();
    });

    picoAudio.addEventListener('songEnd', e => {
        if (!picoAudio.isLoop()) this.pause();
        updatePlayback();
        onended();
    });

    setupWebMIDI();
}


// PicoAudio MIDI initialize
function setupWebMIDI() {
    if (config.webmidi) {
        navigator.requestMIDIAccess().then(access => {
            picoAudio.setWebMIDI(true);
        });
    } else {
        picoAudio.setWebMIDI(false);
    }
}

if (window.isSecureContext) {
    midiBtn.style.display = 'block';
    midiBtn.addEventListener('click', e => {
        config.webmidi = !config.webmidi;
        updateChecker(midiBtn, config.webmidi);
        setupWebMIDI();
        save();
    });
}
updateChecker(midiBtn, config.webmidi);

/**
 * Update a checker
 * @param {HTMLElement} parent 
 * @param {boolean} value 
 */
function updateChecker(parent, value) {
    let checker = parent.querySelector('icon');
    if (value) {
        checker.classList.add('icon-checked');
        checker.innerText = '\ue013';
    } else {
        checker.classList.remove('icon-checked');
        checker.innerText = '\ue012';
    }
}

// audio midi src toggle
midiSrcBtn.addEventListener('click', e => {
    config.midisrc = !config.midisrc;
    updateChecker(midiSrcBtn, config.midisrc);
    save();
});
updateChecker(midiSrcBtn, config.midisrc);


function updatePlayback() {
    let duration = player.duration();
    if (isNaN(duration)) duration = Infinity;
    progressBarInner.style.width = (player.currentTime() / duration * 100) + "%";
    timeDisplay.innerText = formatTime(player.currentTime());
    durationDisplay.innerText = formatTime(duration);
}

// Player action

progressBar.addEventListener('click', e => {
    progressBarInner.style.width = (e.clientX / progressBar.clientWidth * 100) + "%";
    player.seekPercentage(e.clientX / progressBar.clientWidth);
});


playButton.addEventListener('click', e => {
    paused = !paused;
    if (paused) {
        player.pause();
    } else {
        player.play();
    }
});

nextButton.addEventListener('click', e => {
    next();
})

prevButton.addEventListener('click', e => {
    previous();
});

replayButton.addEventListener('click', e => {
    player.seek(0);
    player.play();
});

// Bottom Menu
let bottomMenuBtn = document.getElementById('bottomMenu');
let bottomMenu = document.querySelector(".bottom-menu");

// menu display style changer
let bottomMenuDisplay = false;
function setBottomMenuVisible(visible) {
    bottomMenuDisplay = visible;
    let actual = bottomMenu.classList.contains('bottom-menu-visible');

    if (visible != actual) {
        if (visible) {
            bottomMenu.classList.add('bottom-menu-visible');
            bottomMenu.classList.remove('bottom-menu-hidden');
            collapse.classList.remove('hidden');
        } else {
            bottomMenu.classList.remove('bottom-menu-visible');
            bottomMenu.classList.add('bottom-menu-hidden');
            collapse.classList.add('hidden')
        }
    }
    bottomMenuDisplay = !actual;
}

// Toggle menu button
bottomMenuBtn.addEventListener('click', function (e) {
    bottomMenuDisplay = !bottomMenuDisplay;
    setBottomMenuVisible(bottomMenuDisplay);
});

// Close on click outside of the menu
collapse.addEventListener('click', function (e) {
    if (bottomMenuDisplay) {
        setBottomMenuVisible(false);
    }
});

// Close on click on menu item
bottomMenu.addEventListener('click', e => {
    if (bottomMenuDisplay) {
        setBottomMenuVisible(false);
    }
});

midiInfo.addEventListener('click', e => {
    midiinfo(midiInfo.getAttribute('value'));
});

// Player switch

function createPlayer(playerClass) {
    let playtime = player.currentTime();
    let paused = player.isPaused();
    let volume = player.getVolume();
    player.destroy();
    player = new playerClass();
    player.setVolume(volume);
    updatePlayer(config.playMode);
    if (filesMem.length > 0) {
        player.load(cdMem + "/" + filesMem[playing], () => {
            player.seek(playtime);
            if (!paused) player.play();
        });
    }
    config.player = player.constructor.name;
    save();
}

audioPlayer.addEventListener('click', e => {
    createPlayer(AudioPlayer);
});

picoAudioPlayer.addEventListener('click', e => {
    createPlayer(PicoAudioPlayer);
});

// Locate the file
function highlight(name) {
    let element = document.querySelector("div[value=\"" + name + "\"]");
    element.classList.remove('link-locate');
    element.scrollIntoView({ block: "center" });
    element.classList.add('link-locate');
}
locateFileBtn.addEventListener('click', e => {
    if (cdMem == pathman.getPath()) {
        highlight(filesMem[playing]);
    } else {
        pathman.setPath(cdMem);
        list().then(() => {
            highlight(filesMem[playing]);
        });
    }
});

// Play Mode Switch
playModeButton.addEventListener('click', e => {
    config.playMode++;
    if (config.playMode == 4) config.playMode = 0;
    updatePlayer(config.playMode);
    save();
});

playModeAltButton.addEventListener('click', e => {
    config.playMode++;
    if (config.playMode == 4) config.playMode = 0;
    updatePlayer(config.playMode);
    save();
});

function updatePlayer(mode) {
    switch (mode) {
        case 0:
            player.setLoop(false);
            playModeButton.innerText = '\ue00b';
            altIcon.innerText = '\ue00b';
            altText.innerText = 'Single';
            break;
        case 1:
            player.setLoop(true);
            playModeButton.innerText = '\ue00c';
            altIcon.innerText = '\ue00c';
            altText.innerText = 'Single Looped';
            break;
        case 2:
            player.setLoop(false);
            playModeButton.innerText = '\ue00d';
            altIcon.innerText = '\ue00d';
            altText.innerText = 'List';
            break;
        case 3:
            player.setLoop(false);
            playModeButton.innerText = '\ue00e';
            altIcon.innerText = '\ue00e';
            altText.innerText = 'List Looped';
            break;
        default:
            break;
    }
}

function onended() {
    switch (config.playMode) {
        case 2:
            if (playing == filesMem.length - 1) {
                player.pause();
            } else {
                next();
            }
            break;
        case 3:
            next();
            break;
        default:
            break;
    }
}

// Volume control

function setVolume(percentage){
    volumeControlInner.style.width = (percentage * 100) + "%";
    player.setVolume(percentage);
    config.volume = percentage;
    save();
}

volumeControl.addEventListener('pointermove', e => {
    if (e.buttons > 0) {
        setVolume(e.offsetX / volumeControl.clientWidth);
    }
});

volumeControl.addEventListener('click', e => {
    setVolume(e.offsetX / volumeControl.clientWidth);
});