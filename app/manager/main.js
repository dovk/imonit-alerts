// IMONIT (I'm-On-It) Manager - MAIN.JS
//==========================================
const electron = require('electron')
const app = require('electron').app
app.disableHardwareAcceleration()
const BrowserWindow = require('electron').BrowserWindow
const exec = require('child_process').exec
const shell = require('electron').shell
const fs = require('fs-extra')
const cache = require('v8-compile-cache');
//==========================================
// app specific modules
//==========================================
const mc = require('../common/imonit/js/mc.js');
//==========================================
// get user, system stuff
//==========================================
var cwd = process.cwd()
var argv = process.argv
var pid = process.pid
var appId = argv[2]
var mainPID = argv[3]
var appName = argv[4]
var userId = argv[5]
var bslash = '\\'
//==========================================
// path and resources
//==========================================
var appTempPath = 'C:\\Users\\Public\\Temp\\' + appName
if (!fs.existsSync(appTempPath)) {
    fs.mkdirSync(appTempPath, {recursive: true})
}
//==========================================
var appChildTempPath = appTempPath + bslash + appId
if (!fs.existsSync(appChildTempPath)) {
    fs.mkdirSync(appChildTempPath, {recursive: true})
}
//==========================================
var appPath = cwd + bslash + 'app' + bslash + appId
if (!fs.existsSync(appPath)) {
    fs.mkdirSync(appPath, {recursive: true})
}
//==========================================
var icon = cwd + bslash + appName + '.ico'
//==========================================
// temp files
//==========================================
var pidFile = appChildTempPath + bslash + 'pid.txt'
var settingsFile = appChildTempPath + bslash + 'settings.json'
//==========================================
// data
//==========================================
var settings = {}
var webPrefix = '3'
//==========================================
// win
//==========================================
var win = null
var ssn, content
var x = -1
var y = -1
var width = 0
var height = 0
var minh = 0
var maxh = 0
var lsth = 400
var curh = 1
var curw = 1
//==========================================
// sw
//==========================================
var sw_block = false
var sw_errorExists = false
//==========================================
// vars
//==========================================
var dftw = 5
var dbw = 15
var rstw = 3600
var intw = 60
var logLevel = 3
//==========================================
// start
//==========================================
log('main:START - ' + 'pid:' + pid + ', main pid=' + mainPID)
// this runs only once and opens a web browser
goNoGo().then(() => {
    mc.wait(dftw).then(() => {
        getSettings().then(() => {
            mc.wait(dftw).then(() => {
                if (sw_errorExists) {
                    closeApp().then(() => {
                    })
                } else {
                    if (!sw_block) {
                        openWindow().then(() => {
                            setWin(curw, curh).then(() => {
                            })
                        })
                    }
                }
            })
        })
    })
})
//==========================================
// electron window functions
//==========================================
function openWindow() {
    return new Promise((resolve) => {
        log('main:openWindow()')
        if (sw_block) {
            resolve()
        } else {
            if (!win) { //don't open if it is already open
                // we need setSize() to make sure the window appears in the bottom right in all resolutions
                setSize(curw, curh).then(() => {
                    win = new BrowserWindow({
                        alwaysOnTop: false,
                        icon: icon,
                        // frame: false,
                        autoHideMenuBar: true,
                        // fullscreen: false,
                        hasShadow: true,
                        x: x,
                        y: y,
                        height: height,
                        width: width,
                        show: false,
                        movable: true,
                        closable: true,
                        minimizable: true,
                        resizable: true
                    })
                    content = win.webContents
                    content.on('render-process-gone', (event) => {
                        log('main:openWindow() => content.on(`render-process-gone`)')
                        if (!sw_block) {
                            event.preventDefault()
                            closeApp().then(() => {
                            })
                        }
                    })
                    content.on('destroyed', (event) => {
                        log('main:openWindow() => content.on(`destroyed`)')
                        if (!sw_block) {
                            event.preventDefault()
                            closeApp().then(() => {
                            })
                        }
                    })
                    content.clearHistory()
                    if (logLevel == 2) {// the whole logs now appears under main, we don't need this for console any more
                        content.openDevTools({mode: 'detach'})
                    }
                    ssn = content.session
                    ssn.clearCache(function () {
                    })
                    //ssn.clearStorageData()
                    win.on('close', (event) => {
                        log('main:openWindow() => win.on(`close`) preventDefault')
                        if (!sw_block) {
                            closeApp().then(() => {
                            })
                        }
                    })
                    win.once('ready-to-show', () => {
                        log('main:openWindow() => win.once(`ready-to-show` ==> showWindow()')
                        showWindow().then(() => {
                            minWindow().then(() => {
                            })
                        })
                    })
                    win.on('closed', (event) => {
                        log('main:openWindow() => win.on(`closed`)')
                        if (!sw_block) {
                            closeApp().then(() => {
                            })
                        } else {
                            win = null
                        }
                    })
                    win.on('minimize', function (event) {
                        log('main:openWindow() => win.on(`minimize`) ')
                    });
                    win.on('restore', (event) => {
                        log('main:openWindow() => win.on(`restore`) ')
                        curh = 800
                        curw = 1200
                        setSize(curw, curh).then(() => {
                            setWin(curw, curh).then(() => {
                            })
                        })
                    })
                    win.on('unresponsive', (event) => {
                        log('main:openWindow() => win.on(`unresponsive`)')
                        event.preventDefault()
                    })
                    win.loadURL(settings.server + ':' + webPrefix + settings.port + '?u=' + userId)
                    resolve()
                })
            } else {
                log('main:openWindow() => win exists, no need to create')
                resolve()
            }
            resolve()
        }
    })
}

