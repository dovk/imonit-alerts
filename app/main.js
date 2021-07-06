// IMONIT (I'm-On-It) Root - MAIN.JS
//==========================================
const electron = require('electron')
const app = require('electron').app
app.disableHardwareAcceleration()
const exec = require('child_process').exec
const fs = require('fs-extra')
const cache = require('v8-compile-cache')
//==========================================
// app specific modules
//==========================================
const mc = require('./common/imonit/js/mc.js');
//==========================================
// get user, system stuff
//==========================================
const os = require('os')
var userInfo = os.userInfo()
var osUser = userInfo.username.toString().toLowerCase().trim()
var cwd = process.cwd()
var pid = process.pid
//==========================================
var con = ''
var userId = ''
var status = ''
var statusp = ''
var appId = 'root'
var appName = 'imonit'
var bslash = '\\'
var dquote = '"'
var sw = false
//==========================================
// path and resources
//==========================================
var initPath = 'C:\\Users\\Public\\Temp\\' + appName
if (!fs.existsSync(initPath)) {
    fs.mkdirSync(initPath, {recursive: true})
}
var usrBat = initPath + bslash + 'usr.bat'
var usrOut = initPath + bslash + 'usr.out'
var usrSts = initPath + bslash + 'usr.sts'

//var usrCmd = 'call ' + dquote + cwd + bslash + 'query ' + dquote + ' user > ' + usrOut
var usrCmd = 'call ' + cwd + bslash + 'query ' + ' user > ' + usrOut
//==========================================
var appTempPath = initPath
if (!fs.existsSync(appTempPath)) {
    fs.mkdirSync(appTempPath, {recursive: true})
}
var pidFile = appTempPath + bslash + 'pid.txt'
var logFile = appTempPath + bslash + 'log.txt'
var appPath = cwd + bslash + 'app'
var settingsFile = appPath + bslash + 'settings.json'
var childSettingsFile = ''
var appChildTempPath = ''
var childPidFile = ''
//==========================================
var filesArr = []
filesArr.push({file: logFile})
var files = filesArr.length
//==========================================
// data
//==========================================
var settings = {}
var appData = {}
var userData = {}
var ttData = {}
var userAppsData = {}
var logLevel = 3
//==========================================
// vars
//==========================================
var intw = 300
var dftw = 5
var smallw = 10
var dbw = 15
var medw = 30
var childw = 60
var lookFor = ''
var ostatus = {date: '', time: '', status: '', con: ''}
//==========================================
// sw
//==========================================
var sw_liveRestart = false
//==========================================
// start
//==========================================
// startup function - create usr.bat and invoke first getUser()
mc.set(usrBat, usrCmd).then(() => {
    mc.wait(dftw).then(() => {
        getUser().then(() => {
        })
    })
})
//==========================================
mc.wait(smallw).then(() => {
    log('===( start )===')
    clearTxt(0, files).then(() => {
        mc.wait(dftw).then(() => {
            log('main:START ' + 'pid:' + pid + ' cwd:' + cwd)
            goNoGo().then(() => { // if already up, it will close
                log(childw + 's wait for child apps to complete')
                mc.wait(childw).then(() => {
                    getSettings().then(() => {
                        mc.wait(dftw).then(() => {
                            log('imonit version ' + settings.ver)
                            mainController()
                        })
                    })
                })
            })
        })
    })
})
//==========================================
// main controller
//==========================================
function mainController() {
    log('main:mainController()')
    sw = false
    getConnect().then(() => {
        mc.wait(dftw).then(() => {
            if (sw == false) {
                mc.wait(smallw).then(() => {
                    log('main:retrying')
                    return (mainController())
                })
            } else {
                getRex().then((arr) => {
                    mc.wait(smallw).then(() => {
                        let len = arr.length
                        exec('tasklist', function (err, stdout, stderr) {
                            mc.wait(dftw).then(() => {
                                let str = ''
                                if (stdout) {
                                    str = stdout.toString()
                                }
                                let reg = /\s/g
                                let tasklist = str.replace(reg, '')
                                callApps(0, len, arr, tasklist).then(() => {
                                    log(intw + 's wait before next apps health check')
                                    mc.wait(intw).then(() => {
                                        return (mainController())
                                    })
                                })
                            })
                        })
                    })
                })
            }
        })
    })
}

