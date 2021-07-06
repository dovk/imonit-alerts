// IMONIT (I'm-On-It) common/js - PRELOAD.JS
//==========================================
// see references
// https://electronjs.org/docs/tutorial/security
// https://github.com/dovk/electron-security-example
// ipc is the only module allowed in preload.js, which serves
// as the only outlet of communication for the rendered page,
// and the only means of communication between the main and rendered pages
// communication between the two are via ipc messaging only
// messages are sent by the rendered page and forwarded to run.js for processing
// responses from run.js are sent back to preload.js and exposed to the rendered page as window global variables
// preload will also serve as memcache so that the rendered page can synchronize certain events
const ipc = require('electron').ipcRenderer;
window.IMONIT_sendMessage = IMONIT_sendMessage;
window.IMONIT_recieveMessage = IMONIT_recieveMessage;
window.IMONIT_cache_put = IMONIT_cache_put;
window.IMONIT_cache_get = IMONIT_cache_get;
window.IMONIT_cache = {}
//========================================
// functions that will be used by renderer.js
// each function has a basic name filter/whitelisting
//========================================
function IMONIT_sendMessage(msg, msgParms) {
    let arr = msg.split('_')
    if (arr[0] == 'IMONIT') {
        return ipc.send(msg, msgParms);
    }
}

function IMONIT_recieveMessage(key) {
    let arr = key.split('_')
    if (arr[0] == 'IMONIT') {
        return ipc.on(key, (event, arg) => {
            window.IMONIT_cache[arg.key] = arg.val
            window.IMONIT_arg = arg
        })
    }
}

function IMONIT_cache_put(key, val) {
    window.IMONIT_cache[key] = val
}

function IMONIT_cache_get(key) {
    if (window.IMONIT_cache[key]) {
        return window.IMONIT_cache[key]
    } else {
        return '*'
    }
}
