// IMONIT (I'm-On-It) Tasks - MAIN.JS
//==========================================
const electron = require('electron')
const app = require('electron').app
app.disableHardwareAcceleration()
const exec = require('child_process').exec
const fs = require('fs-extra')
const cache = require('v8-compile-cache');
//==========================================
// app specific modules
//==========================================
const mc = require('../common/imonit/js/mc.js');
const activeWindows = require('active-windows')
//==========================================
// get user, system stuff
//==========================================
const os = require('os')
var userInfo = os.userInfo()
var userId = userInfo.username.toString().toLowerCase().trim()
var cwd = process.cwd()
var argv = process.argv
var pid = process.pid
var appId = 'tasks'
var mainPID = ''
var appName = 'imonit'
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
// temp files
//==========================================
var pidFile = appChildTempPath + bslash + 'pid.txt'
var mainPIDFile = appTempPath + bslash + 'pid.txt'
var settingsFile = appChildTempPath + bslash + 'settings.json'
var usrSts = appTempPath + bslash + 'usr.sts'
//==========================================
// data
//==========================================
var settings = {}
var appData = {}
var userData = {}
var ttData = {}
//==========================================
// sw
//==========================================
var sw_errorExists = false
var sw_isAdmin = false
//==========================================
// vars
//==========================================
var intw = 60
var dftw = 5
var dbw = 15
var smallw = 10
var rstw = 1800
var logLevel = 3
var status = ''
var statusp = ''
//==========================================
// arrs
//==========================================
var txtArr = []
var adminsArr = []
var txtArrPrv = []
//==========================================
const cap_ACTWIN = 0
//==========================================
// start
//==========================================
goNoGo().then(() => { // will restart if not ok
    mc.wait(dftw).then(() => {
        log('main:START - ' + 'pid:' + pid + ', main pid=' + mainPID + ', user=' + userId)
        getSettings().then(() => {  // will restart if not ok
            mc.wait(smallw).then(() => {
                mainController()
            })
        })
    })
})
//==========================================
// main controller
//==========================================
function mainController() {
    log('main:mainController()')
    mc.get(usrSts).then((us) => {
        mc.wait(dftw).then(() => {
            status = us
            if (status != statusp) {
                statusp = status
                log('===( ' + status + ' )===')
            }
            if (status == 'active' || 1 == 1) {
                txtArr = []
                getTitle().then(() => { // capture snap events like title
                    mc.wait(dftw).then(() => {
                        send().then(() => {
                            mc.wait(intw).then(() => { // wait one minute
                                return mainController()
                            })
                        })
                    })
                })
            } else {
                mc.wait(intw).then(() => {
                    log('zzz...')
                    return mainController()
                })
            }
        })
    })
}

function getTitle() {
    return new Promise((resolve) => {
        log('main:cap')
        let awData = null
        awData = activeWindows.getActiveWindow()
        if (awData) {
            let idletime = awData.idleTime.toString()
            let winclass = awData.windowClass.toString()
            let winname = awData.windowName.toString()
            winname = winname.replace(',', ' ')
            let txt = winclass + ',' + winname
            log('title=' + txt)
            status = 'active'
            if (parseInt(idletime) > 60000) {
                status = 'idle'
            }
            mc.set(usrSts, status).then(() => {
                mc.wait(dftw).then(() => {
                    mc.clean(txt).then((t) => {
                        mc.wait(dftw).then(() => {
                            let txt = ''
                            if (t.length > 128) {
                                txt = t.substring(0, 128)
                            } else {
                                txt = t
                            }
                            if (txt.length > 5) {
                                txtArr[cap_ACTWIN] = txt
                                txtArrPrv = txtArr
                            } else {
                                txtArr = txtArrPrv
                            }
                            resolve()
                        })
                    })
                })
            })
        }
    })
}

function send() {
    log('main:send()')
    return new Promise((resolve) => {
        let jdate = mc.getDate()
        let date_time = jdate.date_time
        let dbParms = {
            server: settings.server,
            port: settings.port,
            key: 'tasksTxt',
            parms: {
                userId: userId,
                appId: appId,
                date: date_time,
                txtArr: txtArr
            }
        }
        mc.db(dbParms).then((res) => {
            mc.wait(dbw).then(() => {
                if (res.rc == 'ok') {
                    log('tasks send db operation succeeded')
                } else {
                    log('tasks send db operation failed - continuing')
                }
                resolve()
            })
        })
    })
}

//==========================================
// app
//==========================================

//==========================================
// additional security
//==========================================
process.on('uncaughtException', function (err) {
    log('main:process.on(`uncaughtException` => displaying err')
    log(JSON.stringify(err))
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
                    let dbParms = {
                        server: settings.server,
                        port: settings.port,
                        key: 'getTasks',
                        parms: {
                            userId: userId,
                            appId: appId
                        }
                    }
                    mc.db(dbParms).then((res) => {
                        mc.wait(dbw).then(() => {
                            if (res.rc == 'ok') {
                                log('getTasks() db operation succeeded')
                                ttData = JSON.parse(JSON.stringify(res.data.ttData))
                                userData = JSON.parse(JSON.stringify(res.data.userData[0]))
                                logLevel = userData.logLevel
                                appData = JSON.parse(JSON.stringify(res.data.appData[0]))
                                adminsArr = appData.admins.split(',')
                                adminsArr = adminsArr.map(v => v.toString().toLowerCase().trim())
                                if (adminsArr.includes(userData.userId.toString().toLowerCase().trim())) {
                                    sw_isAdmin = true
                                }
                                resolve()
                            } else {
                                log('getTasks() db operation failed')
                                sw_errorExists = true
                                closeApp().then(() => {
                                })
                            }
                        })
                    })
                }
            })
        })
    })
}

//==========================================
// utils
//==========================================
function log(msg) {
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

// we do not resolve() if we are actually shutting down, there's no need to continue from here
function closeApp() {
    log('closeApp():shutdown')
    return new Promise((resolve) => {
        try {
            log('*quit')
            app.quit()
            try {
                log('*exit')
                app.exit(0)
            } catch (err) {
                log(err)
                // resolve()
            }
        } catch (err) {
            log(err)
            // resolve()
        }
    })
}

//set automatic restart check every minute
mc.get(mainPIDFile).then((p) => {
    mc.wait(dftw).then(() => {
        mainPID = p.toString().trim()
        log('mainPID=' + mainPID)
        mc.wait(intw).then(() => {
            checkGNG()
        })
    })
})

// checks goNoGo every minute
function checkGNG() {
    goNoGo().then(() => {// if we decide to shut down. we will not be resolving back here anyway
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
                lookFor = 'imonit.exe' + mainPID
                //searching for main app file pid in tasklist
                log('looking for ' + mainPID)
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

// in any case set automatic restart every 3 hours
// mc.wait(rstw).then(() => {
//     log('RESTARTING after ' + rstw)
//     mc.wait(dbw).then(() => {
//         relaunchApp().then(() => {
//         })
//     })
// })
