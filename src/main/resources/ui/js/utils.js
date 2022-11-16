
function padding(num) {
    if (isNaN(num)) {
        return '--';
    }
    if (num < 10) {
        return '0' + num;
    }
    else {
        return num;
    }
}

function formatTime(seconds) {
    let sec = parseInt(seconds % 60);
    let minutes = seconds / 60;
    let min = parseInt(minutes % 60);
    return padding(min) + ':' + padding(sec);
}