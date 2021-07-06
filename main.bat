@echo off
call cd %USERPROFILE%\Desktop\safe\imonit >nul 2>&1
call node_modules\electron\dist\imonit.exe app\main.js --disable-gpu --ignore-gpu-blacklist --disable-gpu-compositing --trace-uncaught >nul 2>&1
rem timeout /t -1 >nul
