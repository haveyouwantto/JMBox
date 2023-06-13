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
    if (n == null) return "Unknown "
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

function extractLyrics(midiData, encoding = "UTF-8") {
    const decoder = new TextDecoder(encoding);
    const lyrics = [];

    for (const message of midiData.messages) {
        const smfPtr = message.smfPtr;
        const smfPtrLen = message.smfPtrLen;

        if (smfPtrLen > 0) {
            const a = midiData.smfData[smfPtr], b = midiData.smfData[smfPtr + 1];
            if (a == 0xff && [1, 5].includes(b)) {
                const len = midiData.smfData[smfPtr + 2];
                let textBytes = midiData.smfData.slice(smfPtr + 3, smfPtr + 3 + len);
                lyrics.push({ "time": message.time, "tick": message.tick, "bytes": textBytes, "text": decoder.decode(textBytes).replace(/\x00/g, '') });
            }
        }
    }
    return lyrics;
}



class LrcDisplayer {
    constructor() {
        this.lyrics = [];
        this.index = 0;
        this.onload = null;
        this.onlyrics = null;
        this.onseek = null;
    }

    load(midiData, encoding = "UTF-8") {
        this.lyrics = extractLyrics(midiData, encoding);
        this.index = 0;
        if (this.onload != null) {
            this.onload();
        }
    }

    update(t) {
        if (this.lyrics.length > 0) {
            while (true) {
                let lrc = this.lyrics[this.index];
                if (lrc == null || lrc.time > t) {
                    break;
                } else {
                    this.index++;
                    if (this.onlyrics != null) {
                        this.onlyrics(lrc.text);
                    }
                }
            }
        }
    }

    seek(t) {
        if (this.lyrics.length > 0) {
            let arr = [];
            let i = 0;
            while (true) {
                let lrc = this.lyrics[i];
                if (lrc == null || lrc.time > t) {
                    if (this.onseek != null) {
                        this.onseek(arr.join(''));
                    }
                    this.index = i;
                    break;
                } else {
                    i++;
                    arr.push(lrc.text);
                }
            }
        }
    }

    clear() {
        this.index = 0;
        this.lyrics = [];
    }
}