function showWindow() {
    return new Promise((resolve) => {
        log('main:showWindow()')
        if (sw_block) {
            resolve()
        } else {
            try {
                win.show()
                resolve()
            } catch (err) {
                log(JSON.stringify(err))
                resolve()
            }
        }
    })
}

function minWindow() {
    return new Promise((resolve) => {
        log('main:minWindow()')
        if (sw_block) {
            resolve()
        } else {
            try {
                win.minimize()
                resolve()
            } catch (err) {
                log(err)
                resolve()
            }
        }
    })
}

function setSize(curw, curh) {
    return new Promise((resolve) => {
        log('main:setSize()')
        if (curw == 1 && curh == 1) { // because first time is minimized
            resolve()
        }
        const screen = electron.screen
        let screenInfo = screen.getPrimaryDisplay()
        let dimensions = screenInfo.size
        x = dimensions.width - curw
        y = dimensions.height - curh
        width = curw
        height = curh
        y = 25
        resolve()
    })
}

function setWin(curw, curh) {
    return new Promise((resolve) => {
        if (sw_block) {
            resolve()
        } else {
            log('main:setWin()')
            // win.setMaximumSize(curw, curh)
            // win.setMinimumSize(minw, minh)
            win.setPosition(x, y)
            win.setSize(curw, curh)
            resolve()
        }
    })
}

//==========================================
// app
//==========================================
app.on('window-all-closed', function () { // if window has been closed, we set it off so that init()/callServices() will reopen
    log('main:app.on(`window-all-closed`')
    if (!sw_block) {
        closeApp().then(() => {
        })
    }
})
//==========================================
// additional security
//==========================================
app.on('web-contents-created', (event, win) => {
    win.on('will-attach-webview', (event, webPreferences, params) => {
        log('main:app.on(`will-attach-webview`')
        event.preventDefault();
    })
})
app.on('web-contents-created', (event, contents) => {
    contents.on('new-window', (event, navigationUrl) => {
        log('main:app.on(`new-window`')
        event.preventDefault()
        shell.openExternal(navigationUrl)
    })
})
app.on('gpu-process-crashed', (event, contents) => {
    log('main:app.on(`gpu-process-crashed` => nothing now')
    if (!sw_block) {
        event.preventDefault()
        closeApp().then(() => {
        })
    }
})
app.on('render-process-gone', (event, contents) => {
    log('main:app.on(`render-process-gone` => nothing now')
    if (!sw_block) {
        event.preventDefault()
        closeApp().then(() => {
        })
    }
})
process.on('uncaughtException', function (err) {
    log('main:process.on(`uncaughtException` => displaying err')
    log(err)
})
//==========================================
// once
//==========================================
function getSettings() {
    return new Promise((resolve) => {
        log('main:getSettings()')
        sw_errorExists = false
        fs.readFile(settingsFile, 'utf8', (err, data) => {
            mc.wait(dftw).then(() => {
                if (err) {
                    sw_errorExists = true
                    log(err)
                    resolve()
                } else {
                    settings = JSON.parse(data)
                    minh = settings.initialHeight
                    maxh = settings.initialHeight
                    curh = settings.initialHeight
                    resolve()
                }
            })
        })
    })
}

