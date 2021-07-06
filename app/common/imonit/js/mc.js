// IMONIT (I'm-On-It) common/js - MC.JS
//==========================================
const electron = require('electron')
const app = require('electron').app
app.disableHardwareAcceleration()
const child = require('child_process').execFile
const fs = require('fs-extra')
const request = require('request')
const cache = require('v8-compile-cache')
const crypto = require('crypto')
//=================================================
var bslash = '\\'
var cwd = process.cwd()
var appPath = cwd + bslash + 'app'
var appName = 'imonit'
var appTempPath = 'C:\\Users\\Public\\Temp\\' + appName
if (!fs.existsSync(appTempPath)) {
    fs.mkdirSync(appTempPath, {recursive: true})
}
//===========================================
// ssl
//===========================================
var SSL = 'noSSL'
var caf = fs.readFileSync(appPath + bslash + 'ssl' + bslash + 'pwmeclrtap04.crt')
//===========================================
var appId = 'mc'
var intw = 300
var logFile = appTempPath + bslash + 'log.txt'
var carr = ['=', '6', 'J', 'j', '4', '1', 'q', 'i', 'u', '0', '3', 'p', 'V', 'y', 'z', 'e', 'D', 'o', 'T', 'K', 'Q', 'g', 's', 'C', 'd', 'O', 'M', 'G', 'r', '2', 'B', 'L', 'm', 'v', 'x', 'A', 'U', 'N', 'b', 'P', 'w', 'H', 'Z', 'n', 'I', 'h', '7', 'a', '5', 'F', 'X', 'f', 'd', 'E', 'W', 'k', 'S', '9', '8', 't', 'l', 'R', 'Y', '!']
var ltrArr = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z', 'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z']
var rtlArr = ['א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ז', 'ח', 'ט', 'י', 'ך', 'כ', 'ל', 'ם', 'מ', 'ן', 'נ', 'ס', 'ע', 'ף', 'פ', 'ץ', 'צ', 'ק', 'ר', 'ש', 'ת']
var digArr = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9']
var spcArr = ['/', '.', ':', '-', '%', '$', '(', ')', '[', ']', ',']
var charArr = [
    ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ',
    ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ',
    ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ',
    ' ', ' ', ' ', '!', '`', '#', '$', '%', '&', '`',
    '(', ')', '*', '+', ',', '-', '.', '/', '0', '1',
    '2', '3', '4', '5', '6', '7', '8', '9', ':', ';',
    '<', '=', '>', '@', '?', 'A', 'B', 'C', 'D', 'E',
    'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O',
    'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y',
    'Z', '[', ' ', ']', '^', '_', '`', 'a', 'b', 'c',
    'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm',
    'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w',
    'x', 'y', 'z', '{', '|', '}', '~', ' ', 'א', 'ב',
    'ג', 'ד', 'ה', 'ו', 'ז', 'ח', 'ט', 'י', 'ך', 'כ',
    'ל', 'ם', 'מ', 'ן', 'נ', 'ס', 'ע', 'ף', 'פ', 'ץ',
    'צ', 'ק', 'ר', 'ש', 'ת', ' ', ' ', ' ', ' ', ' ',
    ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ',
    ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ',
    ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ',
    ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ',
    ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ',
    ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ',
    ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ',
    ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ',
    ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ',
    ' ', ' ', ' ', ' ', ' ', ' ']
var logParms = {
    logLevel: 3,
    appId: appId,
    userId: '',
    msg: '',
    pid: ''
}

//=================================================
// get/set global variable (actually reading from local disk storage)
//=================================================
exports.get = function (key) {
    return new Promise((resolve) => {
        fs.readFile(key, 'utf8', (err, data) => {
            if (err) {
                resolve(null)
            } else {
                let val = data
                resolve(val)
            }
        })
    })
}
exports.set = function (key, val) {
    return new Promise((resolve) => {
        fs.writeFile(key, val, (err) => {
            resolve()
        })
    })
}

