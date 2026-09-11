Set WshShell = CreateObject("WScript.Shell")
WshShell.CurrentDirectory = "H:\WhatsApp Gateway"

' 1. Start Next.js Web server silently in background
WshShell.Run "cmd /c npm run dev:web", 0, False

' 2. Start Gateway Worker server silently in background
WshShell.Run "cmd /c npm run dev:gateway", 0, False

' 3. Start Cloudflare Tunnel silently in background
WshShell.Run "cmd /c C:\cloudflared\cloudflared.exe --protocol http2 tunnel run --token eyJhIjoiNzA5ZDMyMDQ0MzRlZmMxMmI5YzI1NWZhMGZhMjc1ZmUiLCJ0IjoiYjg5MWRjY2YtZGZlMS00ZDc3LWEyMzAtMmUyZTk4YWQ0MzgzIiwicyI6Ik1ETTFPRFk0Tm1FdE5EbGpNUzAwTkRrekxXSTRaamN0TlRVellqSTBZMlV5Tm1JMCJ9", 0, False

Set WshShell = Nothing
