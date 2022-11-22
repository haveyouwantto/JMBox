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
 * Audio Player
 */
let AudioPlayer = function () {
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
        playButton.innerText = '\u2759\u2759';
        paused = false;
        this.audio.play();
    }

    /**
     * Pause the audio
     */
    this.pause = function () {
        playButton.innerText = '\u25B6';
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

    this.audio.addEventListener('pause', e => {
        this.pause();
    });

    this.audio.addEventListener('play', e => {
        this.play();
    })

    this.audio.addEventListener('timeupdate', e => {
        updatePlayback();
    })
}

// singleton picoaudio
let picoAudio = null;

let PicoAudioPlayer = function () {
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
        playButton.innerText = '\u2759\u2759';
        paused = false;
        picoAudio.play();
        updatePlayback();
    }

    /**
     * Pause the audio
     */
    this.pause = function () {
        playButton.innerText = '\u25B6';
        paused = true;
        picoAudio.pause();
        updatePlayback();
    }

    /**
     * Gets audio duration
     * @returns duration in seconds
     */
    this.duration = function () {
        if (picoAudio.playData == null) return 0;
        return picoAudio.getTime(picoAudio.playData.songLength);
    }

    /**
     * Gets current audio progress
     * @returns progress in seconds
     */
    this.currentTime = function () {
        return picoAudio.context.currentTime - picoAudio.states.startTime;
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

    picoAudio.addEventListener('noteOn', e => {
        updatePlayback();
    });

    picoAudio.addEventListener('noteOff', e => {
        updatePlayback();
    });

    picoAudio.addEventListener('songEnd', e => {
        if (!picoAudio.isLoop()) this.pause();
        updatePlayback();
    });

    setupWebMIDI();
}


let player = new AudioPlayer(audio);

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
        alert(config.webmidi);
        setupWebMIDI();
        save();
    });
}



// audio midi src toggle
midiSrcBtn.addEventListener('click', e => {
    config.midisrc = !config.midisrc;
    alert(config.midisrc);
    save();
});


function updatePlayback() {
    progressBarInner.style.width = (player.currentTime() / player.duration() * 100) + "%";
    timeDisplay.innerText = formatTime(player.currentTime());
    durationDisplay.innerText = formatTime(player.duration());
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
    player.destroy();
    player = new playerClass();
    if (filesMem.length > 0) {
        player.load(cdMem + "/" + filesMem[playing], () => {
            player.seek(playtime);
            if (!paused) player.play();
        });
    }
}

audioPlayer.addEventListener('click', e => {
    createPlayer(AudioPlayer);
});

picoAudioPlayer.addEventListener('click', e => {
    createPlayer(PicoAudioPlayer);
});

// Locate the file
locateFileBtn.addEventListener('click', e => {
    pathman.setPath(cdMem);
    list().then(() => {
        let element = document.querySelector("div[value=\"" + filesMem[playing] + "\"]");
        element.scrollIntoView({ block: "center" });
        element.classList.add('link-locate');
    });
});