let waterfall = $("#waterfall");
let canvas = $("#canvas");
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

let noteWidth = 0;
let keyboardHeight = 0;
let blackKeyHeight = 0;

const bwr = 12 / 7;  // White key = n black key
const shiftval = 2 - bwr;
let maxNoteDuration = 30;

let notes = Array(128);

// 定义一个包含所有黑键的数组
const blackKeys = [1, 3, 6, 8, 10];
// 定义一个数组，包含所有白键的音符名称的编号
const whiteKeyNumbers = [0, 2, 4, 5, 7, 9, 11];

let wakeLockSupported = 'wakeLock' in navigator;

// Create a reference for the Wake Lock.
let wakeLock = null;

let animationId = null;

// for performance monitoring
let lastDrawTime = performance.now();
let timeList = []

function startAnimation() {
    if (animationId == null && waterfall.classList.contains('open')) {
        lastDrawTime = performance.now();
        animationId = requestAnimationFrame(draw);
    }
}

function endAnimation() {
    if (animationId != null) {
        cancelAnimationFrame(animationId);
        animationId = null;
    }
}

function acquireWakelock() {
    if (wakeLockSupported) {
        try {
            navigator.wakeLock.request('screen').then(lock => {
                wakeLock = lock;
                lock.addEventListener('release', e => {
                    console.log("wakelock released");
                })
            });
        } catch (error) {
            console.error(error);
        }
    }
}

// Entrance to waterfall
controlsLeft.addEventListener('click', e => {
    if (waterfall.classList.contains('hidden')) {
        waterfall.classList.remove('hidden');
        waterfall.classList.add('open');

        startAnimation();
        acquireWakelock();
    } else {
        endAnimation();
        waterfall.classList.add('hidden');
        waterfall.classList.remove('open');
        if (wakeLockSupported && wakeLock != null) {
            wakeLock.release()
                .then(() => {
                    wakeLock = null;
                });
        }
    }
    resizeCanvas();
});

document.addEventListener("visibilitychange", function () {
    if (document.visibilityState === 'visible' && !waterfall.classList.contains('hidden')) {
        acquireWakelock();
    }
});

function isBlackKey(midiNoteNumber) {
    // Calculate the number (0-11) of the note name corresponding to the MIDI pitch number
    const noteNameNumber = midiNoteNumber % 12;
    // If the note name number is in the blackKeys array, the note is a black key
    return blackKeys.includes(noteNameNumber);
}

function getWhiteKeyNumber(midiNoteNumber) {
    // Calculate the number (0-11) of the note name corresponding to the MIDI pitch number
    const noteNameNumber = midiNoteNumber % 12;
    const mul = parseInt(midiNoteNumber / 12);
    // Return the number of the white key
    return whiteKeyNumbers.indexOf(noteNameNumber) + mul * 7;
}

function getStopTime(note) {
    let time;
    if (note.holdBeforeStop != null && note.holdBeforeStop.length > 0) {
        time = note.holdBeforeStop[0].time;
    } else {
        time = note.stopTime;
    }
    return Math.min(time, note.startTime + settings.maxNoteDuration);
}

function getNoteTransparency(velocity) {
    let transparency = Math.round(velocity * 255).toString(16);
    if (transparency.length < 2) {
        transparency = "0" + transparency;
    }
    return transparency;
}