//=================================================
// general interface to server db functions
//=================================================
exports.db = function (dbParms) {
    let res = {
        data: '',
        rc: 'err',
        rctxt: 'failed to connect or return from server'
    }
    let txt, txtc
    if (dbParms.server.toString().includes('https')) {
        SSL = 'SSL'
    }
    if (SSL == 'SSL') {
        txt = JSON.stringify(dbParms.parms)
        let dn = Date.now().toString().substring(0, 8)
        let arr = dn.split('')
        let a = arr.map(v => (v * 1)).map(v => carr[v]).reverse().join('')
        let b = arr.map(v => (v * 3)).map(v => carr[v]).reverse().join('')
        let c = arr.map(v => (v * 5)).map(v => carr[v]).reverse().join('')
        let d = arr.map(v => (v * 7)).map(v => carr[v]).reverse().join('')
        let secretKey = a + b + c + d //'vOVH6sdmpNWjRRIqCc7rdxs01lwHzfr3'
        let algorithm = 'aes-256-ctr'
        let iv = crypto.randomBytes(16)
        let cipher = crypto.createCipheriv(algorithm, secretKey, iv)
        let encrypted = Buffer.concat([cipher.update(txt), cipher.final()])
        txtc = {iv: iv.toString('hex'), content: encrypted.toString('hex')}
    } else {
        txtc = dbParms.parms
    }
    let uri = {
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': txtc.length,
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Content-Type,Origin,Accept,Authorization,Content-Length,X-Requested-With',
            'Access-Control-Allow-Methods': 'GET,POST,PUT,PATCH,DELETE,HEAD,OPTIONS'
        },
        url: dbParms.server + ':' + dbParms.port + '/' + dbParms.key,
        method: 'POST',
        json: true,
        body: txtc
    }
    if (SSL == 'SSL') {
        uri.ca = caf
    }
        return new Promise((resolve) => {
        request(uri, function (error, response, body) {
            if (error) {
                res.rctxt = JSON.stringify(error)
                resolve(res)
            } else {
                res.data = response.body,
                    res.rc = 'ok',
                    res.rctxt = 'db operation succeeded'
                resolve(res)
            }
        })
        //resolve(res)
    })
}
//=================================================
// logger
//=================================================
exports.log = function (lp) {
    return new Promise((resolve) => {
        if (lp.logLevel == 0) {
            resolve()
        } else {
            log(lp).then(() => {
                resolve()
            })
        }
    })
}
//=================================================
// files
//=================================================
exports.clearFile = function (file) {
    return new Promise((resolve) => {
        clearFile(file).then(() => {
            resolve()
        })
    })
}
exports.readFile = function (file, cln, dcd) {
    return new Promise((resolve) => {
        fs.readFile(file, 'utf8', function (err, data) {
            if (err) {
                resolve('')
            } else {
                if (dcd) {
                    decodeStr(data).then((decoded_data) => {
                        resolve(decoded_data)
                    })
                } else {
                    if (cln) {
                        clean(data).then((clean_data) => {
                            resolve(clean_data)
                        })
                    } else {
                        resolve(data)
                    }
                }
            }
        })
    })
}
//=================================================
// others
//=================================================
exports.clean = function (txt) {
    return new Promise((resolve) => {
        clean(txt).then((t) => {
            resolve(t)
        })
    })
}

exports.getDate = function () {
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
        pod: pod
    }
    return (jdate);
}

exports.wait = function (sec) {
    return new Promise((resolve) => {
        wait(sec).then(() => {
            resolve()
        })
    })
}

exports.exe = function (cmd, parm) {
    let sp = cmd.split(bslash) // or parm[0].split
    let f = sp[sp.length - 1]
    f = f.replace('.exe', '')
    return new Promise((resolve) => {
        app.releaseSingleInstanceLock()
        child(cmd, parm, function (err, data) {
            if (err) {
                logParms.msg = 'mc:calling ' + f + ' failed ==> ' + err.toString()
                log(logParms).then(() => {
                    resolve()
                })
            } else {
                logParms.msg = 'mc:calling ' + f + ' ==> OK'
                log(logParms).then(() => {
                    resolve()
                })
            }
        })
        resolve()
        // important - there are some cases where the external calls need to be changed
        // here for example the resolves under child do not return
    })
}

//=================================================
// internal functions
//=================================================
function clearLog() {
    return new Promise((resolve) => {
        fs.readFile(logFile, 'utf8', (err, data) => {
            if (err) {
                resolve()
            } else {
                let str = data.toString()
                if (str.length > 99999) {
                    clearFile(logFile).then(() => {
                        resolve()
                    })
                } else {
                    resolve()
                }
            }
        })
    })
}

function clearFile(file) {
    return new Promise((resolve) => {
        fs.writeFile(file, '', {'flag': 'w+'}, (err) => {
            if (err) {
                resolve()
            } else {
                resolve()
            }
        })
    })
}

