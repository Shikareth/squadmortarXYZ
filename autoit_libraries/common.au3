Func arrayCompare(Const ByRef $aArray1, Const ByRef $aArray2)
	; Check Subscripts
	$aArray1NumDimensions = UBound($aArray1, 0)
	$aArray2NumDimensions = UBound($aArray2, 0)

	; Static Variables
	Static $bArrayMatch
	Static $sEvaluationString = ""
	Static $iDimension = 0

	If $iDimension = 0 Then
		If $aArray1NumDimensions <> $aArray2NumDimensions Then
			Return SetError(1, 0, False)
		EndIf

		If $aArray1NumDimensions = 0 Then
			Return SetError(2, 0, False)
		EndIf
	EndIf

	Switch $iDimension
		Case 0
			; Start the iterations
			$bArrayMatch = True
			$iDimension = 1
			arrayCompare($aArray1, $aArray2)
			$iDimension = 0
		Case Else
			; Save string to revert back
			$sOldString = $sEvaluationString

			For $i = 0 To (UBound($aArray1, $iDimension) - 1)
				; Add dimension to the string
				$sEvaluationString &= "[" & $i & "]"

				If $iDimension = $aArray1NumDimensions Then
					; Evaluate the string
					$bArrayMatch = Execute("$aArray1" & $sEvaluationString & " = $aArray2" & $sEvaluationString)

				Else
					; Call the function for the next dimension
					$iDimension += 1
					arrayCompare($aArray1, $aArray2)
					$iDimension -= 1
				EndIf

				; Revert to old string
				$sEvaluationString = $sOldString

				; Dump out after the first mismatch
				If $bArrayMatch = False Then
					ExitLoop
				EndIf
			Next
	EndSwitch
	Return $bArrayMatch
EndFunc   ;==>arrayCompare



Func _MouseWheelPlus($Window, $direction, $clicks)
	Local $WM_MOUSEWHEEL = 0x020A
	$MouseCoord = MouseGetPos()
	$X = $MouseCoord[0]
	$Y = $MouseCoord[1]
	If $direction = "up" Then
		$WheelDelta = 120
	Else
		$WheelDelta = -120
	EndIf
	For $i = 0 To $clicks
		DllCall("user32.dll", "int", "SendMessage", _
				"hwnd", WinGetHandle($Window), _
				"int", $WM_MOUSEWHEEL, _
				"long", _MakeLong(0, $WheelDelta), _
				"long", _MakeLong($X, $Y))
	Next
EndFunc   ;==>_MouseWheelPlus

Func _MakeLong($LoWord, $HiWord)
	Return BitOR($HiWord * 0x10000, BitAND($LoWord, 0xFFFF))
EndFunc   ;==>_MakeLong


Func cSend($iPressDelay, $iPostPressDelay = 0, $sKey = "Up")
	ControlSend("Squad", "", "", "{" & $sKey & " Down}")
	Sleep($iPressDelay)
	ControlSend("Squad", "", "", "{" & $sKey & " Up}")
	Sleep($iPostPressDelay)
	Return
EndFunc   ;==>cSend