// IMONIT (I'm-On-It) common/js - RENDERER-UTILS.JS
//==========================================
// renderer-utils.js is common code that is included
// at the bottom of every renderer.html
//==========================================
var editable = {
    keys: ["F1", "F2", "F3", "F4", "F5", "F6", "F7", "F8", "F9", "F10", "F11", "F12", "F13", "F14", "F15", "F16", "F17", "F18", "F19", "F20", "F21", "F22", "F23", "F24", "PrintScreen", "ScrollLock", "Pause", "Tab", "xCapsLock", "xShift", "xControl", "xMeta", "Alt", "ContextMenu", "xArrowLeft", "xArrowRight", "ArrowUp", "ArrowDown", "Enter", "xBackspace", "xClear", "xNumLock", "xInsert", "xHome", "PageUp", "PageDown", "xEnd", "xDelete"],
    vals: [8, 9, 13, 27, 35, 36, 37, 38, 39, 40, 46, 110, 190]
}
var keys = ["F1", "F2", "F3", "F4", "F5", "F6", "F7", "F8", "F9", "F10", "F11", "F12", "F13", "F14", "F15", "F16", "F17", "F18", "F19", "F20", "F21", "F22", "F23", "F24", "PrintScreen", "ScrollLock", "Pause", "Tab", "CapsLock", "Shift", "Control", "Meta", "Alt", "ContextMenu", "ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Enter", "Backspace", "Clear", "NumLock", "Insert", "Home", "PageUp", "PageDown", "End", "Delete"]
var vals = []
//==========================================
init()

function init() {
    wait(1).then(() => {
        if (sw_editable) {
            keys = editable.keys
            vals = editable.vals
        }
    })
}

function log(msg) {
    window.IMONIT_sendMessage('IMONIT_log', msg)
}

function wait(sec) {
    let ms = sec * 1000
    if (sec > 5) {
        log('renderer:waiting ' + sec + ' seconds...')
    }
    return new Promise((resolve) => {
            setTimeout(() => resolve(), ms)
        }
    )
}

// neutralize right click
document.oncontextmenu = function (event) {
    event.preventDefault();
    return false;
}
// neutralize keys such as alt-f4
document.addEventListener('keydown', function (event) {
    if (event.defaultPrevented) {
        return
    }
    return checkKey(event)
})

function checkKey(event) { // block keyboard events such as alt-f4 which could close the window
    let key = event.key || event.keyCode;
    let val = parseInt(key, 10);
// if fields are editable then allow ctrl-a/c/v/z etc
    if (sw_editable) {
        if (((event.ctrlKey || event.metaKey || event.shiftKey) &&
            (event.keyCode == 67 || event.keyCode == 86 || event.keyCode == 88 || event.keyCode == 90)) ||
            vals.includes(val)) {
            return true
        }
    } else {
        if (typeof val == 'number') {
            event.preventDefault()
            return false
        }
    }
// do not allow any other ctrl/alt etc
    if (keys.includes(key) ||
        event.altKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.metaKey ||
        event.repeat) {
        log('checkKey() => blocking keyboard event=' + key)
        event.preventDefault()
        return false
    } else {
        return true
    }
}

function getDate() {
    let dt = new Date();
    let dd = ("0" + dt.getDate()).slice(-2);
    let mm = ("0" + (dt.getMonth() + 1)).slice(-2);
    let yy = dt.getFullYear();
    let hh = ("0" + dt.getHours()).slice(-2);
    let mn = ("0" + dt.getMinutes()).slice(-2);
    let ss = ("0" + dt.getSeconds()).slice(-2);
    let date_time = yy + "-" + mm + "-" + dd + " " + hh + ":" + mn + ":" + ss;
    let date = yy + "-" + mm + "-" + dd;
    let time = hh + ":" + mn + ":" + ss;
    let pod = 'evening'
    if (hh >= 4 && hh <= 11) {
        pod = 'morning'
    }
    if (hh >= 12 && hh <= 17) {
        pod = 'afternoon'
    }
    let jdate = {
        dd: dd,
        mm: mm,
        yy: yy,
        hh: hh,
        mn: mn,
        ss: ss,
        date_time: date_time,
        date: date,
        time: time,
        pod:pod
    }
    return (jdate);
}

function getTT(table, key) {
    let ttl = ttData.length
    for (let tti = 0; tti < ttl; tti++) {
        let obj = ttData[tti];
        if ((obj.table == table) && (obj.key == key)) {
            let val = obj.val.toString().trim()
            return val
        }
    }
}

function doNothing() {
}
