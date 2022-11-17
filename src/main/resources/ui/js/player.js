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
let replayButton = document.getElementById('replay');
let midiInfo = document.getElementById('midiInfo');

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
        this.audio.src = url;
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

    /**
     * Sets action on progress change
     * @param {Function} callback 
     */
    this.onupdate = function (callback) {
        this.audio.addEventListener('timeupdate', e => {
            callback(e);
        })
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
}


let player = new AudioPlayer(audio);

// Player action
player.onupdate(e => {
    progressBarInner.style.width = (player.currentTime() / player.duration() * 100) + "%";
    timeDisplay.innerText = formatTime(player.currentTime());
    durationDisplay.innerText = formatTime(player.duration());
});

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