' ==============================================================================
' Waply WhatsApp Gateway & Cloudflare Tunnel Auto-Start Script
' Dipicu otomatis oleh Windows Startup saat PC menyala / restart
' ==============================================================================

Option Explicit
Dim WshShell, fso, rootDir, logsDir, logFile, i, pingRes, isOnline

Set WshShell = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")

rootDir = "H:\WhatsApp Gateway"
logsDir = rootDir & "\logs"

' 1. Beri jeda 8 detik saat Windows baru boot agar driver & sistem siap
WScript.Sleep 8000

' 2. Pastikan drive H: dan direktori proyek sudah siap diakses
For i = 1 To 10
    If fso.FolderExists(rootDir) Then Exit For
    WScript.Sleep 1000
Next

' Pastikan direktori logs tersedia
If Not fso.FolderExists(logsDir) Then
    fso.CreateFolder(logsDir)
End If

' 3. Tunggu hingga koneksi internet aktif (ping Cloudflare DNS 1.1.1.1)
' Mencegah Cloudflared tunnel langsung crash karena belum ada internet saat baru hidup
isOnline = False
For i = 1 To 15
    pingRes = WshShell.Run("cmd /c ping -n 1 -w 1000 1.1.1.1 >nul 2>&1", 0, True)
    If pingRes = 0 Then
        isOnline = True
        Exit For
    End If
    WScript.Sleep 2000
Next

' 4. Jalankan Gateway Worker (Port 3002) di latar belakang
WshShell.Run "cmd /c ""cd /d " & rootDir & " && npm run dev:gateway >> logs\gateway.log 2>&1""", 0, False
WScript.Sleep 3000

' 5. Jalankan Next.js Web Server (Port 3001) di latar belakang
WshShell.Run "cmd /c ""cd /d " & rootDir & " && npm run dev:web >> logs\web.log 2>&1""", 0, False
WScript.Sleep 4000

' 6. Jalankan Cloudflare Tunnel di latar belakang
WshShell.Run "cmd /c ""C:\cloudflared\cloudflared.exe --protocol http2 tunnel run --token eyJhIjoiNzA5ZDMyMDQ0MzRlZmMxMmI5YzI1NWZhMGZhMjc1ZmUiLCJ0IjoiYjg5MWRjY2YtZGZlMS00ZDc3LWEyMzAtMmUyZTk4YWQ0MzgzIiwicyI6Ik1ETTFPRFk0Tm1FdE5EbGpNUzAwTkRrekxXSTRaamN0TlRVellqSTBZMlV5Tm1JMCJ9 >> logs\tunnel.log 2>&1""", 0, False

' 7. Catat status startup ke logs\startup.log
On Error Resume Next
Set logFile = fso.OpenTextFile(logsDir & "\startup.log", 8, True)
logFile.WriteLine "[" & Now & "] Waply background services started. Internet ready: " & isOnline
logFile.Close
On Error GoTo 0

Set logFile = Nothing
Set fso = Nothing
Set WshShell = Nothing
