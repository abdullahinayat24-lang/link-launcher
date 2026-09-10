Option Explicit

Dim rawArg, arg, prefix, slashPos, folderPart, urlPart
Dim chromePath, fso, shell

Set fso = CreateObject("Scripting.FileSystemObject")
Set shell = CreateObject("WScript.Shell")

If WScript.Arguments.Count < 1 Then
    WScript.Quit
End If

rawArg = WScript.Arguments(0)

prefix = "chromeprofile://"
If LCase(Left(rawArg, Len(prefix))) = prefix Then
    arg = Mid(rawArg, Len(prefix) + 1)
Else
    arg = rawArg
End If

' Windows sometimes appends a trailing slash
If Right(arg, 1) = "/" Then
    arg = Left(arg, Len(arg) - 1)
End If

slashPos = InStr(arg, "/")
If slashPos = 0 Then
    MsgBox "Link Launcher: Malformed Link Received." & vbCrLf & rawArg, vbExclamation, "DREAMSLABSTUDIO"
    WScript.Quit
End If

folderPart = URLDecode(Left(arg, slashPos - 1))
urlPart = URLDecode(Mid(arg, slashPos + 1))

If Trim(folderPart) = "" Then folderPart = "Default"

' Locate chrome.exe across common install locations
chromePath = ""
If fso.FileExists("C:\Program Files\Google\Chrome\Application\chrome.exe") Then
    chromePath = "C:\Program Files\Google\Chrome\Application\chrome.exe"
ElseIf fso.FileExists("C:\Program Files (x86)\Google\Chrome\Application\chrome.exe") Then
    chromePath = "C:\Program Files (x86)\Google\Chrome\Application\chrome.exe"
ElseIf fso.FileExists(shell.ExpandEnvironmentStrings("%LocalAppData%") & "\Google\Chrome\Application\chrome.exe") Then
    chromePath = shell.ExpandEnvironmentStrings("%LocalAppData%") & "\Google\Chrome\Application\chrome.exe"
Else
    chromePath = "chrome.exe"
End If

shell.Run """" & chromePath & """ --profile-directory=""" & folderPart & """ """ & urlPart & """", 1, False

Function URLDecode(str)
    Dim i, c, code, result
    result = ""
    i = 1
    Do While i <= Len(str)
        c = Mid(str, i, 1)
        If c = "%" And i + 2 <= Len(str) Then
            code = Mid(str, i + 1, 2)
            result = result & Chr(CLng("&H" & code))
            i = i + 3
        ElseIf c = "+" Then
            result = result & " "
            i = i + 1
        Else
            result = result & c
            i = i + 1
        End If
    Loop
    URLDecode = result
End Function
