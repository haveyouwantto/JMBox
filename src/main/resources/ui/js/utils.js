function $(e, parent = document) {
    if (e instanceof HTMLElement) return e;
    if (e.startsWith("#")) return document.getElementById(e.slice(1));
    let l = parent.querySelectorAll(e);
    if (l.length == 1) return l[0];
    else return l;
}


function padding(num) {
    if (isNaN(num) || !isFinite(num)) {
        return '**';
    }
    if (num < 10) {
        return '0' + num;
    }
    else {
        return num;
    }
}

function formatTime(seconds) {
    if (isNaN(seconds) || !isFinite(seconds)) return "**:**";

    let sec = parseInt(seconds % 60);
    let minutes = seconds / 60;
    let min = parseInt(minutes % 60);
    if (minutes < 60) {
        return padding(min) + ':' + padding(sec);
    } else {
        let hours = minutes / 60;
        return padding(parseInt(hours)) + ':' + padding(min) + ':' + padding(sec);
    }
}

/**
 * Get a SI formatted string.
 * @param {number} n The number to convert.
 * @param {boolean} bin Use base 1024 instead of 1000.
 */
function toSI(n, bin = false) {
    let suffix = ['', 'K', 'M', 'G', 'T', 'P', 'E', 'Z', 'Y'];
    let base = bin ? 1024 : 1000;
    if (n < base) return parseInt(n) + " ";
    for (let i in suffix) {
        if (n < base) {
            return bin ? n.toFixed(2) + " " + suffix[i] : n.toFixed(2) + " " + suffix[i];
        }
        n /= base;
    }
    return (n * base).toLocaleString() + " " + suffix[suffix.length - 1];
}


/**
 * Update a checker
 * @param {HTMLElement} parent 
 * @param {boolean} value 
 */
function updateChecker(parent, value) {
    let checker = $('icon[checker]', parent);
    let isRadio = checker.classList.contains("radio");

    if (value) {
        checker.classList.add('icon-checked');
        checker.innerText = isRadio ? '\ue01c' : '\ue013';
    } else {
        checker.classList.remove('icon-checked');
        checker.innerText = isRadio ? '\ue01b' : '\ue012';
    }
}

/** File sorting functions */
function sortName(a, b) {
    // Directories first
    if (a.isDir && !b.isDir) {
        return -1;
    } else if (!a.isDir && b.isDir) {
        return 1;
    }
    return a.name.localeCompare(b.name);
}

function sortSize(a, b) {
    if (a.isDir && !b.isDir) {
        return -1;
    } else if (!a.isDir && b.isDir) {
        return 1;
    } else if (a.isDir && b.isDir) {
        return a.name.localeCompare(b.name);
    }
    return a.size - b.size;
}

function sortMtime(a, b) {
    if (a.isDir && !b.isDir) {
        return -1;
    } else if (!a.isDir && b.isDir) {
        return 1;
    }
    return a.date - b.date;
}