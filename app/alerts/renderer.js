// IMONIT (I'm-On-It) Alerts - RENDERER.JS
//==========================================
// The rendered process is launched by run.js and opens an alert window notification
// For security reasons, there are no node.js references in the rendered process
// Any functionality that is required is done via specific API-like calls to the preloaded script ("preload.js")
//==========================================
// sw
//==========================================
var sw_windowDisplayed = true
var sw_closing = false
var sw_snooze = false
//==========================================
// arrs
//==========================================
var intervals = []
//==========================================
// vars
//==========================================
var x, y, content, arg
var emptyParms = {}
var intw = 300
var dftw = 5
var table, key, val
//==========================================
// data
//==========================================
var appData = {}
var ttData = {}
var alertsData = [{}]
var alertsResponseData = [{}]
var btnArr = []
var data = {}
//==========================================
// start
//==========================================
log('renderer:START')
init().then(() => {
    setListeners().then(() => {
    })
})
//==========================================
// init
//==========================================
//get sheet count, populate fields for display, set listener for click to go into sap
function init() {
    return new Promise((resolve) => {
        log('renderer:init()')
        document.getElementById('zsnooze').className = 'hide draggy ' // wait a few minutes before showing snooze option
        document.getElementById('slt').className = 'float-left rawHide  ' // wait a few minutes before showing snooze option

        requestData().then(() => {                  // request sheet count
            recieveData().then(() => {              // wait for answer
                setData().then(() => {              // populate fields for display
                    document.getElementById('ztop').className = 'container-fluid fixed border-top ' // wait a few minutes before showing snooze option
                    resolve()
                })
            })
        })
    })
}

//==========================================
// functions
//==========================================
// send message to run.js requesting data to display
function requestData() {
    return new Promise((resolve) => {
        log('renderer:requestData()')
        window.IMONIT_sendMessage('IMONIT_get-res', emptyParms) // preload exposed api
        resolve()
    })
}

function recieveData() { // wait for answer, sheet count will be placed by preloader in window.IMONIT_arg
    return new Promise((resolve) => {
        log('renderer:recieveData()')
        arg = window.IMONIT_recieveMessage('IMONIT_get-res') // preload exposed api
        wait(0.5).then(() => {
            data = window.IMONIT_arg // the response object sent from run.js at ipc.on('IMONIT_get-res')
            x = data.x
            y = data.y
            ttData = data.ttData
            appData = data.appData
            alertsResponseData = data.alertsResponseData
            alertsData = data.alertsData
            // set titles
            table = 'alerts'
            key = 'windowTitle'
            val = getTT(table, key)

            let wt = document.getElementById('windowTitle')
            wt.innerHTML = '&nbsp;&nbsp' + val
            wt.className += ' ' + data.dir

            let img = document.createElement('img')
            img.setAttribute('src', '../../imonit.ico')
            img.setAttribute('draggable', 'false')
            img.className = 'logoy'
            wt.insertBefore(img, wt.firstChild)
            resolve()
        })
    })
}

function setData() { // populate page text
    return new Promise((resolve) => {
        log('renderer:setData()')
        // slide in first time only
        let c = document.getElementById('zpage').className
        if (c.includes('hide')) {
            document.getElementById('zpage').className = 'slide'
        } else {
            document.getElementById('zpage').className = ''
        }
        document.getElementById('zpage').className += ' full-height border-bottom border-left border-right'
        document.getElementById('zpage').dir = data.dir
        document.getElementById('zpage').lang = data.lang
        btnArr = [] // to link the line displayed back to the initial alert data
        let j = -1 // j will be the physical number of the line which will be displayed
        let len = alertsData.length
        for (i = 0; i < len; i++) { // display if count is greater than limit
            if (parseInt(alertsResponseData[i].returnCode) == 1 && parseInt(alertsResponseData[i].messageValue) > alertsData[i].limit) {
                // if this is a line to be displayed
                j = j + 1 // this will be the physical line number on the screen
                btnArr.push(i) // we will save the corresponding index in the initial alerts array
                if (alertsResponseData[i].messageText == '') {
                    alertsResponseData[i].messageText = alertsData[i].winMessageLine1
                    alertsResponseData[i].messageText =
                        alertsResponseData[i].messageText.replace('%messageValue%',
                            '<b>&nbsp;<u>' + alertsResponseData[i].messageValue.toString() + '</u>&nbsp;</b>')
                }
                if (alertsResponseData[i].buttonText == '') {
                    alertsResponseData[i].buttonText = alertsData[i].winButtonText1
                }
                if (alertsResponseData[i].buttonUrl == '') {
                    alertsResponseData[i].buttonUrl = alertsData[i].winButtonAction1
                }
                document.getElementById('txtbtn' + j.toString()).innerHTML = alertsResponseData[i].messageText
                document.getElementById('txtbtn' + j.toString()).className += ' ' + data.dir
                if (alertsData[i].winAllowSnooze == 'Y') {
                    if (document.getElementById('snoozebtn').innerHTML != 'Snooze') {
                        document.getElementById('snoozebtn').innerHTML = 'Snooze'
                        document.getElementById('snoozebtn').className += ' ' + data.dir
                        intervals = alertsData[i].winSnoozeIntervals.split(',')
                        let len = intervals.length
                        for (k = 0; k < len; k++) {
                            let t = ''
                            intervals[k] = intervals[k] / 60
                            if (intervals[k] < 1) {
                                t = intervals[k] * 60 + 'm'
                            } else {
                                t = intervals[k] + 'h'
                            }
                            document.getElementById("opt" + k).innerHTML = t
                            document.getElementById("opt" + k).className = ''
                        }
                    }
                }
            }
            resolve()
        }
    })
}