function getConnect() {
    log('main:getConnect()')
    return new Promise((resolve) => {
        getUser().then(() => {
            mc.wait(smallw).then(() => {
                callDB().then(() => {
                    mc.wait(dftw).then(() => {
                        resolve()
                    })
                })
            })
        })
    })
}

function callDB() {
    log('main:callDB()')
    return new Promise((resolve) => {
        let jdate = mc.getDate()
        ostatus = {date: jdate.date, time: jdate.time, status: status, con: con}
        let dbParms = {
            server: settings.server,
            port: settings.port,
            key: 'connect',
            parms: {
                userId: userId,
                appId: appId,
                ostatus: ostatus,
                ver: settings.ver
            }
        }
        mc.db(dbParms).then((res) => {
            mc.wait(dbw).then(() => {
                if (res && res.rc == 'ok') {
                    log('callDB:db operation succeeded')
                    ttData = JSON.parse(JSON.stringify(res.data.ttData))
                    userData = JSON.parse(JSON.stringify(res.data.userData[0]))
                    if (userData.restart == 'Y') { // this will cause a restart (also in writeFile)
                        sw_liveRestart = true
                    }
                    logLevel = userData.logLevel
                    appData = JSON.parse(JSON.stringify(res.data.appData))
                    userAppsData = JSON.parse(JSON.stringify(res.data.userAppsData))
                    sw = true
                    resolve()
                } else {
                    log('getConnect:db operation failed, will retry')
                    resolve()
                }
            })
        })
    })
}

function getRex() {
    log('main:getRex()')
    return new Promise(resolve => {
        let arr = [] // call only automatic apps, not user-initiated
        let lenii = userAppsData.length
        let lenjj = appData.length
        for (let ii = 0; ii < lenii; ii++) {
            for (let jj = 0; jj < lenjj; jj++) {
                if (userAppsData[ii].appId == appData[jj].appId) {
                    if (appData[jj].auto == 'Y') {
                        userAppsData[ii].port = appData[jj].port
                        userAppsData[ii].initialHeight = appData[jj].initialHeight
                        arr.push(userAppsData[ii])
                        break
                    } else {
                        break
                    }
                }
            }
        }
        mc.wait(dftw).then(() => {
            resolve(arr)
        })
    })
}

//==========================================
// once
//==========================================
function getSettings() {
    log('getSettings()')
    return new Promise((resolve) => {
        fs.readFile(settingsFile, 'utf8', (err, data) => {
            mc.wait(dftw).then(() => {
                if (err) {
                    log(err)
                    settings = null
                    closeApp().then(() => {
                        // do not resolve('')
                    })
                } else {
                    settings = JSON.parse(data)
                    resolve()
                }
            })
        })
    })
}

function callApps(i, len, arr, tasklist) {
    return new Promise(resolve => {
        if (i >= len) {
            log('main:call apps done')
            resolve()
        } else {
            let uapp = arr[i]
            let j = i + 1
            checkLaunch(uapp, tasklist).then((ok) => {
                if (ok) {
                    log('main:app#' + (i + 1) + '-' + uapp.appId)
                    call(uapp).then(() => {
                        resolve(callApps(j, len, arr, tasklist))
                    })
                } else {
                    resolve(callApps(j, len, arr, tasklist))
                }
            })
        }
    })
}

