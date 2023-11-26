#include <GUIConstantsEx.au3>
#include <WindowsConstants.au3>
#include <EditConstants.au3>
#include <GDIPlus.au3>

Global $bActiveSquadOnMapSync = False

Func createGUI()
	$hGUI = GUICreate("Auto SquadMortar 1.4", 400, 195, -1, -1, $WS_SIZEBOX + $WS_SYSMENU + $WS_MINIMIZEBOX)
	GUISetOnEvent($GUI_EVENT_CLOSE, "exitScript")
	GUISetBkColor(0x202225)
	$iLog = GUICtrlCreateEdit("", 10, 10, 380, 90, BitOR($ES_AUTOVSCROLL, $ES_AUTOHSCROLL, $ES_WANTRETURN, $WS_VSCROLL, $ES_READONLY))
	GUICtrlSetBkColor($iLog, 0x000000)
	GUICtrlSetColor($iLog, 0x4CFF00)
	loadDataLog($iLog)
	$hButton = GUICtrlCreateButton("Open SquadMortar Site", 10, 100, 380, 30)
	GUICtrlSetOnEvent(-1, "eventButtonOpenHTMLFileClick")

	$hButton = GUICtrlCreateButton("WinActive on MapSync", 10, 135, 125, 30)
	GUICtrlSetOnEvent(-1, "eventButtonActiveSquadClick")

	$hButton = GUICtrlCreateButton("Discord", 140, 135, 125, 30)
	GUICtrlSetOnEvent(-1, "eventButtonDiscordClick")
	$hButton = GUICtrlCreateButton("Github", 270, 135, 120, 30)
	GUICtrlSetOnEvent(-1, "eventButtonGithubClick")
	GUISetState(@SW_SHOW)
EndFunc   ;==>createGUI

Func eventButtonActiveSquadClick()
	$bActiveSquadOnMapSync = Not $bActiveSquadOnMapSync
	MsgBox(64, "Active Squad on Map Sync", "Window activate in Squad on Map Sync is now " & ($bActiveSquadOnMapSync ? "enabled" : "disabled"))
EndFunc   ;==>eventButtonActiveSquadClick

Func exitScript()
	ControlSend("Squad", "", "", "{a Up}")
	ControlSend("Squad", "", "", "{d Up}")
	ControlSend("Squad", "", "", "{w Up}")
	ControlSend("Squad", "", "", "{s Up}")
	ControlSend("Squad", "", "", "{i Up}")
	ControlSend("Squad", "", "", "{r Up}")
	ControlSend("Squad", "", "", "{o Up}")
	If ProcessExists("squadMortarServerSilent.exe") Then
		ProcessClose("squadMortarServerSilent.exe")
	EndIf
	_GDIPlus_Shutdown()
	Exit
EndFunc   ;==>exitScript

Func customConsole($iComponent, $sText, $bAppend = False)
	If $bAppend Then
		$sText = $sText & "	"
	Else
		$sText = $sText & @CRLF
	EndIf
	GUICtrlSetData($iComponent, $sText, 1)
EndFunc   ;==>customConsole


Func loadDataLog($iLogData)
	Sleep(100)
	GUICtrlSetData($iLogData, "")

	If WinExists("Squad") == 1 Then
		Local $aWinPos = WinGetClientSize("Squad")
		Eval("i" & $aWinPos[0] & "x" & $aWinPos[1])
		If Not @error Then
			customConsole($iLogData, "Size of game is correct :" & $aWinPos[0] & "x" & $aWinPos[1] & ".")
		Else
			customConsole($iLogData, "Size of game is incorrect correct: 1024x768, 1920x1080, 2560x1440")
			customConsole($iLogData, "Your size is: " & $aWinPos[0] & "x" & $aWinPos[1] & ".")
			customConsole($iLogData, "Restart Auto SquadMortar when fixed")
			customConsole($iLogData, "Usual Causes: Setting -> Display -> Scale & Layout put on 100%")
		EndIf
	Else
		customConsole($iLogData, "Squad not Active")
	EndIf
	customConsole($iLogData, "Set in Squad following options:")
	customConsole($iLogData, "CONTROLS -> INFANTRY -> FIRE/USE -> ALTERNATIVE = I")
	customConsole($iLogData, "CONTROLS -> INFANTRY -> AIM DOWN SIGHTS -> ALTERNATIVE = O")
	customConsole($iLogData, "Squad MUST be visible (It can't be covered).")
	customConsole($iLogData, "If you have only one Monitor play at 1024x768 in windowed mode.")
	customConsole($iLogData, "If you have two or more Monitor play all other resolutions in fullscreen and borderless only.")
	customConsole($iLogData, "Optional Improvements:")
	customConsole($iLogData, "Tab -> Right site of screen -> Map Icon Scale 0.3")
	customConsole($iLogData, "Tab -> Right site of screen -> Grid Opacity 0")
	customConsole($iLogData, "Sync Targets only works with Standard Mortar.", True)
EndFunc   ;==>loadDataLog


Func eventButtonGithubClick()
	ShellExecute("https://github.com/Devil4ngle/squadmortar/releases")
EndFunc   ;==>eventButtonGithubClick

Func eventButtonDiscordClick()
	ShellExecute("https://discord.gg/ghrksNETNA")
EndFunc   ;==>eventButtonDiscordClick

Func eventButtonOpenHTMLFileClick()
	ShellExecute("frontend\public\index.html", "", @ScriptDir, "open")
EndFunc   ;==>eventButtonOpenHTMLFileClick
