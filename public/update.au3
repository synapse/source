#include <InetConstants.au3>
#include <MsgBoxConstants.au3>
#include <GUIConstantsEx.au3>
#include <StringConstants.au3>
#include <Array.au3>
#include <Crypt.au3>
#include <File.au3>


CheckVersion()

Func CheckVersion()
	; Save the downloaded file to the temporary folder.
	Local $sFilePath = @ScriptDir & "\update.info"

	; Download the file in the background with the selected option of 'force a reload from the remote site.'
	Local $hDownload = InetGet("http://www.getsourceapp.com/version", @ScriptDir & "\update.info", $INET_FORCERELOAD, $INET_DOWNLOADBACKGROUND)

	; Wait for the download to complete by monitoring when the 2nd index value of InetGetInfo returns True.
	Do
		Sleep(250)
	Until InetGetInfo($hDownload, $INET_DOWNLOADCOMPLETE)

	; Retrieve the number of total bytes received and the filesize.
	;Local $iBytesSize = InetGetInfo($hDownload, $INET_DOWNLOADREAD)
	;Local $iFileSize = FileGetSize($sFilePath)

   ; if the downloaded file exists
   If Not FileExists(@ScriptDir & "\update.info") Then
	  ;MsgBox(0, "Source Update", "The Source updater was unable to check ");
	  Exit;
   EndIf

   $info = FileReadToArray(@ScriptDir & "\update.info");
   ;_ArrayDisplay($info);

	; Close the handle returned by InetGet.
	InetClose($hDownload)

	; Display details about the total number of bytes read and the filesize.
	;MsgBox($MB_SYSTEMMODAL, "", "The total download size: " & $iBytesSize & @CRLF & _
	;		"The total filesize: " & $iFileSize)

	; Delete the file.
	;FileDelete($sFilePath)

   If UBound($info) > 2 Then

	  $version = FileReadLine(@ScriptDir & "\version", 1);

	  If $info[0] > $version Then

		 ; if the user needs to make a major update
		 If UBound($info) = 4 Then
			$ret = MsgBox(36, "Source Update", "A new major version of Source is available. Do you want to download it now? If you choose yes your default browser will be opened.")
			If $ret = 6 Then
			   ShellExecute("http://getsourceapp.com")
			EndIf
			Exit
		 EndIf

		 $return = MsgBox(36, "Source Update", "A new version of Source is available. Do you want to download it now?")
		 If $return = 6 Then
			DownloadVersion($info);
		 EndIf
	  EndIf

   EndIf

EndFunc


Func DownloadVersion($info)

	Local $sFilePath = @ScriptDir & "\resources\app.tmp"

	; delete the temp file in case it's there
   If FileExists($sFilePath) Then
	  FileDelete($sFilePath);
   EndIf

   Local $hDownload = InetGet($info[1], $sFilePath, $INET_FORCERELOAD, $INET_DOWNLOADBACKGROUND)

   Do
	  Sleep(250)
   Until InetGetInfo($hDownload, $INET_DOWNLOADCOMPLETE)


   ; if the downloaded file exists
   If Not FileExists(@ScriptDir & "\resources\app.tmp") Then
	  ;MsgBox(0, "Source Update", "The Source updater was unable to check ");
	  Exit;
   EndIf

   InetClose($hDownload)

   $dHash = _Crypt_HashFile($sFilePath, $CALG_MD5)

   If $dHash <> "0x"&$info[2] Then
	  MsgBox(0, "Source Update", "The downloaded file is damaged! Please restart Source and try again.");
	  Exit;
   EndIf

   MsgBox(0, "Source Update", "Source was updated successfully! In order to apply the changes close Source.");

   While ProcessExists("source.exe")
	  Sleep(500);
   WEnd

   FileMove( @ScriptDir & "\resources\app.asar", @ScriptDir & "\resources\app.old", 1);
   FileMove( @ScriptDir & "\resources\app.tmp", @ScriptDir & "\resources\app.asar", 1);
   FileDelete( @ScriptDir & "\resources\app.old");
   FileDelete(@ScriptDir & "\version")

   If Not FileExists(@ScriptDir & "\version") Then
	  _FileCreate(@ScriptDir & "\version")
   EndIf

   If Not FileWriteLine(@ScriptDir & "\version", $info[0]) Then
	  MsgBox(16, "Error updating local version file", @error)
   EndIf

   ShellExecute(@ScriptDir & "\source.exe");

EndFunc