// IMONIT (I'm-On-It) Alerts - MAIN.JS
//==========================================
const electron = require('electron')
const app = require('electron').app
app.disableHardwareAcceleration()
const ipc = require('electron').ipcMain
const BrowserWindow = require('electron').BrowserWindow
const exec = require('child_process').exec
const shell = require('electron').shell
const fs = require('fs-extra')
const url = require('url')
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
var commonPath = cwd + bslash + 'app' + bslash + 'common'
var page = appPath + bslash + 'renderer.html'
var icon = cwd + bslash + appName + '.ico'
var preload = commonPath + bslash + appName + bslash + 'js' + bslash + 'preload.js'
//==========================================
// temp files
//==========================================
var pidFile = appChildTempPath + bslash + 'pid.txt'
var settingsFile = appChildTempPath + bslash + 'settings.json'
//==========================================
// data
//==========================================
var settings = {}
var appData = {}
var userData = {}
var ttData = {}
var alertsData = [{}]
var alertsResponseData = [{}]
var alertsResponseDataPrv = [{}]
//==========================================
// win
//==========================================
var win = null
var ssn, content
var x = 0
var y = 0
var width = 0
var height = 0
var minh = 0
var minw = 600
var maxh = 0
var maxw = 1200
var lsth = 400
var curh = 0
var curw = minw
//==========================================
// sw
//==========================================
var sw_block = false
var sw_errorExists = false
var sw_hideRequest = false
var sw_hasAlerts = false
var sw_hasChange = false
var status = ''
var statusp = ''
var swOne = false
//==========================================
// vars
//==========================================
var intw = 300
var idlw = 600
var dftw = 5
var dbw = 15
var rstw = 3600
var minutew = 60
var logLevel = 3
//==========================================
// start
//==========================================
log('main:START - ' + 'pid:' + pid + ', main pid=' + mainPID)

goNoGo().then(() => {
    mc.wait(dftw).then(() => {
        getSettings().then(() => {
            mc.wait(dftw).then(() => {
                if (sw_block == false) {
                    mainController()
                } else {
                    log('sw_block on...')
                }
            })
        })
    })
})
//==========================================
// main controller
//==========================================
function mainController() {
    log('main:mainController()')
    mc.getUserStatus().then((us) => {
        mc.wait(dftw).then(() => {
            status = us
            if (status!=statusp){
                statusp=status
                log('===( ' + status + ' )===')
            }
            if (sw_block == true || sw_hideRequest == true || status == 'idle') {  // sw_monitor_active == false || sw_user_active == false
                // if we are in the middle of a relaunch or if the user is not active - no need to check
                // also - if there was a hide request (user clicked line button or snooze), the app will be relaunched when it needs to be
                log('main:blocked/hidden/idle')
            } else {
                // see decision table at the bottom about when to show window
                sw_hasAlerts = false
                sw_hasChange = false
                let dbParms = {
                    server: settings.server,
                    port: settings.port,
                    key: 'alertData',
                    parms: {
                        userId: userId,
                        appId: appId
                    }
                }
                //log(dbParms)
                mc.db(dbParms).then((res) => {
                    mc.wait(dbw).then(() => {
                        if (res.rc == 'ok') {
                            log('alerts db operation succeeded')
                            alertsData = JSON.parse(JSON.stringify(res.data.alertsData))
                            //log(alertsData)
                            alertsResponseData = JSON.parse(JSON.stringify(res.data.alertsResponseData))
                            //log(alertsData)
                            let lenCur = alertsResponseData.length
                            let lenPrv = alertsResponseDataPrv.length
                            // set sw_hasAlerts if there are alerts to be displayed
                            let len = alertsResponseData.length
                            for (i = 0; i < len; i++) {
                                if (alertsResponseData[i].returnCode == '1' && alertsResponseData[i].messageValue > alertsData[i].limit) {
                                    sw_hasAlerts = true
                                    break
                                }
                            }
                            // set sw_hasChange if there has been a change in the alerts (in current/previous content or amount)
                            if ((lenCur != lenPrv) ||
                                (JSON.stringify(alertsResponseData) != JSON.stringify(alertsResponseDataPrv))) {
                                sw_hasChange = true
                            }
                            // save to previous
                            alertsResponseDataPrv = alertsResponseData
                            // 3 possibilities - see decision table at the bottom - anything else - skip/wait another round
                            if (sw_hasAlerts && sw_hasChange && win) {
                                closeApp().then(() => { // used to be relaunch()
                                })
                            } else {
                                //if (sw_hasAlerts && sw_hasChange && !win) {
                                if (!win) {
                                    openWindow().then(() => {
                                    })
                                } else {
                                    if (!sw_hasAlerts && sw_hasChange && win) {
                                        hideWindow().then(() => {
                                        })
                                    }
                                }
                            }
                        } else {
                            log('alerts db operation failed - continuing')
                        }
                    })
                })
            }
            mc.wait(intw).then(() => { // 5 minutes
                return mainController()
            })
        })
    })
}

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
                        alwaysOnTop: true,
                        icon: icon,
                        frame: false,
                        autoHideMenuBar: true,
                        fullscreen: false,
                        hasShadow: true,
                        x: x,
                        y: y,
                        height: height,
                        width: width,
                        show: false,
                        movable: true,
                        closable: false,
                        minimizable: false,
                        resizable: false,
                        webPreferences: getWP()
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
                            event.preventDefault()
                        }
                    })
                    win.once('ready-to-show', () => {
                        log('main:openWindow() => win.once(`ready-to-show` ==> showWindow()')
                        if (sw_hasAlerts && sw_hasChange) {
                            showWindow().then(() => {
                            })
                        }
                    })
                    win.on('closed', (event) => {
                        log('main:openWindow() => win.on(`closed`)')
                        if (!sw_block) {
                            event.preventDefault()
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
                        event.preventDefault()
                    })
                    win.on('unresponsive', (event) => {
                        log('main:openWindow() => win.on(`unresponsive`)')
                        event.preventDefault()
                    })
                    win.loadURL(url.format({
                        pathname: page,
                        protocol: 'file:',
                        slashes: true
                    }))
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
                log(err)
                resolve()
            }
        }
    })
}

