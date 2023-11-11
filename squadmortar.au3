#Region ;**** Directives created by AutoIt3Wrapper_GUI ****
#AutoIt3Wrapper_Icon=resources\icon.ico
#AutoIt3Wrapper_UseX64=y
#EndRegion ;**** Directives created by AutoIt3Wrapper_GUI ****

#include <ScreenCapture.au3>
#include <GDIPlus.au3>
#include "autoit_libraries/UWPOCR.au3"
#include "autoit_libraries/common.au3"
#include "autoit_libraries/GUI.au3"
#include <SendMessage.au3>
#include <WindowsConstants.au3>
#include <ScrollBarConstants.au3>


; Enables GUI events
Opt("GUIOnEventMode", 1)
; Disable Caps for better background
Opt("SendCapslockMode", 0)
; Set window Mode for PixelSearch
Opt("PixelCoordMode", 0)
; Set window Mode for MouseClick
Opt("MouseCoordMode", 0)


Global $aCoordinatesRange[0]
Global $aCoordinatesAngle[0]
Global $hWnd = WinGetHandle("Squad")
Global $aCoordinates[3][5][4]

Const $i1024x768 = 0
Const $i1920x1080 = 1
Const $i2560x1440 = 2
Const $iMortarAngleOcr = 0
Const $iMortarRangeOcr = 1
Const $iMortarRangeLine = 2
Const $iIsMapActive = 3
Const $iMapCoordinates = 4

setCoordinates()
createGUI()
If WinExists("Squad") == 1 Then
	Local $aWinPos = WinGetPos("Squad")
	Global $iResolution = Eval("i" & $aWinPos[2] & "x" & $aWinPos[3])
	DirRemove("frontend/public/merged", 1)
	DirCreate("frontend/public/merged")
	DirRemove("runtime", 1)
	DirCreate("runtime")
	Run("js_scripts/squadMortarServerSilent.exe")
	AdlibRegister("syncMap", 500)
	runSquadMortar()
Else
	While 1
		Sleep(10)
	WEnd
EndIf
Func runSquadMortar()
	Local $bOnlyOneTarget = False
	While True
		Sleep(1000)
		syncCoordinates()
		PixelSearch(100, 100, 100, 100, "0x000000", 0, 1, $hWnd)
		If @error Then
			Sleep(1000)
			ContinueLoop
		EndIf
		For $i = 0 To UBound($aCoordinatesRange) - 1

			;ConsoleWrite('Range from sync  ' & $aCoordinatesRange[$i] & @CRLF)
			;ConsoleWrite('Angle from sync ' & $aCoordinatesAngle[$i] & @CRLF)

			If Not $bOnlyOneTarget Then

				While (True)
					PixelSearch($aCoordinates[$iResolution][$iMortarRangeLine][0], $aCoordinates[$iResolution][$iMortarRangeLine][1], $aCoordinates[$iResolution][$iMortarRangeLine][2], $aCoordinates[$iResolution][$iMortarRangeLine][3], "0x000000", 0, 1, $hWnd)
					If Not @error Then
						$iRangeOcr = Number(getOCRRange())
						If Not @error And $iRangeOcr > 809 And $iRangeOcr < 1581 Then
							If $iRangeOcr == $aCoordinatesRange[$i] Then
								ExitLoop
							EndIf
							Local $fTimes
							If $iRangeOcr < $aCoordinatesRange[$i] Then
								$fTimes = ($aCoordinatesRange[$i] - $iRangeOcr) / 10
								$sKey = "w"
							EndIf
							If $iRangeOcr > $aCoordinatesRange[$i] Then
								$fTimes = ($iRangeOcr - $aCoordinatesRange[$i]) / 10
								$sKey = "s"
							EndIf
							cSend($fTimes * 62.5, 0, $sKey)
							ExitLoop
						EndIf
					EndIf
					cSend(0, 0, "w")
				WEnd

				While (True)
					$fAngleOcr = Number(getOCRAngle(), 3)
					If Not @error And $fAngleOcr > 0 And $fAngleOcr < 360 Then
						If $fAngleOcr == $aCoordinatesAngle[$i] Then
							ExitLoop
						EndIf
						Local $fTimes
						Local $fDiff = $aCoordinatesAngle[$i] - $fAngleOcr
						If $fDiff < -180 Then $fDiff += 360
						If $fDiff > 180 Then $fDiff -= 360
						If $fDiff > 0 Then
							$fTimes = $fDiff
							$sKey = "d"
						Else
							$fTimes = -$fDiff
							$sKey = "a"
						EndIf
						cSend($fTimes * 19.98, 0, $sKey)
						ExitLoop
					EndIf
					cSend(0, 0, "d")
				WEnd
			EndIf

			PixelSearch(100, 100, 100, 100, "0x000000", 0, 1, $hWnd)
			If @error Then
				ExitLoop
			EndIf

			cSend(20, 1900, "i")
			cSend(20, 1900, "i")
			cSend(20, 1900, "i")
			cSend(0, 4000, "r")
			cSend(0, 100, "o")
			$aCoordinatesAngleCopy = $aCoordinatesAngle
			$aCoordinatesRangeCopy = $aCoordinatesRange
			syncCoordinates()
			If Not arrayCompare($aCoordinatesAngleCopy, $aCoordinatesAngle) Or Not arrayCompare($aCoordinatesRangeCopy, $aCoordinatesRange) Then
				$bOnlyOneTarget = False
				ExitLoop
			EndIf
			If UBound($aCoordinatesRange) == 1 Then
				$bOnlyOneTarget = True
			Else
				$bOnlyOneTarget = False
			EndIf
		Next
	WEnd