// set listener for button click (upon click we will open sap in browser and close alert)
// notice for all cases where we close/reopen, we set sw_closing so that it cannot be fired more than once
function setListeners() {
    return new Promise((resolve) => {
        log('renderer:setListeners()')
        const btn0 = document.getElementById('txtbtn0')
        btn0.addEventListener('click', function (event) {
            btnClicked(btnArr[0])
        })
        const btn1 = document.getElementById('txtbtn1')
        btn1.addEventListener('click', function (event) {
            btnClicked(btnArr[1])
        })
        const btn2 = document.getElementById('txtbtn2')
        btn2.addEventListener('click', function (event) {
            btnClicked(btnArr[2])
        })
        const snoozebtn = document.getElementById('snoozebtn')
        snoozebtn.addEventListener('click', function (event) {
            if (sw_snooze){
                snoozeWindow()
            }
        })
        // const slt = document.getElementById('slt')
        // slt.addEventListener('mouseover', function (event) {
        //     if (!sw_snooze){
        //         event.preventDefault()
        //         event.stopPropagation()
        //         return false
        //     }
        // })
        const page = document.getElementById('zpage') // listen to mouse move so we can restart if window moved outside visual range
        page.addEventListener('mouseout', function (event) {
            checkDrag()
        })
        resolve()
    })
}

function checkDrag() {
    if ((window.screenX > x + 60 || window.screenX < -20) || (window.screenY > y + 20 || window.screenY < -20)) {
        window.IMONIT_sendMessage('IMONIT_restore_pos', emptyParms) // send message to main to reset window pos
    } else {
        wait(dftw - 1).then(() => {
            if ((window.screenX > x + 60 || window.screenX < -20) || (window.screenY > y + 20 || window.screenY < -20)) {
                window.IMONIT_sendMessage('IMONIT_restore_pos', emptyParms) // send message to main to reset window pos
            }
        })
    }
}

function snoozeWindow() {
    log('renderer:snoozeWindow()')
    if (sw_closing) {
    } else {
        sw_closing = true
        sw_windowDisplayed = false // if user clicked button then no need to minimize/refocus
        document.getElementById('prog-bar').className = 'loading animated'
        document.getElementById('prog-sw').className = 'prog'
        wait(dftw).then(() => {
            getSnooze().then((snooze) => { //get user-selected snooze time
                window.IMONIT_sendMessage('IMONIT_hide', emptyParms)
                wait(snooze).then(() => { // wait snooze time
                    window.IMONIT_sendMessage('IMONIT_close-reopen', emptyParms) // send message to run.js to close this window
                })
            })
        })
    }
}

function btnClicked(n) {
    log('renderer:btnClicked(' + n + ')')
    if (sw_closing) {
    } else {
        sw_closing = true
        sw_windowDisplayed = false // if user clicked button then no need to minimize/refocus
        document.getElementById('prog-bar').className = 'loading animated'
        document.getElementById('prog-sw').className = 'prog'
        wait(dftw).then(() => { // for ux purpose only to show the progress line, can be skipped if not essential
            window.IMONIT_sendMessage('IMONIT_openURL', {btn: n}) // open external url via main and not preload
            window.IMONIT_sendMessage('IMONIT_hide', emptyParms)
            wait(intw).then(() => { // wait 5 minutes
                window.IMONIT_sendMessage('IMONIT_close-reopen', emptyParms) // send message to run.js to close this window
            })
        })
    }
}

function getSnooze() {
    return new Promise((resolve) => {
        log('renderer:getSnooze()')
        let slt = document.getElementById('slt');
        let opt;
        let snooze = 0;
        let len = slt.options.length
        if (len == 0) {
            resolve()
        } else {
            for (let i = 0; i < len; i++) {
                opt = slt.options[i];
                if (opt.selected === true) {
                    snooze = parseInt(intervals[opt.value] * 3600)
                    log('renderer:will snooze for ' + snooze + ' seconds')
                    resolve(snooze)
                }
            }
        }
    })
}

//==========================================
// on init
//==========================================
wait(intw).then(() => { // don't show snooze right away
    setSnoozeLimit()
})
// check every 5 minutes to see if we have passed the time limit to use snooze
// if true, hide snooze option. if already snoozing, end snooze time by restarting
function setSnoozeLimit() {
    let jdate = getDate();
    if (jdate.hh > alertsData[0].winAllowSnoozeUntil) {
        sw_snooze=false
        document.getElementById('zsnooze').className = 'hide draggy '
        document.getElementById('slt').className = 'float-left rawHide '
        if (!sw_WindowDisplayed) {
            if (sw_closing) {
            } else {
                window.IMONIT_sendMessage('IMONIT_close-reopen', emptyParms)
            }
        }
    } else {
        sw_snooze=true
        document.getElementById('zsnooze').className = 'snooze floaty draggy ' + data.dir
        document.getElementById('windowTitle').className += ' text-title-pushup'
        document.getElementById('slt').className = ' floaty'
    }
    wait(intw).then(() => {
        return setSnoozeLimit()
    })
}
