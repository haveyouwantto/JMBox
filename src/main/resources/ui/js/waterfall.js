let waterfall = document.getElementById('waterfall');
let canvas = document.getElementById('canvas');
let canvasCtx = canvas.getContext('2d');
let dpr = window.devicePixelRatio;
let smfData = null;

let fillColor = 'white';

let palette = [
    '#f44336', '#ff9800', '#ffc107', '#ffeb3b',
    '#cddc39', '#8bc34a', '#4caf50', '#009688',
    '#00bcd4', '#9e9e9e', '#03a9f4', '#2196f3',
    '#3f51b5', '#673ab7', '#9c27b0', '#e91e63'
]

let spanDuration = 4;
let noteWidth = 0;
let keyboardHeight = 0;
let blackKeyHeight = 0;

const bwr = 12 / 7;  // White key = n black key
const shiftval = 2 - bwr;

let notes = Array(128);

// 定义一个包含所有黑键的数组
const blackKeys = [1, 3, 6, 8, 10];
// 定义一个数组，包含所有白键的音符名称的编号
const whiteKeyNumbers = [0, 2, 4, 5, 7, 9, 11];

// Entrance to waterfall
controlsLeft.addEventListener('click', e => {
    if (smfData != null && waterfall.classList.contains('hidden')) {
        waterfall.classList.remove('hidden');
        waterfall.classList.add('open');
        requestAnimationFrame(draw);
    } else {
        waterfall.classList.add('hidden');
        waterfall.classList.remove('open');
    }
    resizeCanvas();
});

function isBlackKey(midiNoteNumber) {
    // 计算 MIDI 音高编号对应的音符名称的编号（0-11）
    const noteNameNumber = midiNoteNumber % 12;
    // 如果音符名称的编号在 blackKeys 数组中，则该音符为黑键
    return blackKeys.includes(noteNameNumber);
}

function getWhiteKeyNumber(midiNoteNumber) {
    // 计算 MIDI 音高编号对应的音符名称的编号（0-11）
    const noteNameNumber = midiNoteNumber % 12;
    const mul = parseInt(midiNoteNumber / 12);
    // 返回白键的编号（从 1 开始）
    return whiteKeyNumbers.indexOf(noteNameNumber) + mul * 7;
}

function getStopTime(note) {
    if (note.holdBeforeStop != null && note.holdBeforeStop.length > 0) {
        return note.holdBeforeStop[0].time;
    } else return note.stopTime;
}

function draw() {
    if (smfData != null && !waterfall.classList.contains('hidden')) {
        canvasCtx.fillStyle = fillColor;
        canvasCtx.fillRect(0, 0, canvas.width, canvas.height);
        let playTime = player.currentTime();

        for (let i = 0; i < 16; i++) {
            canvasCtx.fillStyle = palette[i];
            for (let note of smfData.channels[i].notes.filter(item =>
                (item.startTime >= playTime && item.startTime <= playTime + spanDuration) || (item.startTime < playTime && getStopTime(item) > playTime)
            )) {
                let stopTime = getStopTime(note);
                let startY = (note.startTime - playTime) / spanDuration * canvas.height;
                let endY = (stopTime - playTime) / spanDuration * canvas.height;
                let x = note.pitch * noteWidth;

                canvasCtx.fillRect(x, canvas.height - endY - keyboardHeight, noteWidth, endY - startY);

                if (note.startTime < playTime && stopTime > playTime) {
                    notes[note.pitch] = i;
                }
            }
        }

        canvasCtx.fillStyle = 'white';
        for (let i = 0; i < 128; i++) {
            if (!isBlackKey(i)) {
                if (notes[i] != null) {
                    canvasCtx.fillStyle = palette[notes[i]];
                    notes[i] = null;
                }
                let x = getWhiteKeyNumber(i) * bwr;
                canvasCtx.fillRect(noteWidth * x, canvas.height - keyboardHeight, noteWidth * bwr, keyboardHeight);

                canvasCtx.fillStyle = 'gray';
                canvasCtx.fillRect(noteWidth * x, canvas.height - keyboardHeight, 1, keyboardHeight);   // Draw Seam

                canvasCtx.fillStyle = 'white';
            }
        }

        canvasCtx.fillStyle = 'black';
        for (let i = 0; i < 128; i++) {
            if (isBlackKey(i)) {
                if (notes[i] != null) {
                    canvasCtx.fillStyle = palette[notes[i]];
                    notes[i] = null;
                }
                canvasCtx.fillRect(i * noteWidth, canvas.height - keyboardHeight, noteWidth, blackKeyHeight);
                canvasCtx.fillStyle = 'black';
            }
        }

        canvasCtx.fillStyle = '#b71c1c';
        canvasCtx.fillRect(0, canvas.height - keyboardHeight - noteWidth * 0.5, canvas.width, noteWidth * 0.5);

        requestAnimationFrame(draw);
    }
}

function resizeCanvas() {
    let { width: cssWidth, height: cssHeight } = canvas.getBoundingClientRect();
    canvas.width = dpr * cssWidth;
    canvas.height = dpr * cssHeight;

    noteWidth = canvas.width / 128;
    keyboardHeight = noteWidth * 9;
    blackKeyHeight = noteWidth * 5.5;
}
onresize = resizeCanvas;