EndFunc   ;==>runSquadMortar

Func getOCRRange()
	_GDIPlus_Startup()
	Local $hHBitmap = _ScreenCapture_CaptureWnd("", "Squad", $aCoordinates[$iResolution][$iMortarRangeOcr][0], $aCoordinates[$iResolution][$iMortarRangeOcr][1], $aCoordinates[$iResolution][$iMortarRangeOcr][2], $aCoordinates[$iResolution][$iMortarRangeOcr][3], False)
	Local $hBitmap = _GDIPlus_BitmapCreateFromHBITMAP($hHBitmap)
	Local $aDim = _GDIPlus_ImageGetDimension($hBitmap)
	$hBitmap = _GDIPlus_ImageResize($hBitmap, $aDim[0] * 2, $aDim[1] * 2)
	$hEffect = _GDIPlus_EffectCreateBrightnessContrast(0, 60)
	_GDIPlus_BitmapApplyEffect($hBitmap, $hEffect)
	Local $iWidth = _GDIPlus_ImageGetWidth($hBitmap)
	Local $iHeight = _GDIPlus_ImageGetHeight($hBitmap)
	Local $iIncrease = $iWidth * 2
	Local $hBitmapBuffered = _GDIPlus_BitmapCreateFromScan0($iWidth + $iIncrease, $iHeight + $iIncrease)
	Local $hGraphics = _GDIPlus_ImageGetGraphicsContext($hBitmapBuffered)
	_GDIPlus_GraphicsClear($hGraphics, 0xFFFFFFFF)
	_GDIPlus_GraphicsDrawImageRect($hGraphics, $hBitmap, $iIncrease / 2, $iIncrease / 2, $iWidth, $iHeight)
	Local $sOCRTextResult = _UWPOCR_GetText($hBitmapBuffered, Default, True)

	;ConsoleWrite("OCR RANGE: " & $sOCRTextResult & @CRLF)
	;_GDIPlus_ImageSaveToFile($hBitmapBuffered, "range.bmp")
	;Exit

	_WinAPI_DeleteObject($hHBitmap)
	_GDIPlus_BitmapDispose($hBitmap)
	_GDIPlus_BitmapDispose($hBitmapBuffered)
	_GDIPlus_Shutdown()

	If $sOCRTextResult <> "" Then
		Return StringRegExpReplace($sOCRTextResult, "[^0-9]", "")
	EndIf
	Return $sOCRTextResult
EndFunc   ;==>getOCRRange