function hideWindow() {
    return new Promise((resolve) => {
        log('main:hideWindow()')
        if (sw_block) {
            resolve()
        } else {
            try {
                win.hide()
                resolve()
            } catch (err) {
                log(err)
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

function maxWindow() {
    return new Promise((resolve) => {
        log('main:maxWindow()')
        if (sw_block) {
            resolve()
        } else {
            curw = maxw
            setSize(curw, curh).then(() => {
                setWin(curw, curh).then(() => {
                    resolve()
                })
            })
        }
    })
}

function lstWindow() {
    return new Promise((resolve) => {
        log('main:lstWindow()')
        if (sw_block) {
            resolve()
        } else {
            curh = lsth
            setSize(curw, curh).then(() => {
                setWin(curw, curh).then(() => {
                    resolve()
                })
            })
        }
    })
}

function clsWindow() {
    return new Promise((resolve) => {
        log('main:clsWindow()')
        if (sw_block) {
            resolve()
        } else {
            curh = minh
            setSize(curw, curh).then(() => {
                setWin(curw, curh).then(() => {
                    resolve()
                })
            })
        }
    })
}

function rstWindow() {
    return new Promise((resolve) => {
        log('main:rstWindow()')
        if (sw_block) {
            resolve()
        } else {
            curw = minw
            setSize(curw, curh).then(() => {
                setWin(curw, curh).then(() => {
                    resolve()
                })
            })
        }
    })
}

function setSize(curw, curh) {
    return new Promise((resolve) => {
        log('main:setSize()')
        const screen = electron.screen
        let screenInfo = screen.getPrimaryDisplay()
        let dimensions = screenInfo.size
        x = dimensions.width - curw
        y = dimensions.height - curh
        width = curw
        height = curh
        y = y - 50
        resolve()
    })
}

function setWin(curw, curh) {
    return new Promise((resolve) => {
        if (sw_block) {
            resolve()
        } else {
            log('main:setWin()')
            win.setMaximumSize(curw, curh)
            win.setMinimumSize(minw, minh)
            win.setPosition(x, y)
            win.setSize(curw, curh)
            resolve()
        }
    })
}

function rstPos() {
    return new Promise((resolve) => {
        log('main:rstPos()')
        win.setPosition(x, y)
        win.setSize(curw, curh)
        resolve()
    })
}

//==========================================
// app
//==========================================
// app.on('ready', ready)
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
// render-process-gone replaces renderer-process-crashed
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
    log(JSON.stringify(err))
})
//==========================================
// ipc
//==========================================
ipc.on('IMONIT_close-reopen', function (event, arg) {
// when the user moves the window outside of visual range, snooze is over, etc., we will relaunch the app
    log('main:ipc.on(`' + 'IMONIT_close-reopen' + '`) => relaunch')
    closeApp().then(() => { // used to be relaunch()
    })
})
ipc.on('IMONIT_openURL', function (event, arg) {
    log('main:ipc.on(`' + 'IMONIT_openURL' + '`) => shell.openExternal')
    let i = parseInt(arg.btn);
    let url = ''
    if (alertsResponseData[i].buttonUrl != '') {
        url = alertsResponseData[i].buttonUrl
    } else {
        url = alertsData[i].winButtonAction1
    }
    shell.openExternal(url)
})
ipc.on('IMONIT_log', function (event, arg) { // logs coming in from rendered window
    log(arg)
})
ipc.on('IMONIT_show', function (event, arg) {
    log('main:ipc.on(`' + 'IMONIT_show' + '`)')
    showWindow().then(() => {
    })
})
ipc.on('IMONIT_hide', function (event, arg) {
    log('main:ipc.on(`' + 'IMONIT_hide' + '`)')
    hideWindow().then(() => {
        // the user requested to hide the window by clicking a line button or snooze
        // this switch will block any other show/hide window so that the app can be relaunched at the end of those periods
        sw_hideRequest = true
    })
})
ipc.on('IMONIT_minimize', function (event, arg) {
    log('main:ipc.on(`' + 'IMONIT_minimize' + '`)')
    minWindow().then(() => {
    })
})
ipc.on('IMONIT_maximize', function (event, arg) {
    log('main:ipc.on(`' + 'IMONIT_maximize' + '`)')
    maxWindow().then(() => {
    })
})
ipc.on('IMONIT_restore', function (event, arg) {
    log('main:ipc.on(`' + 'IMONIT_restore' + '`)')
    rstWindow().then(() => {
    })
})
ipc.on('IMONIT_open_list', function (event, arg) {
    log('main:ipc.on(`' + 'IMONIT_open_list' + '`)')
    lstWindow().then(() => {
    })
})
ipc.on('IMONIT_close_list', function (event, arg) {
    log('main:ipc.on(`' + 'IMONIT_close_list' + '`)')
    clsWindow().then(() => {
    })
})
ipc.on('IMONIT_restore_pos', function (event, arg) {
    log('main:ipc.on(`' + 'IMONIT_restore_pos' + '`)')
    rstPos().then(() => {
    })
})
//==========================================
// app specific requests
//==========================================
ipc.on('IMONIT_get-res', (event, arg) => { // send count back to renderer.js
    log('main:ipc.on(`' + 'IMONIT_get-res' + '`)')
    let response = {
        ttData: ttData,
        appData: appData,
        alertsResponseData: alertsResponseData,
        alertsData: alertsData,
        x: x,
        y: y,
        key: 'db',
        val: 'OK',
        lang: settings.lang,
        dir: settings.dir
    }
    event.sender.send('IMONIT_get-res', response)
})
//==========================================
// once
//==========================================
function getSettings() {
    return new Promise((resolve) => {
        log('main:getSettings()')
        fs.readFile(settingsFile, 'utf8', (err, data) => {
            mc.wait(dftw).then(() => {
                if (err) {
                    log(err)
                    log('getSettings failed')
                    sw_errorExists = true
                    closeApp().then(() => {
                    })
                } else {
                    settings = JSON.parse(data)
                    minh = settings.initialHeight
                    maxh = settings.initialHeight
                    curh = settings.initialHeight
                    let dbParms = {
                        server: settings.server,
                        port: settings.port,
                        key: 'getAlerts',
                        parms: {
                            userId: userId,
                            appId: appId
                        }
                    }
                    //log(dbParms)
                    mc.db(dbParms).then((res) => {
                        mc.wait(dbw).then(() => {
                            if (res.rc == 'ok') {
                                log('db operation succeeded')
                                ttData = JSON.parse(JSON.stringify(res.data.ttData))
                                userData = JSON.parse(JSON.stringify(res.data.userData[0]))
                                logLevel = userData.logLevel
                                appData = JSON.parse(JSON.stringify(res.data.appData[0]))
                                resolve()
                            } else {
                                log('db operation failed')
                                sw_errorExists = true
                                closeApp().then(() => {
                                })
                            }
                        })
                    })
                }
            })
        })
        // resolve()
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

function getWP() {
    return {
        allowRunningInsecureContent: false,
        //contextIsolation: true,
        disableBlinkFeatures: 'Auxclick',
        enableRemoteModule: false,
        experimentalCanvasFeatures: false,
        experimentalFeatures: false,
        nativeWindowOpen: true,
        navigateOnDragDrop: false,
        nodeIntegration: false,
        nodeIntegrationInWorker: false,
        preload: preload,
        sandbox: false,
        webSecurity: true,
        webviewTag: false
    }
}

// checks goNoGo every minute
function checkGNG() {
    goNoGo().then(() => { // if we decide to shut down. we will not be resolving back here anyway
        mc.wait(minutew).then(() => {
            if (win) {
                win.webPreferences = getWP() // this is to ensure that the secure webpreferences are not hacked
            }
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
                                    log('new instance - setting pid file to ' + pid)
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
mc.wait(minutew).then(() => {
    checkGNG()
})

// in any case set automatic restart every 3 hours
mc.wait(rstw).then(() => {
    closeApp().then(() => {
    })
})