function fastSpan(list, startTime, duration) {
    if (list.length == 0) return {
        notes: [],
        index: 0
    };
    // Define the left and right boundaries of the search interval
    let left = 0;
    let right = list.length - 1;

    // Use iterative method to implement binary search
    while (left <= right) {
        // Calculate the middle index
        const mid = Math.floor((left + right) / 2);

        // If the startTime of the middle element is less than or equal to startTime, search the right half
        if (list[mid].startTime <= startTime) {
            left = mid + 1;
        }
        // Otherwise, search the left half
        else {
            right = mid - 1;
        }
    }

    // Return the list of elements that meet the conditions
    const result = [];

    // The located position is the position of the first element whose startTime is greater than startTime
    let i = left;

    // Linear search to the right until startTime is greater than the current window
    while (i < list.length && list[i].startTime < startTime + duration) {
        result.push(list[i]);
        i++;
    }

    // Linear search to the left (for searching currently playing notes)
    i = left - 1;
    let stopTime = 0;
    let note;
    while (i >= 0) {
        note = list[i];
        // If the searched startTime is less than startTime-maxNoteDuration, ignore all previous notes
        if (startTime - note.startTime > maxNoteDuration) {
            break;
        }
        stopTime = getStopTime(note);
        if (stopTime >= startTime) result.push(note);
        i--;
    }

    return {
        notes: result,
        index: left
    };
}

function draw() {
    if (!waterfall.classList.contains('hidden')) {
        canvasCtx.globalCompositeOperation = 'copy';
        canvasCtx.fillStyle = "#ff000000";
        canvasCtx.fillRect(0, 0, canvas.width, canvas.height);
        canvasCtx.globalCompositeOperation = 'source-over';
        let playTime = player.currentTime();

        let scaling = canvas.height / settings.spanDuration;
        let noteCount = 0;
        let renderCount = 0;

        if (smfData != null) {
            // canvasCtx.shadowOffsetX = 0;
            // canvasCtx.shadowOffsetY = 0;
            // canvasCtx.shadowBlur = 12;
            for (let i = 0; i < 16; i++) {
                canvasCtx.fillStyle = palette[i];
                // canvasCtx.shadowColor = palette[i];
                let result = fastSpan(smfData.channels[i].notes, playTime, settings.spanDuration);
                noteCount += result.index;
                renderCount += result.notes.length;

                for (let note of result.notes) {
                    let stopTime = getStopTime(note);
                    let startY = (note.startTime - playTime) * scaling;
                    let endY = (stopTime - playTime) * scaling;
                    let x = note.pitch * noteWidth;

                    if (settings.noteTransparency) {
                        canvasCtx.fillStyle = palette[i] + getNoteTransparency(note.velocity);
                    }
                    canvasCtx.fillRect(x, canvas.height - endY - keyboardHeight, noteWidth, endY - startY);

                    // Pressed key
                    if (note.startTime < playTime) {
                        notes[note.pitch] = i;

                        // Highlight notes
                        if (settings.highlightNotes) {
                            canvasCtx.fillStyle = "#ffffff60";
                            canvasCtx.fillRect(x, canvas.height - endY - keyboardHeight, noteWidth, endY - startY);
                            canvasCtx.fillStyle = palette[i];
                        }
                    }
                }
            }
            
        // canvasCtx.shadowOffsetX = 0;
        // canvasCtx.shadowOffsetY = 0;
        // canvasCtx.shadowBlur = 0;
        // canvasCtx.shadowColor = "transparent";
        }

        // Draw white keys
        canvasCtx.fillStyle = 'white';
        canvasCtx.fillRect(0, canvas.height - keyboardHeight, canvas.width, keyboardHeight);

        canvasCtx.fillStyle = 'gray';
        for (let i = 0; i < 128; i++) {
            if (!isBlackKey(i)) {
                let x = getWhiteKeyNumber(i) * bwr;
                if (notes[i] != null) {
                    canvasCtx.fillStyle = palette[notes[i]];
                    canvasCtx.fillRect(noteWidth * x, canvas.height - keyboardHeight, noteWidth * bwr, keyboardHeight);
                    canvasCtx.fillStyle = 'gray';
                    notes[i] = null;
                }

                canvasCtx.fillRect(noteWidth * x, canvas.height - keyboardHeight, 1, keyboardHeight);   // Draw Seam
            }
        }

        // Draw black keys
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

        if (settings.prefmon) {
            let drawTime = performance.now();
            let frameTime = drawTime - lastDrawTime;

            lastDrawTime = drawTime;
            timeList.push(frameTime);
            if (timeList.length > 250) {
                timeList.shift();
            }

            let c = 0;
            let t = 0
            for (let i = timeList.length - 1; i > 0; i--) {
                t += timeList[i];
                c++;
                if (t > 1000) {
                    break;
                }
            }

            canvasCtx.fillStyle = '#00000080';
            canvasCtx.fillRect(0, 0, 260, 160);

            canvasCtx.fillStyle = "white";
            canvasCtx.font = "26px Sans-serif";
            canvasCtx.textAlign = "left";
            canvasCtx.textBaseline = "top";

            canvasCtx.fillText(`N: ${noteCount} R: ${renderCount}`, 0, 0);
            canvasCtx.fillText(`T: ${frameTime.toFixed(1)}  ${(c / t * 1000).toFixed(2)}fps`, 0, 26);


            canvasCtx.lineWidth = 1;
            canvasCtx.beginPath();
            canvasCtx.strokeStyle = "red";
            canvasCtx.moveTo(0, 150);
            canvasCtx.lineTo(250, 150);
            canvasCtx.stroke();

            canvasCtx.strokeStyle = "#ffffff80";
            for (let i = 0; i < 100; i += 20) {
                canvasCtx.beginPath();
                canvasCtx.moveTo(0, 150 - i);
                canvasCtx.lineTo(250, 150 - i);
                canvasCtx.stroke();
            }

            canvasCtx.lineWidth = 1.5;
            canvasCtx.strokeStyle = "white";
            canvasCtx.beginPath();
            canvasCtx.moveTo(0, 150 - frameTime);
            for (let i = 0; i < timeList.length; i++) {
                canvasCtx.lineTo(i, 150 - timeList[i]);
            }
            canvasCtx.stroke();
        }

        if (player.isPaused()) {
            endAnimation();
        } else {
            requestAnimationFrame(draw);
        }
    }
}