Func getOCRAngle()
	_GDIPlus_Startup()
	Local $hHBitmap = _ScreenCapture_CaptureWnd("", "Squad", $aCoordinates[$iResolution][$iMortarAngleOcr][0], $aCoordinates[$iResolution][$iMortarAngleOcr][1], $aCoordinates[$iResolution][$iMortarAngleOcr][2], $aCoordinates[$iResolution][$iMortarAngleOcr][3], False)
	Local $hBitmap = _GDIPlus_BitmapCreateFromHBITMAP($hHBitmap)
	Local $aDim = _GDIPlus_ImageGetDimension($hBitmap)
	$hBitmap = _GDIPlus_ImageResize($hBitmap, $aDim[0] * 2, $aDim[1] * 2)
	$hEffect = _GDIPlus_EffectCreateBrightnessContrast(0, 60)
	_GDIPlus_BitmapApplyEffect($hBitmap, $hEffect)
	Local $iWidth = _GDIPlus_ImageGetWidth($hBitmap)
	Local $iHeight = _GDIPlus_ImageGetHeight($hBitmap)
	Local $iIncrease = $iWidth * 2
	Local $hBitmapBuffered = _GDIPlus_BitmapCreateFromScan0($iWidth + $iIncrease, $iHeight + $iIncrease)
	Local $hGraphics = _GDIPlus_ImageGetGraphicsContext($hBitmapBuffered)
	_GDIPlus_GraphicsClear($hGraphics, 0xFFFFFF)
	_GDIPlus_GraphicsDrawImageRect($hGraphics, $hBitmap, $iIncrease / 2, $iIncrease / 2, $iWidth, $iHeight)
	Local $sOCRTextResult = _UWPOCR_GetText($hBitmapBuffered, Default, True)

	;ConsoleWrite("OCR ANGLE: " & $sOCRTextResult & @CRLF)
	;_GDIPlus_ImageSaveToFile($hBitmapBuffered, "angle.bmp")
	;Exit

	_WinAPI_DeleteObject($hHBitmap)
	_GDIPlus_BitmapDispose($hBitmap)
	_GDIPlus_BitmapDispose($hBitmapBuffered)
	_GDIPlus_Shutdown()
	If $sOCRTextResult <> "" Then
		Return StringRegExpReplace($sOCRTextResult, "[^0-9.]", "")
	EndIf
	Return $sOCRTextResult
EndFunc   ;==>getOCRAngle

Func syncCoordinates()
	ReDim $aCoordinatesRange[0]
	ReDim $aCoordinatesAngle[0]
	Local $sFileContent = FileRead("runtime/coordinates.txt")
	If @error Then
		Return
	EndIf
	If $sFileContent == "" Then
		Return
	EndIf
	Local $aReadCoordinates = StringSplit($sFileContent, ";", 2)
	Local $iArraySize = UBound($aReadCoordinates)
	ReDim $aCoordinatesRange[$iArraySize]
	ReDim $aCoordinatesAngle[$iArraySize]
	For $i = 0 To $iArraySize - 1
		Local $aCoordinate = StringSplit($aReadCoordinates[$i], ",", 2)
		If UBound($aCoordinate) = 2 Then
			$aCoordinatesRange[$i] = $aCoordinate[0]
			$aCoordinatesAngle[$i] = $aCoordinate[1]
		EndIf
	Next
EndFunc   ;==>syncCoordinates

Func syncMap()
	Local $sFileContent = FileRead("runtime/refreshmap.txt")
	If @error Then
		Return
	EndIf
	If $sFileContent == "" Then
		Return
	EndIf
	Local $hFile = FileOpen("runtime/refreshmap.txt", 2)
	If $hFile = -1 Then
		Exit
	EndIf
	FileWrite($hFile, "")
	FileClose($hFile)
	PixelSearch($aCoordinates[$iResolution][$iIsMapActive][0], $aCoordinates[$iResolution][$iIsMapActive][1], $aCoordinates[$iResolution][$iIsMapActive][2], $aCoordinates[$iResolution][$iIsMapActive][3], "0xFFFFFF", 0, 1, $hWnd)
	If @error Then
		ControlSend("Squad", "", "", "{m}")
		Sleep(300)
	EndIf
	_MouseWheelPlus("Squad", "down", 30)
	Sleep(400)
	Local $hHBitmap = _ScreenCapture_CaptureWnd("", "Squad", $aCoordinates[$iResolution][$iMapCoordinates][0], $aCoordinates[$iResolution][$iMapCoordinates][1], $aCoordinates[$iResolution][$iMapCoordinates][2], $aCoordinates[$iResolution][$iMapCoordinates][3], False)
	_ScreenCapture_SaveImage("runtime/screenshot.png", $hHBitmap)
	Local $sImageNames = StringSplit($sFileContent, ";", 2)
	Run("./js_scripts/imageLayeringSilent runtime/screenshot.png frontend/public/" & $sImageNames[0] & " frontend/public/merged/merged_" & $sImageNames[1] & ".png")
	;ConsoleWrite("Screenshot taken" & @CRLF)

EndFunc   ;==>syncMap

