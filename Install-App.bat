@echo off
setlocal
set "APPDIR=%~dp0"
set "EXEPATH=%APPDIR%dist\DreamsLab Cyber Launcher-win32-x64\DreamsLab Cyber Launcher.exe"

echo =========================================================
echo  DREAMSLABSTUDIO // Cyber Launcher Windows Setup
echo =========================================================
echo.
echo Installing DreamsLab Cyber Launcher on your PC...
echo.

:: 1. Register chromeprofile:// URL handler
reg add "HKCU\Software\Classes\chromeprofile" /ve /d "URL:Chrome Profile Link" /f >nul
reg add "HKCU\Software\Classes\chromeprofile" /v "URL Protocol" /t REG_SZ /d "" /f >nul
reg add "HKCU\Software\Classes\chromeprofile\DefaultIcon" /ve /d "%SystemRoot%\System32\shell32.dll,1" /f >nul
reg add "HKCU\Software\Classes\chromeprofile\shell\open\command" /ve /d "wscript.exe \"%APPDIR%launcher.vbs\" \"%%1\"" /f >nul

:: 2. Create Desktop Shortcut to Standalone .exe
powershell -NoProfile -Command "$Wsh = New-Object -ComObject WScript.Shell; $S = $Wsh.CreateShortcut(\"$HOME\Desktop\DreamsLab Cyber Launcher.lnk\"); $S.TargetPath = '%EXEPATH%'; $S.WorkingDirectory = '%APPDIR%dist\DreamsLab Cyber Launcher-win32-x64'; $S.Description = 'DREAMSLABSTUDIO Cyber Link Launcher'; $S.Save()"

echo [SUCCESS] Windows URL Protocol Registered!
echo [SUCCESS] Desktop Shortcut installed: "%USERPROFILE%\Desktop\DreamsLab Cyber Launcher.lnk"
echo.
echo Setup Complete! You can now launch "DreamsLab Cyber Launcher" directly from your Desktop.
echo.
pause
