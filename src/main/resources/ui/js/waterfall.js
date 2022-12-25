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

// Entrance to waterfall
controlsLeft.addEventListener('click', e => {
    if (waterfall.classList.contains('hidden')) {
        waterfall.classList.remove('hidden');
    } else {
        waterfall.classList.add('hidden');
    }
    resizeCanvas();
});


function draw() {
    requestAnimationFrame(draw);
    if (smfData != null && !waterfall.classList.contains('hidden')) {
        canvasCtx.fillStyle = fillColor;
        canvasCtx.fillRect(0, 0, canvas.width, canvas.height);
        let playTime = player.currentTime();

        for (let i = 0; i < 16; i++) {
            canvasCtx.fillStyle = palette[i];
            for (let note of smfData.channels[i].notes.filter(item =>
                (item.startTime >= playTime && item.startTime <= playTime + spanDuration) || (item.startTime < playTime && item.stopTime > playTime)
            )) {
                let startY = (note.startTime - playTime) / spanDuration * canvas.height;
                let endY = (note.stopTime - playTime) / spanDuration * canvas.height;
                let width = canvas.width / 128;
                let x = note.pitch * width;

                canvasCtx.fillRect(x, canvas.height - endY, width, endY - startY)
            }
        }
    }
}
requestAnimationFrame(draw);

function resizeCanvas() {
    let { width: cssWidth, height: cssHeight } = canvas.getBoundingClientRect();
    canvas.width = dpr * cssWidth;
    canvas.height =  dpr * cssHeight;
}
onresize = resizeCanvas;