function clean(txt) {
    return new Promise((resolve) => {
        let by = ' '
        let reg = ''
        let t1 = txt.toString()
        t1 = t1.replace(/\"/g, '`')
        t1 = t1.replace(/\'/g, '`')
        reg = /[\u0000-\u001f\u007f-\u05cf\u05eb-\ufffff]/g
        let t8 = soap(t1, reg, by)
        reg = /\s\s+/g
        let t9 = soap(t8, reg, by)
        checkStr(t9).then((c) => {
            if (c < 4) {
                t9 = ''
            }
            resolve(t9)
        })
    })
}

function checkStr(str) {
    return new Promise((resolve) => {
        var count = 0
        var chars = 'abcdefghijklmnopqrstuvwxyzאבגדהוזחטיכךלמםנןסעפףצץקרשת'
        var charArr = chars.split('')
        var len = charArr.length
        for (var i = 0; i < len; i++) {
            let c = str.split(charArr[i]).length - 1
            if (c && c > 0) {
                count++
                if (count > 3) {
                    resolve(count)
                }
            }
        }
        resolve(count)
    })
}

function soap(str, reg, by) {
    return str.replace(reg, by)
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
        pod: pod
    }
    return (jdate)
}

function wait(sec) {
    return new Promise((resolve) => {
            logParms.msg = ''
            let ms = sec * 1000
            if (sec > 30) {
                logParms.msg = 'mc:waiting ' + sec + ' seconds...'
            }
            log(logParms).then(() => {
                setTimeout(() => resolve(), ms)
            })
        }
    )
}

function decodeStr(data) {
    return new Promise((resolve) => {
        let bidi = '' // final bidi string
        let out = '' // first transform RTL characters (identified by their ascii-decimal value)
        let str = data.toString()
        let arr = str.split('')
        let leni = str.length
        for (let i = 0; i < leni; i++) {
            let t = str.charCodeAt(i)
            if (t == 10 || t == 13) {// eol
                out += '<eol>'
            } else {
                //if (t >= 128 (or 34) && t <= 154) {
                if (t >= 0 && t <= 255) {
                    let l = charArr[t]
                    out += l
                } else {
                    //out += arr[i]
                    out += ' '
                }
            }
        }
        let lineArr = out.split('<eol>') // split screen into lines
        let lenj = lineArr.length
        handleLine(0, lineArr, lenj, bidi).then((res) => {
            resolve(res)
        })
    })
}

function handleLine(i, lineArr, len, bidi) {
    return new Promise(resolve => {
        let b = bidi
        if (i >= len) {
            resolve(b)
        } else {
            let line = lineArr[i]
            if (line.trim() == '' || line.trim() == '<eol>') {
                let ii = i + 1
                resolve(handleLine(ii, lineArr, len, b))
            } else {
                let lineCharArr = line.split('')
                if (lineCharArr.some(e => rtlArr.includes(e))) {
                    let lencc = lineCharArr.length
                    for (let cc = lencc - 1; cc >= 0; cc--) {
                        if (ltrArr.indexOf(lineCharArr[cc]) >= 0 || digArr.indexOf(lineCharArr[cc]) >= 0) {
                            let buff = ''
                            do {
                                buff += lineCharArr[cc]
                            }
                            while (--cc >= 0 && (ltrArr.indexOf(lineCharArr[cc]) >= 0 ||
                                digArr.indexOf(lineCharArr[cc]) >= 0 ||
                                spcArr.indexOf(lineCharArr[cc]) >= 0))
                            cc++
                            let buffArr = buff.split('')
                            let buffArrRev = buffArr.reverse()
                            b += buffArrRev.join('')
                        } else {
                            if (lineCharArr[cc] == ')') {
                                lineCharArr[cc] = '('
                            } else {
                                if (lineCharArr[cc] == '(') {
                                    lineCharArr[cc] = ')'
                                }
                            }
                            b += lineCharArr[cc]
                        }
                    }
                } else {
                    b += line
                }
                b += '\n'
                let ii = i + 1
                resolve(handleLine(ii, lineArr, len, b))
            }
        }
    })
}

function log(lp) { // lp = logParms
    return new Promise((resolve) => {
        let m = ''
        if (isObject(lp.msg)) {
            m = JSON.stringify(lp.msg)
        } else {
            m = lp.msg
        }
        let msg = m.toString().trim()
        if (msg == '') {
            resolve()
        } else {
            let jdate = getDate()
            let date_time = jdate.date_time
            let msgout = date_time + ' ' + lp.pid + ' ' + lp.appId + ' ' + lp.userId + ' ' + msg
            if (lp.logLevel == 1) {
                console.log('mc:' + msgout)
                resolve()
            } else {
                if (lp.logLevel > 1) {
                    msgout = msgout.trim() + '\n'
                    fs.writeFile(logFile, msgout, {'flag': 'a'}, (err) => {
                        if (err) {
                            resolve()
                        } else {
                            resolve()
                        }
                    })
                }
            }
        }
    })
}

function isObject(value) {
    return value && typeof value === 'object' && value.constructor === Object;
}

function isArray(value) {
    return value && typeof value === 'object' && value.constructor === Array;
}

function isNumber(value) {
    return typeof value === 'number' && isFinite(value);
}

function isString(value) {
    return typeof value === 'string' || value instanceof String;
}

function isNull(value) {
    return value === null;
}

function isUndefined(value) {
    return typeof value === 'undefined';
}

function isError(value) {
    return value instanceof Error && typeof value.message !== 'undefined';
}

//=================================================
// on start
//=================================================
clearLog().then(() => {
    wait(intw).then(() => {
        mcInit()
    })
})
