Set-ItemProperty -Path "HKLM:\System\CurrentControlSet\Control\Terminal Server\WinStations\RDP-Tcp" -Name "UserAuthentication" -Type DWORD -Value 0 -Force
Restart-Service -Name "TermService" -Force