Func setCoordinates()

	;=================================================== 1024x768
	$aCoordinates[$i1024x768][$iMortarAngleOcr][0] = 497
	$aCoordinates[$i1024x768][$iMortarAngleOcr][1] = 779
	$aCoordinates[$i1024x768][$iMortarAngleOcr][2] = 532
	$aCoordinates[$i1024x768][$iMortarAngleOcr][3] = 786

	$aCoordinates[$i1024x768][$iMortarRangeOcr][0] = 207
	$aCoordinates[$i1024x768][$iMortarRangeOcr][1] = 400
	$aCoordinates[$i1024x768][$iMortarRangeOcr][2] = 256
	$aCoordinates[$i1024x768][$iMortarRangeOcr][3] = 430

	$aCoordinates[$i1024x768][$iMortarRangeLine][0] = 262
	$aCoordinates[$i1024x768][$iMortarRangeLine][1] = 412
	$aCoordinates[$i1024x768][$iMortarRangeLine][2] = 262
	$aCoordinates[$i1024x768][$iMortarRangeLine][3] = 416

	$aCoordinates[$i1024x768][$iIsMapActive][0] = 700
	$aCoordinates[$i1024x768][$iIsMapActive][1] = 133
	$aCoordinates[$i1024x768][$iIsMapActive][2] = 900
	$aCoordinates[$i1024x768][$iIsMapActive][3] = 133

	$aCoordinates[$i1024x768][$iMapCoordinates][0] = 577
	$aCoordinates[$i1024x768][$iMapCoordinates][1] = 224
	$aCoordinates[$i1024x768][$iMapCoordinates][2] = 1017
	$aCoordinates[$i1024x768][$iMapCoordinates][3] = 662

	;=================================================== 1920x108
	$aCoordinates[$i1920x1080][$iMortarAngleOcr][0] = 938
	$aCoordinates[$i1920x1080][$iMortarAngleOcr][1] = 1052
	$aCoordinates[$i1920x1080][$iMortarAngleOcr][2] = 980
	$aCoordinates[$i1920x1080][$iMortarAngleOcr][3] = 1063

	$aCoordinates[$i1920x1080][$iMortarRangeOcr][0] = 541
	$aCoordinates[$i1920x1080][$iMortarRangeOcr][1] = 513
	$aCoordinates[$i1920x1080][$iMortarRangeOcr][2] = 605
	$aCoordinates[$i1920x1080][$iMortarRangeOcr][3] = 560

	$aCoordinates[$i1920x1080][$iMortarRangeLine][0] = 593
	$aCoordinates[$i1920x1080][$iMortarRangeLine][1] = 536
	$aCoordinates[$i1920x1080][$iMortarRangeLine][2] = 593
	$aCoordinates[$i1920x1080][$iMortarRangeLine][3] = 543

	$aCoordinates[$i1920x1080][$iIsMapActive][0] = 1050
	$aCoordinates[$i1920x1080][$iIsMapActive][1] = 141
	$aCoordinates[$i1920x1080][$iIsMapActive][2] = 1500
	$aCoordinates[$i1920x1080][$iIsMapActive][3] = 141

	$aCoordinates[$i1920x1080][$iMapCoordinates][0] = 1086
	$aCoordinates[$i1920x1080][$iMapCoordinates][1] = 195
	$aCoordinates[$i1920x1080][$iMapCoordinates][2] = 1855
	$aCoordinates[$i1920x1080][$iMapCoordinates][3] = 964

	;=================================================== 2560x1440
	$aCoordinates[$i2560x1440][$iMortarAngleOcr][0] = 1250
	$aCoordinates[$i2560x1440][$iMortarAngleOcr][1] = 1403
	$aCoordinates[$i2560x1440][$iMortarAngleOcr][2] = 1305
	$aCoordinates[$i2560x1440][$iMortarAngleOcr][3] = 1417

	$aCoordinates[$i2560x1440][$iMortarRangeOcr][0] = 725
	$aCoordinates[$i2560x1440][$iMortarRangeOcr][1] = 688
	$aCoordinates[$i2560x1440][$iMortarRangeOcr][2] = 798
	$aCoordinates[$i2560x1440][$iMortarRangeOcr][3] = 750

	$aCoordinates[$i2560x1440][$iMortarRangeLine][0] = 795
	$aCoordinates[$i2560x1440][$iMortarRangeLine][1] = 710
	$aCoordinates[$i2560x1440][$iMortarRangeLine][2] = 795
	$aCoordinates[$i2560x1440][$iMortarRangeLine][3] = 730

	$aCoordinates[$i2560x1440][$iIsMapActive][0] = 1900
	$aCoordinates[$i2560x1440][$iIsMapActive][1] = 190
	$aCoordinates[$i2560x1440][$iIsMapActive][2] = 2200
	$aCoordinates[$i2560x1440][$iIsMapActive][3] = 190

	$aCoordinates[$i2560x1440][$iMapCoordinates][0] = 1477
	$aCoordinates[$i2560x1440][$iMapCoordinates][1] = 260
	$aCoordinates[$i2560x1440][$iMapCoordinates][2] = 2473
	$aCoordinates[$i2560x1440][$iMapCoordinates][3] = 1286

EndFunc   ;==>setCoordinates
