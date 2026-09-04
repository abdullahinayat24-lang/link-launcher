@echo off
setlocal
set "SCRIPTDIR=%~dp0"

echo ============================================
echo  DREAMSLABSTUDIO - Chrome Protocol Setup
echo ============================================
echo.
echo Registering "chromeprofile://" URL link handler for Windows...
echo.

reg add "HKCU\Software\Classes\chromeprofile" /ve /d "URL:Chrome Profile Link" /f >nul
reg add "HKCU\Software\Classes\chromeprofile" /v "URL Protocol" /t REG_SZ /d "" /f >nul
reg add "HKCU\Software\Classes\chromeprofile\DefaultIcon" /ve /d "%SystemRoot%\System32\shell32.dll,1" /f >nul
reg add "HKCU\Software\Classes\chromeprofile\shell\open\command" /ve /d "wscript.exe \"%SCRIPTDIR%launcher.vbs\" \"%%1\"" /f >nul

echo.
echo [SUCCESS] Protocol registered successfully!
echo chromeprofile:// links will now launch Google Chrome in the assigned profile.
echo.
pause