function call(uapp) {
    return new Promise((resolve) => {
        let jparm = {
            appName: appName,
            appid: uapp.appId,
            pid: pid,
            server: settings.server,
            port: uapp.port,
            lang: userData.lang,
            dir: userData.dir,
            initialHeight: uapp.initialHeight
        }
        let jstr = JSON.stringify(jparm).toString()
        appChildTempPath = appTempPath + bslash + uapp.appId
        if (!fs.existsSync(appChildTempPath)) {
            fs.mkdirSync(appChildTempPath, {recursive: true})
        }
        childSettingsFile = appChildTempPath + bslash + 'settings.json'
        mc.set(childSettingsFile, jstr).then(() => {
            mc.wait(dftw).then(() => {
                let parms = []
                if (1 == 2) {
                    let taskname = uapp.appId
                    let taskrun = dquote + cwd + bslash + 'zimRUN.exe ' + dquote + cwd + bslash + 'run.bat ' + taskname + dquote
                    parms.push('/create')
                    parms.push('/sc')
                    parms.push('minute')
                    parms.push('/mo')
                    parms.push('5')
                    parms.push('/tn')
                    parms.push(taskname)
                    parms.push('/tr')
                    parms.push(taskrun)
                    // parms.push('/z')
                    // parms.push('/f')
                    mc.exe('schtasks', parms).then(() => {
                        mc.wait(smallw).then(() => {
                            resolve()
                        })
                    })
                } else {
                    parms.push(uapp.appId)
                    parms.push(pid) // we push the main pid to all child apps so they can check and shutdown if main is down too
                    parms.push(appName)
                    parms.push(userId)
                    let cmd = cwd + bslash + 'run' + '.bat'
                    log('calling mc.exe ' + uapp.appId)
                    mc.exe(cmd, parms).then(() => {
                        mc.wait(dftw).then(() => {
                            resolve()
                        })
                    })
                }
            })
        })
    })
}

function checkLaunch(uapp, tasklist) {
    return new Promise((resolve) => {
        appChildTempPath = appTempPath + bslash + uapp.appId
        if (!fs.existsSync(appChildTempPath)) {
            fs.mkdirSync(appChildTempPath, {recursive: true})
        }
        childPidFile = appChildTempPath + bslash + 'pid.txt'
        mc.get(childPidFile).then((p) => {// check the last child pid which would be in the pid file
            if (p == null) {
                resolve(true)
            } else {
                let px = p.toString().trim()
                lookFor = 'imonit.exe' + px
                log('looking for ' + px)
                if (tasklist.includes(lookFor)) {
                    resolve(false)
                } else {
                    resolve(true)
                }
            }
        })
    })
}

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
                mc.get(pidFile).then((p) => {
                    if (p == null) {
                        //pid file null - setting pid file
                        log('setting pid to  ' + pid)
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
                                log('instance already exists-shutting down')
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
            })
        })
    })
}

function clearTxt(i, len) { // clear files once on start
    return new Promise((resolve) => {
        if (i >= len) {
            resolve()
        } else {
            let file = filesArr[i].file
            mc.clearFile(file).then(() => {
                mc.wait(dftw).then(() => {
                    let j = i + 1
                    resolve(clearTxt(j, len))
                })
            })
        }
    })
}

// get/set logged on user details
function getUser() {
    log('getUser()')
    return new Promise((resolve) => {
        exec(usrBat, function (err, stdout, stderr) { // invoke usr.bat
            mc.wait(dftw).then(() => {
                mc.get(usrOut).then((out) => {
                    mc.wait(dftw).then(() => {
                        mc.get(usrSts).then((us) => {
                            mc.wait(dftw).then(() => {
                                if (us) {
                                    status = us
                                    if (status != statusp) {
                                        statusp = status
                                        log('===( ' + status + ' )===')
                                    }
                                }
                                // get output
                                let out1 = out.toString().toLowerCase().trim()
                                let out2 = out1.split('\n') // new array split by lines
                                let out3 = out2[1] // first line is col header, we need second line
                                let out4 = out3.replace('>', ' ') // replace in second line
                                let out5 = out4.split(' ') // new array split by spaces
                                // set userId
                                userId = out5[1] // second occurance is username
                                // set connection type
                                con = 'Disconnect' // default - second line also contain connection type
                                if (out2[1].includes('console')) {
                                    con = 'Local'
                                } else {
                                    if (out2[1].includes('rdp')) {
                                        con = 'Remote'
                                    }
                                }
                                resolve()
                            })
                        })
                    })
                })
            })
        })
    })
}

