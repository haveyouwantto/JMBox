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
let altText = playModeAltButton.querySelector('locale');

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

let audioInit = false;
function AudioPlayer() {
    this.audio = $("#audio");
    /**
     * Loads a url
     * @param {string} url 
     * @param {Function} callback
     */
    this.load = function (path, callback) {
        bufferedBar.style.display = 'block';
        try {
            this.audio.src = (config.midisrc ? "api/midi" : "api/play") + path;
            this.seek(0);
        } catch (error) {
            console.log(error.message);
        }
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
        if ('mediaSession' in navigator) {
            navigator.mediaSession.playbackState = 'playing';
        }
        playButton.innerText = '\ue00f';
        paused = false;
        this.audio.play();
    }

    /**
     * Pause the audio
     */
    this.pause = function () {
        if ('mediaSession' in navigator) {
            navigator.mediaSession.playbackState = 'paused';
        }
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
        this.audio.src = "null:"
        bufferedBar.style.display = 'none';
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

    this.replay = function () {
        this.seek(0);
        this.play();
    }

    if (!audioInit) {
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

        this.audio.addEventListener('error', e => {
            if (this.audio.src != 'null:') {
                dialogTitle.innerText = getLocale("player.failed");
                dialogContent.innerHTML = '';
                dialogContent.appendChild(createDialogItem(getLocale("player.failed.description")));
                dialog.showModal();
            }
        })

        audioInit = true;
    }
}

// singleton picoaudio
let picoAudio = null;
let picoAudioInit = false;
function PicoAudioPlayer() {
    this.paused = true;
    this.lastPausedTime = 0;
    this.intervalId = 0;
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
        this.seek(0);
        fetch("api/midi" + path).then(r => {
            if (r.ok) {
                r.arrayBuffer().then(data => {
                    const parsedData = picoAudio.parseSMF(data);
                    smfData = parsedData;
                    try {
                        picoAudio.setData(parsedData);
                        if (config.webmidi) {
                            resetMIDI(picoAudio.settings.WebMIDIPortOutput);
                        }
                    } catch (error) {
                        console.warn(error);
                    }
                    callback();
                })
            } else {
                dialogTitle.innerText = getLocale("player.failed");
                dialogContent.innerHTML = '';
                dialogContent.appendChild(createDialogItem(getLocale("player.failed.description")));
                dialog.showModal();
            }
        });
    }

    /**
     * Play the audio
     */
    this.play = function () {
        if ('mediaSession' in navigator) {
            navigator.mediaSession.playbackState = 'playing';
        }
        if (this.isEnded()) this.seek(0);
        playButton.innerText = '\ue00f';
        paused = false;
        this.paused = false;
        picoAudio.play();
        this.intervalId = setInterval(updatePlayback, 100);
    }

    /**
     * Pause the audio
     */
    this.pause = function () {
        if ('mediaSession' in navigator) {
            navigator.mediaSession.playbackState = 'paused';
        }
        playButton.innerText = '\ue000';
        this.lastPausedTime = this.currentTime();

        paused = true;
        this.paused = true;
        picoAudio.pause();

        clearInterval(this.intervalId);
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
        clearInterval(this.intervalId);
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

    this.replay = function () {
        this.seek(0);
        this.play();
    }

    // picoAudio.addEventListener('noteOn', e => {
    //     updatePlayback();
    // });

    // picoAudio.addEventListener('noteOff', e => {
    //     updatePlayback();
    // });

    // picoAudio.addEventListener('play', e => {
    //     updatePlayback();
    // });

    if (!picoAudioInit) {
        picoAudio.addEventListener('songEnd', e => {
            if (!picoAudio.isLoop()) this.pause();
            updatePlayback();
            onended();
        });
        picoAudioInit = true;
    }

    setupWebMIDI();
}


// PicoAudio MIDI initialize
function setupWebMIDI() {
    if (config.webmidi) {
        navigator.requestMIDIAccess({ sysex: true }).then(access => {

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
        let state = picoAudio.states.isPlaying;
        picoAudio.pause();
        picoAudio.setWebMIDI(false);
        if (state)
            picoAudio.play();
    }
}

function resetMIDI(output, mute = false) {
    if (output != null) {
        for (let i = 0; i < 16; i++) {
            if (mute)
                output.send([0xB0 | i, 0x7A, 0x00]);  // All Notes Off

            // 发送 "All Controllers Off" 事件
            output.send([0xB0 | i, 0x7B, 0x00]);  // All Controllers Off

            // 发送额外的重置控制器事件
            output.send([0xB0 | i, 0x01, 0x00]);  // Modulation Wheel
            output.send([0xB0 | i, 0x0B, 0x7F]);  // Expression
            output.send([0xB0 | i, 0x40, 0x00]);  // Hold Pedal
            output.send([0xB0 | i, 0x41, 0x00]);  // Portamento
            output.send([0xB0 | i, 0x42, 0x00]);  // Sustenuto
            output.send([0xB0 | i, 0x43, 0x00]);  // Soft
            output.send([0xB0 | i, 0x44, 0x00]);  // Legato
            output.send([0xB0 | i, 0x45, 0x00]);  // Hold 2
            output.send([0xB0 | i, 0x07, 0x64]);  // Volume
            output.send([0xB0 | i, 0x0A, 0x40]);  // Pan
            output.send([0xB0 | i, 0x65, 0x00]);  // Non-Registered Parameter (coarse)
            output.send([0xB0 | i, 0x64, 0x00]);  // Non-Registered Parameter (fine)
            output.send([0xB0 | i, 0x06, 0x02]);  // Registered Parameter (coarse)
            output.send([0xB0 | i, 0x26, 0x01]);  // Registered Parameter (fine)
            output.send([0xB0 | i, 0x5B, 0x28]);  // Reverb
            output.send([0xB0 | i, 0x5D, 0x00]);  // Chorus

            // 发送 "Pitch Wheel" 和 "Channel Pressure" 事件
            output.send([0xE0 | i, 0x40, 0x40]);  // Pitch Wheel
            output.send([0xD0 | i, 0x00]);        // Channel Pressure

            output.send([0xC0 | i, 0x00]);  // Program Change
        }
    }
}

if (window.isSecureContext) {
    midiBtn.addEventListener('click', e => {
        config.webmidi = !config.webmidi;
        updateChecker(midiBtn, config.webmidi);
        setupWebMIDI();
        save();
    });
} else {
    midiBtn.style.display = 'none';
    $("#picoaudio-section").style.display = "none";
}
updateChecker(midiBtn, config.webmidi);

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
        event.preventDefault();
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
    player.replay();
});

// Bottom Menu
let bottomMenuBtn = $("#bottomMenuBtn");
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
    let lastPaused = player.isPaused();
    let volume = player.getVolume();
    player.stop();
    player = new playerClass();
    player.setVolume(volume);
    updatePlayer(config.playMode);
    updatePlayerChecker(playerClass);

    if (filesMem.length > 0) {
        player.load(cdMem + "/" + filesMem[playing], () => {
            player.seek(playtime);
            if (!lastPaused) player.play();
        });
    }
    config.player = player.constructor.name;
    save();
}

