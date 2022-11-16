// For audio player

let audio = document.getElementById("audio");
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

// Player flags
let paused = true;

/**
 * HTML5 Audio Element
 * @param {HTMLAudioElement} audio
 */
let AudioPlayer = function (audio) {
    this.audio = audio;
    /**
     * Loads a url
     * @param {string} url 
     */
    this.load = function (url) {
        audio.src = url;
    }

    /**
     * Play the audio
     */
    this.play = function () {
        playButton.innerText = '\u2759\u2759';
        paused = false;
        audio.play();
    }

    /**
     * Pause the audio
     */
    this.pause = function () {
        playButton.innerText = '\u25B6';
        paused = true;
        audio.pause();
    }

    /**
     * Gets audio duration
     * @returns duration in seconds
     */
    this.duration = function () {
        return audio.duration;
    }

    /**
     * Gets current audio progress
     * @returns progress in seconds
     */
    this.currentTime = function () {
        return audio.currentTime;
    }

    /**
     * Seek audio in seconds
     * @param {float} seconds 
     */
    this.seek = function (seconds) {
        audio.currentTime = seconds;
    }

    /**
     * Seek audio by percentage
     * @param {float} percentage 
     */
    this.seekPercentage = function (percentage) {
        this.seek(audio.duration * percentage);
    }

    /**
     * Sets action on progress change
     * @param {Function} callback 
     */
    this.onupdate = function (callback) {
        audio.addEventListener('timeupdate', e => {
            callback(e);
        })
    }

    this.isPaused = function () {
        return audio.paused;
    }
}


let player = new AudioPlayer(audio);

// Player action
player.onupdate(e => {
    progressBarInner.style.width = (player.currentTime() / player.duration() * 100) + "%";
    timeDisplay.innerText = formatTime(player.currentTime());
    durationDisplay.innerText = formatTime(player.duration());
});

progressBar.addEventListener('click', e => {
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