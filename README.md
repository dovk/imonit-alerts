# IMONIT (I'm-On-It) Attendance, Tasks and Timesheet Management
IMONIT is an open source productivity tool that can help individuals and organizations benefit in a number of ways, for example:
* Display customized time-sensitive alerts on the desktop
* Enhance timesheet reporting with automated real-time data
* Measure the impact of digital transformation on operational workload

-----------------------------------------------------------------------------------------------------------

#Code
* IMONIT was developed using plain JS, HTML and Bootstrap CSS. 
* The client is wrapped using the [Electron Platform](https://electronjs.org)  
* The backend is a Node/Express server using mySQL.

# Electron security
 In order to implement [Electron's security recommendations](https://electronjs.org/docs/tutorial/security) 
   the following values were set in **webPreferences** when creating the BrowserWindow:
```
        allowRunningInsecureContent: false,
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
```
   Since the notification window needs to be constantly visible, without the user being able to close or minimize the window,
   BrowserWindow attributes include:
```
	   alwaysOnTop: true,
	   frame: false,
	   autoHideMenuBar: true,
	   resizable: false,
	   movable: false,
	   minimizable: false,
	   closable: false,
````
   This provides basic protection by hiding UI elements that would enable the user to close or minimize the window. 
   In addition, events such as manual dismissal of the window or termination of the app are monitored and ignored.
   For example:
-   Intercept an attempt to close the browser-based window via **Alt-F4** 
```
   document.addEventListener('keydown', function (event) {
	   if (event.defaultPrevented) {
	   	return
	   }
	   return checkKey(event)
   })

   function checkKey(event) { // block keyboard events such as alt-f4 which could close the window
	   let key = event.key || event.keyCode;
	   let val = parseInt(key, 10);
	   if (typeof val == 'number' ||
		   keys[key] == false ||
		   event.altKey ||
		   event.ctrlKey ||
		   event.shiftKey ||
		   event.metaKey ||
		   event.repeat) {
		   event.preventDefault()
		   return false
	   }
   }
```
-   Ignore BrowserWindow event **close** when user attempts to close the app from the taskbar:
```
      win.on('close', (event) = {
      	event.preventDefault()
      }
```
   (Note that the **close** event differs from the BrowserWindow **closed** event - it occurs before the window is closed).

-   Intercept manual termination from the Windows Task Manager (partially solved with webContents event **crashed** which relaunched app)
```
   win.webContents.on('crashed', (event) = {
	   app.relaunch()
	   app.exit()
   }
```

# Parent and child apps
IMONIT supports multiple apps running from the root level run.js.
The root app checks that only one root app is active.
It then checks that all relevant child apps are active. 
If a child app is not active, it will be invoked.
Each child app checks that only one instance of the child app is active. If another instance is active, it will shut itself down.
The child app also checks if the root app that invoked it is still active. 
If the root app is not active, the child app will invoke it and shut itself down.
The root app will then again invoke the child apps.
This mutual monitoring ensures that there will be only one instance of a parent or child app, 
and that any app that is supposed to be active, is active.

# The rendered process and preload script
   Compliance with security recommendations requires that the rendered process can
   not have **any** direct access to Electron or Node.js modules, such
   as **require** definitions. Instead, the **preload** parameter
   in the main's **webPreferences** points to a script that will be loaded before the
   rendered process, giving the rendered process API-like access to specific
   functions exposed by the preload script through the window object. 
   It is important to note that the preload script can only require a very limited 
   number of mostly Electron-related Node.js modules.
   In our case functionality in the renderer process is limited to IPC
   communication **only**, so the rendered process can only send messages/requests to the main process, 
   and can only receive responses in the same manner.
   In order to enable the rendered process to send an IPC message back to the
   main process, we need to do the following **in the preload script –**
-   Define the node module require: const ipc = require('electron').ipcRenderer;
-   Define the function that will perform the operation:
```
      function sendMessage(msg) {
         return ipc.send(msg);
      }
```
-   Expose the function via the window object: window.sendMessage = sendMessage;   
    Then, **in the rendered process** we can access the exposed function as follows: window.sendMessage('close-alert');

   In the event that someone gained unauthorized access to the renderer process, they would not be able to directly run Electron or Node.js commands - only
   functions that have been exposed in the preload script, such as **window.sendMessage** 
     
   The Electron team is constantly working on improving security and the Electron version is updated as soon as possible. 
   As of January 2020 we are using Electron version 7.

   Other security recommendations that were implemented –
   
-   The client side code has been obsfucated in order to prevent tampering. 
-   The actual requested URL from the rendered process or preload is never sent to the main process but rather send a code that points to a URL saved in the the main process;
-   A prefix to function names and parameter values being passed 
    to the preload script is always added to protect against tampering. 
    For example the name of function **sendMessage** is changed to one with a prefix (in our case **IMONIT_**) so
    that it became **IMONIT_sendMessage** , and instead of passing the
    value **close-alert** I now pass **IMONIT_close-alert** and then check in
    the preload script that all messages must have the prefix **IMONIT_** :
```
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

```
- Logging and debugging is controlled at the user level from the server, and cannot be changed at the client.
The renderer uses IPC messaging to communicate log messages back to the main process, which is then written to a single log file.


# Credit 
   IMONIT was developed by Dov Keshet and Batel Mirel in 2016.

# License 
   [GNU General Public License](http://www.gnu.org/licenses/gpl-3.0-standalone.html)
   