function updatePlayerChecker(player) {
    switch (player) {
        case AudioPlayer:
            updateChecker(audioPlayer, true);
            updateChecker(picoAudioPlayer, false);
            break;
        case PicoAudioPlayer:
            updateChecker(audioPlayer, false);
            updateChecker(picoAudioPlayer, true);
            break;
    }
}

audioPlayer.addEventListener('click', e => {
    createPlayer(AudioPlayer);
});

picoAudioPlayer.addEventListener('click', e => {
    createPlayer(PicoAudioPlayer);
});

// Locate the file
function highlight(name) {
    let element = $(".file[value=\"" + name + "\"]");
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
            altText.innerHTML = '';
            altText.appendChild(createLocaleItem('menu.play-mode.single'));
            break;
        case 1:
            player.setLoop(true);
            playModeButton.innerText = '\ue00c';
            altIcon.innerText = '\ue00c';
            altText.innerHTML = '';
            altText.appendChild(createLocaleItem('menu.play-mode.single-looped'));
            break;
        case 2:
            player.setLoop(false);
            playModeButton.innerText = '\ue00d';
            altIcon.innerText = '\ue00d';
            altText.innerHTML = '';
            altText.appendChild(createLocaleItem('menu.play-mode.list'));
            break;
        case 3:
            player.setLoop(false);
            playModeButton.innerText = '\ue00e';
            altIcon.innerText = '\ue00e';
            altText.innerHTML = '';
            altText.appendChild(createLocaleItem('menu.play-mode.list-looped'));
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
    player.setVolume(Math.pow(percentage, 2));
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
    console.log(deviceSelection.value);
    
    resetMIDI(picoAudio.settings.WebMIDIPortOutput, true);  // reset previous device
    let device = midiDeviceList.get(deviceSelection.value);
    resetMIDI(device, true);  // reset current device
    picoAudio.settings.WebMIDIPortOutput = device;
});