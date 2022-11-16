// For audio player

let audio = document.getElementById("audio");
let loop = document.getElementById("loop");

/**
 * HTML5 Audio Element
 * @param {HTMLAudioElement} audio
 */
let audioPlayer = function (audio) {
    this.audio = audio;
    this.load = function (url) {
        audio.src = url;
    }
    this.play = function () {
        audio.play();
    }
    this.pause = function () {
        audio.pause();
    }
    this.duration = function () {
        return audio.duration;
    }
    this.currentTime = function () {
        return audio.currentTime;
    }
    this.onupdate = function (callback) {
        audio.addEventListener('timeupdate', e => {
            callback(e);
        })
    }
}