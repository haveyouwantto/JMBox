// For audio player

let loop = $("#loop");

// Main player Items
let content = $("#content");
let progressBar = $("#progress");
let progressBarInner = $("#playtime");
let bufferedBar = $("#bufferedtime");

let controlsLeft = $("#controlsLeft");
let songTitle = $("#songTitle");
let timeDisplay = $("#timeDisplay");
let durationDisplay = $("#durationDisplay");

let playButton = $("#play");
let nextButton = $("#next");
let prevButton = $("#prev");
let replayButton = $("#replay");
let playModeButton = $("#playMode");
let volumeControl = $("#volume");
let volumeControlInner = $("#volume-inner");

let playModeAltButton = $("#playModeAlt");
let altIcon = playModeAltButton.querySelector('icon');
let altText = playModeAltButton.querySelector('div');

let midiInfo = $("#midiInfo");

let locateFileBtn = $("#locate");

// Menu player options

let audioPlayer = $("#audioPlayer");
let picoAudioPlayer = $("#picoAudioPlayer");


let midiBtn = $("#picoAudioMIDI");
let midiSrcBtn = $("#midiSrc");

// Player flags
let paused = true;

let midiDeviceList = {};
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
    this.audio = $("#audio");
    /**
     * Loads a url
     * @param {string} url 
     * @param {Function} callback
     */
    this.load = function (path, callback) {
        this.audio.src = (config.midisrc ? "api/midi" : "api/play") + path;
        updateBuffer(0, 1);
        fetch("api/midi" + path).then(r => {
            if (r.ok) {
                if (picoAudio == null) {
                    picoAudio = new PicoAudio();
                    picoAudio.init();
                }
                r.arrayBuffer().then(data => {
                    const parsedData = picoAudio.parseSMF(data);
                    smfData = parsedData;
                })
            }
        });
        callback();
    }

    /**
     * Play the audio
     */
    this.play = function () {
        navigator.mediaSession.playbackState = 'playing';
        playButton.innerText = '\ue00f';
        paused = false;
        this.audio.play();
    }

    /**
     * Pause the audio
     */
    this.pause = function () {
        navigator.mediaSession.playbackState = 'paused';
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

    this.stop = function () {
        this.pause();
        this.audio.src = '';
        updateBuffer(0, 1);
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
        for (let i = 0; i < this.audio.buffered.length; i++) {
            let endTime = this.audio.buffered.end(i);
            if (endTime > this.audio.currentTime) {
                updateBuffer(endTime, this.audio.duration);
                break;
            }
        }
    })

    this.audio.addEventListener('ended', onended);
}

// singleton picoaudio
let picoAudio = null;

function PicoAudioPlayer() {
    this.paused = true;
    this.lastPausedTime = 0;
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
                    smfData = parsedData;
                    try {
                        picoAudio.setData(parsedData);
                    } catch (error) {
                        console.warn(error);
                    }
                    callback();
                })
            }
        });
    }

    /**
     * Play the audio
     */
    this.play = function () {
        navigator.mediaSession.playbackState = 'playing';
        if (this.isEnded()) this.seek(0);
        playButton.innerText = '\ue00f';
        paused = false;
        this.paused = false;
        picoAudio.play();
        updatePlayback();
    }

    /**
     * Pause the audio
     */
    this.pause = function () {
        navigator.mediaSession.playbackState = 'paused';
        playButton.innerText = '\ue000';
        this.lastPausedTime = this.currentTime();

        paused = true;
        this.paused = true;
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
        if (picoAudio.playData == null) return 0;
        else if (this.paused) return this.lastPausedTime;
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

    this.stop = function () {
        picoAudio.stop();
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

            deviceSelection.innerHTML = '';

            midiDeviceList = access.outputs;
            for (let device of access.outputs) {
                var option = document.createElement('option');

                option.text = device[1].name;
                option.value = device[0];

                deviceSelection.add(option);
            }
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


function updateBuffer(value, duration) {
    bufferedBar.style.width = (value / duration * 100) + "%";
}

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

function togglePause() {
    paused = !paused;
    if (paused) {
        player.pause();
    } else {
        player.play();
    }
}

playButton.addEventListener('click', togglePause);
document.addEventListener("keypress", function (event) {
    if (event.key === " ") {
        togglePause();
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
let bottomMenuBtn = $("#bottomMenu");
let bottomMenu = $(".bottom-menu");

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
    player.stop();
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
    let element = $("div[value=\"" + name + "\"]");
    element.classList.remove('file-locate');
    element.scrollIntoView({ block: "center" });
    element.classList.add('file-locate');
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

function setVolume(percentage) {
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

let deviceSelection = $("#devices");
deviceSelection.addEventListener('change', e => {
    picoAudio.settings.WebMIDIPortOutput = midiDeviceList.get(deviceSelection.value);
});