//==========================================
// utils
//==========================================
function log(msg) {
    if (logLevel > 0) {
        let logParms = {
            logLevel: logLevel,
            appId: appId,
            userId: userId,
            msg: msg,
            pid: pid
        }
        mc.log(logParms).then((res) => {
        })
    }
}

// checks goNoGo every minute
function checkGNG() {
    goNoGo().then(() => { // if we decide to shut down. we will not be resolving back here anyway
        mc.wait(intw).then(() => {
            return (checkGNG())
        })
    })
}

// checks if the main pid is up - if not, then shutdown
// for this purpose we will not be using app.requestSingleInstanceLock() or check existing windows titles
// if main pid is up, check if this app pid is the set pid. if not, shutdown
// if there is no set pid, then create it
// note that if we decide to closeApp() then we do not resolve() from here but let the app shut down
function goNoGo() {
    log('goNoGo()')
    return new Promise((resolve) => {
        exec('tasklist', function (err, stdout, stderr) {
            mc.wait(dftw).then(() => {
                let str = ''
                if (stdout) {
                    str = stdout.toString()
                }
                let reg = /\s/g
                let tasklist = str.replace(reg, '')
                let px = mainPID.toString().trim()
                lookFor = 'imonit.exe' + px
                //searching for app file pid in tasklist
                log('looking for ' + px)
                if (!(tasklist.includes(lookFor.trim()))) {
                    log('main is down - shutting down')
                    closeApp().then(() => {
                        // no resolve()
                    })
                } else {
                    //main is up, getting pid file
                    mc.get(pidFile).then((p) => {
                        if (p == null) {
                            //pid file null - setting pid file
                            mc.set(pidFile, pid).then(() => {
                                //pid file set
                                resolve()
                            })
                        } else {
                            if (p.toString().trim() != pid.toString().trim()) {
                                let px = p.toString().trim()
                                lookFor = 'imonit.exe' + px
                                //searching for app file pid in tasklist
                                log('looking for ' + px)
                                if (tasklist.includes(lookFor)) {
                                    log('instance already exists - shutting down')
                                    closeApp().then(() => {
                                        // no resolve()
                                    })
                                } else {
                                    log('new instance - setting pid file to ' + px)
                                    mc.set(pidFile, pid).then(() => {
                                        //pid file set
                                        resolve()
                                    })
                                }
                            } else {
                                log('gng ok')
                                resolve()
                            }
                        }
                    })
                }
            })
        })
    })
}

// we do not resolve() if we are actually shutting down, there's no need to continue from here
function closeApp() {
    log('closeApp():shutdown')
    return new Promise((resolve) => {
        sw_block = true
        if (win) {
            try {
                log('*close')
                win.close()
                exitQuit().then(() => {
                    // no resolve()
                })
            } catch (err) {
                log(err)
                exitQuit().then(() => {
                    // no resolve()
                })
            }
        } else {
            exitQuit().then(() => {
                // no resolve()
            })
        }
    })
}

function exitQuit() {
    return new Promise((resolve) => {
        try {
            log('*quit')
            app.quit()
            try {
                log('*exit')
                app.exit(0)
            } catch (err) {
                log(err)
                resolve()
            }
        } catch (err) {
            log(err)
            resolve()
        }
    })
}

//set automatic restart check every minute
mc.wait(intw).then(() => {
    checkGNG()
})

// in any case set automatic restart every 3 hours
mc.wait(rstw).then(() => {
    closeApp().then(() => {
    })
})
