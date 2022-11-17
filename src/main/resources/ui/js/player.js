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

// Menu player options

let audioPlayer = document.getElementById('audioPlayer');
let picoAudioPlayer = document.getElementById('picoAudioPlayer');

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
        this.audio.src = "api/play/" + getURL(path);
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
        progressBarInner.style.width = (player.currentTime() / player.duration() * 100) + "%";
        timeDisplay.innerText = formatTime(player.currentTime());
        durationDisplay.innerText = formatTime(player.duration());
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
        fetch("/api/midi/" + getURL(path)).then(r => {
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
    }

    /**
     * Pause the audio
     */
    this.pause = function () {
        playButton.innerText = '\u25B6';
        paused = true;
        picoAudio.pause();
    }

    /**
     * Gets audio duration
     * @returns duration in seconds
     */
    this.duration = function () {
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
        progressBarInner.style.width = (player.currentTime() / player.duration() * 100) + "%";
        timeDisplay.innerText = formatTime(player.currentTime());
        durationDisplay.innerText = formatTime(player.duration());
    });

    picoAudio.addEventListener('songEnd', e => {
        this.pause();
    });
}


let player = new AudioPlayer(audio);

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
    console.log(1, bottomMenuDisplay);

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

audioPlayer.addEventListener('click', e => {
    let playtime = player.currentTime();
    let paused = player.isPaused();
    player.destroy();
    player = new AudioPlayer();
    player.load(concatDir(filesMem[playing], cdMem), () => {
        player.seek(playtime);
        if (!paused) player.play();
    });
});

picoAudioPlayer.addEventListener('click', e => {
    let playtime = player.currentTime();
    let paused = player.isPaused();
    player.destroy();
    player = new PicoAudioPlayer();
    player.load(concatDir(filesMem[playing], cdMem), () => {
        player.seek(playtime);
        if (!paused) player.play();
    });
});