function resizeCanvas() {
    let { width: cssWidth, height: cssHeight } = canvas.getBoundingClientRect();
    canvas.width = dpr * cssWidth;
    canvas.height = dpr * cssHeight;

    noteWidth = canvas.width / 128;
    keyboardHeight = noteWidth * 9;
    blackKeyHeight = noteWidth * 5.5;
    startAnimation();
}
onresize = resizeCanvas;


let spanDurationEdit = $("#spanDuration");
spanDurationEdit.value = settings.spanDuration;
spanDurationEdit.addEventListener('change', e => {
    settings.spanDuration = parseFloat(spanDurationEdit.value);
    saveSettings();
});

let maxNoteDurationEdit = $("#maxNoteDuration");
maxNoteDurationEdit.value = settings.maxNoteDuration;
maxNoteDurationEdit.addEventListener('change', e => {
    settings.maxNoteDuration = parseFloat(maxNoteDurationEdit.value);
    saveSettings();
});

let noteTransparencyBtn = $("#noteTransparency");
updateChecker(noteTransparencyBtn, settings.noteTransparency);
noteTransparencyBtn.addEventListener('click', e => {
    settings.noteTransparency = !settings.noteTransparency;
    updateChecker(noteTransparencyBtn, settings.noteTransparency);
    saveSettings();
});

let highlightNotes = $("#highlightNotes");
updateChecker(highlightNotes, settings.highlightNotes);
highlightNotes.addEventListener('click', e => {
    settings.highlightNotes = !settings.highlightNotes;
    updateChecker(highlightNotes, settings.highlightNotes);
    saveSettings();
});

let prefmon = $("#prefmon");
updateChecker(prefmon, settings.prefmon);
prefmon.addEventListener('click', e => {
    settings.prefmon = !settings.prefmon;
    updateChecker(prefmon, settings.prefmon);
    saveSettings();
});