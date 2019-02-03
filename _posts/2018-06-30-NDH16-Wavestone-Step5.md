---
title: NDH16/Wavestone - Step 5 - In memoriam
authors: cnotin,Crypt0_M3lon
layout: writeup
---

## Challenge description
> We managed to pull off some files from the vice-boss computer for you to work on.
> 
> We need to know some stuff about what was running, because we did not find anything under the standard user account ndh.
> 
> To validate the challenge, you have to send the following concatenation (+ being the concat symbol):
> 
> *Concat = 1 + 2 + 3 + 4 + 5 + 6*
> * 1 = Name of the victim's computer
> * 2 = Name of the compromised user
> * 3 = Password of the compromised user
> * 4 = Full location of the running malware on disk (c:\xxx)
> * 5 = Malware UID used to talk to the C2
> * 6 = Malware persistence location on disk (c:\xxx)


## Solution
### Reverse-engineering follow-up
We continue on the reverse-engineering that we started at the previous step to understand better this malware and how it persists on the machine.
*Since the binary is stripped, in the screenshots below many of the functions were renamed by ourselves based on our understanding, or guessing, of their roles.*

1. First step of persistence: it gets the value of the `TEMP` environment variable (TEMP folder) then obtains 4 random values with `BCryptGenRandom`. These values seem to be passed to a function that takes a format string with fields for all these values:
![](/assets/ndh18-wavestone-persistence_1_get_random_filename.png)
We conclude that the malware persists in the `%TEMP%` folder with a random named composed of "Kemel-", plus 4 random characters (`%c`), plus ".exe".

2. We see that the executable is stored in the folder and with the name prepared before. Then the `KemelUpdater` registry key is added in `HKCU:\Software\Microsoft\Windows\CurrentVersion\Run` to make it run when the users open their session:
![](/assets/ndh18-wavestone-persistence_2_download_exe.png)

3. The `COMPUTERNAME` and `USERNAME` environment variables are obtained, concatenated with a "|" in the middle and encoded to be sent to the C&C server. We also notice that the malware gets the value of the `HKCU:\Software\Redstone` registry key.
![](/assets/ndh18-wavestone-send_computername_and_username.png)

4. There is also code to remove the persistence by deleting the `KemelUpdater` registry key:
![](/assets/ndh18-wavestone-unpersistence.png)


### Memory dump analysis
Now, we need the flag! The easiest way to get the first three parts of the flag is to use the [Mimikatz Volatility plugin](https://github.com/sans-dfir/sift-files/blob/master/volatility/mimikatz.py)!
```console
# volatility --plugins=plugins/ -f memory --profile=Win7SP1x64 mimikatz
Volatility Foundation Volatility Framework 2.6
Module   User             Domain           Password                                
-------- ---------------- ---------------- ----------------------------------------
wdigest  iznogoud         VBOSS-PC         klif                                    
wdigest  ndh              VBOSS-PC         wavestone                               
wdigest  VBOSS-PC$        WORKGROUP    
```
Good, but there are two users. We need to discover what is the malicious process and its owner. However we have the first flag, "1 = Name of the victim's computer" = "VBOSS-PC".

For the remaining parts of the flag, we decide to use Volatility (see the next step writeup for the detailed instructions). Here is the process tree with the `pstree` command:
```console
# volatility -f memory --profile=Win7SP1x64 pstree
Volatility Foundation Volatility Framework 2.6
Name                                                  Pid   PPid   Thds   Hnds Time
-------------------------------------------------- ------ ------ ------ ------ ----
 0xfffffa8000ca1040:System                              4      0     85    533 2018-06-22 13:59:09 UTC+0000
. 0xfffffa800153a040:smss.exe                         256      4      3     30 2018-06-22 13:59:09 UTC+0000
 0xfffffa8000ca7060:wininit.exe                       384    316      3     79 2018-06-22 13:59:10 UTC+0000
. 0xfffffa8001d63850:services.exe                     480    384      8    191 2018-06-22 13:59:10 UTC+0000
.. 0xfffffa800202e960:svchost.exe                    1292    480     17    297 2018-06-22 13:59:12 UTC+0000
.. 0xfffffa8001df8060:VBoxService.ex                  656    480     12    121 2018-06-22 13:59:11 UTC+0000
.. 0xfffffa8001ed8b30:svchost.exe                     276    480     10    287 2018-06-22 13:59:11 UTC+0000
.. 0xfffffa800231c910:taskhost.exe                   2820    480      9    170 2018-06-22 14:00:10 UTC+0000
.. 0xfffffa8001fc0890:svchost.exe                    1180    480     18    303 2018-06-22 13:59:11 UTC+0000
.. 0xfffffa8001e51b30:svchost.exe                     800    480     19    453 2018-06-22 13:59:11 UTC+0000
... 0xfffffa8001ea9060:audiodg.exe                    960    800      5    128 2018-06-22 13:59:11 UTC+0000
.. 0xfffffa8001fa5b30:spoolsv.exe                    1152    480     13    290 2018-06-22 13:59:11 UTC+0000
.. 0xfffffa8000f09060:sppsvc.exe                     2676    480      6    144 2018-06-22 14:01:11 UTC+0000
.. 0xfffffa80022a0060:SearchIndexer.                 1728    480     14    708 2018-06-22 13:59:24 UTC+0000
... 0xfffffa8001095060:SearchProtocol                1160   1728      7    277 2018-06-22 14:04:24 UTC+0000
... 0xfffffa8000edc890:SearchFilterHo                2808   1728      5    100 2018-06-22 14:04:24 UTC+0000
.. 0xfffffa8001f11b30:svchost.exe                     608    480     15    370 2018-06-22 13:59:11 UTC+0000
.. 0xfffffa8002308b30:svchost.exe                    1392    480     13    321 2018-06-22 14:01:12 UTC+0000
.. 0xfffffa8001e769e0:svchost.exe                     852    480     20    408 2018-06-22 13:59:11 UTC+0000
... 0xfffffa80021c7060:dwm.exe                       2888    852      3     72 2018-06-22 14:00:10 UTC+0000
.. 0xfffffa8001ddf170:svchost.exe                     592    480     10    350 2018-06-22 13:59:11 UTC+0000
... 0xfffffa8000f5db30:WmiPrvSE.exe                  1524    592      6    115 2018-06-22 14:01:13 UTC+0000
... 0xfffffa80010be060:WmiPrvSE.exe                  2416    592      8    120 2018-06-22 14:05:53 UTC+0000
.. 0xfffffa8001e81960:svchost.exe                     884    480     28    849 2018-06-22 13:59:11 UTC+0000
.. 0xfffffa80021e2910:wmpnetwk.exe                   1812    480     13    444 2018-06-22 14:01:12 UTC+0000
.. 0xfffffa8001e15b30:svchost.exe                     720    480      9    277 2018-06-22 13:59:11 UTC+0000
. 0xfffffa8001d78700:lsass.exe                        488    384      8    578 2018-06-22 13:59:10 UTC+0000
. 0xfffffa8001d7db30:lsm.exe                          496    384     10    142 2018-06-22 13:59:10 UTC+0000
 0xfffffa8001438380:csrss.exe                         336    316      9    376 2018-06-22 13:59:10 UTC+0000
 0xfffffa8002246b30:explorer.exe                     2912   2876     36   1076 2018-06-22 14:00:10 UTC+0000
. 0xfffffa8000f42890:VBoxTray.exe                    2568   2912     12    152 2018-06-22 14:00:26 UTC+0000
. 0xfffffa80013ca060:regsvr32.exe                    2072   2912      0 ------ 2018-06-22 14:00:12 UTC+0000
. 0xfffffa8001039b30:svchost.exe                     1928   2912     12    374 2018-06-22 14:02:36 UTC+0000
.. 0xfffffa8002321b30:cmd.exe                        1356   1928      0 ------ 2018-06-22 14:04:01 UTC+0000
... 0xfffffa80010b0060:whoami.exe                    2608   1356      0 ------ 2018-06-22 14:04:01 UTC+0000
.. 0xfffffa80010b9060:cmd.exe                        2112   1928      0 ------ 2018-06-22 14:03:38 UTC+0000
. 0xfffffa8001091060:cmd.exe                         2312   2912      1     22 2018-06-22 14:04:30 UTC+0000
.. 0xfffffa8001095b30:DumpIt.exe                      568   2312      5     95 2018-06-22 14:05:53 UTC+0000
 0xfffffa80021b9b30:csrss.exe                        2604   2596      8    248 2018-06-22 14:00:07 UTC+0000
. 0xfffffa800104b910:conhost.exe                     2216   2604      2     54 2018-06-22 14:04:30 UTC+0000
 0xfffffa8002277910:winlogon.exe                     2628   2596      3    109 2018-06-22 14:00:07 UTC+0000
```

The following extract stands out:
```console
. 0xfffffa8001039b30:svchost.exe                     1928   2912     12    374 2018-06-22 14:02:36 UTC+0000
.. 0xfffffa8002321b30:cmd.exe                        1356   1928      0 ------ 2018-06-22 14:04:01 UTC+0000
... 0xfffffa80010b0060:whoami.exe                    2608   1356      0 ------ 2018-06-22 14:04:01 UTC+0000
```
We have the `whoami.exe` process, child of `cmd.exe` (this is what happens when you type `whoami` in a command prompt), which is a child of `svchost.exe` (PID 1928). This process is usually legitimate (it hosts services), however here we see that it is a child of `explorer.exe` which is uncommon. Let's dig further on this `svchost.exe` process with the [`psinfo` plugin](https://github.com/monnappa22/Psinfo).

```console
# volatility --plugins=plugins/ -f memory --profile=Win7SP1x64 psinfo -p 1928
Volatility Foundation Volatility Framework 2.6
Process Information:
	Process: svchost.exe PID: 1928
	Parent Process: explorer.exe PPID: 2912
	Creation Time: 2018-06-22 14:02:36 UTC+0000
	Process Base Name(PEB): svchost.exe
	Command Line(PEB): "C:\Windows\System32\dllhost\svchost.exe" 

[...]

Similar Processes:
C:\Windows\System32\dllhost\svchost.exe
	svchost.exe(1928) Parent:explorer.exe(2912) Start:2018-06-22 14:02:36 UTC+0000
C:\Windows\system32\svchost.exe
	svchost.exe(1292) Parent:services.exe(480) Start:2018-06-22 13:59:12 UTC+0000
C:\Windows\system32\svchost.exe
	svchost.exe(276) Parent:services.exe(480) Start:2018-06-22 13:59:11 UTC+0000
C:\Windows\system32\svchost.exe
	svchost.exe(1180) Parent:services.exe(480) Start:2018-06-22 13:59:11 UTC+0000
[...]
```
In the "similar processes" part we can see that usually `svchost.exe` is in `C:\Windows\system32\svchost.exe` and is a child of `services.exe`. This one definitely stands out!


Let's dump the executable, and the process memory with:
```console
# volatility -f memory --profile=Win7SP1x64 procdump -p 1928 --dump-dir dump
Volatility Foundation Volatility Framework 2.6
Process(V)         ImageBase          Name                 Result
------------------ ------------------ -------------------- ------
0xfffffa8001039b30 0x0000000001280000 svchost.exe          OK: executable.1928.exe

# volatility -f memory --profile=Win7SP1x64 memdump -p 1928 --dump-dir dump
Volatility Foundation Volatility Framework 2.6
************************************************************************
Writing svchost.exe [  1928] to 1928.dmp

# ls -lh dump/*1928*
-rw-r--r-- 1 root root 250M Jul  8 22:19 dump/1928.dmp
-rw-r--r-- 1 root root 115K Jul  8 22:18 dump/executable.1928.exe
```

We can easily confirm that we have spotted the right suspect!
```console
# strings executable.1928.exe  | grep -i "redstone\|kemel\|aperture"
RedStone Agent
westwood.aperture-science.fr
Software\Redstone
KemelUpdater
%s\Kemel-%c%c%c%c.exe
delivery.aperture-science.fr
C:\Users\marsault\source\repos\NdH-2k18-RedStone\Release\RedStone.pdb
```

We have discovered the fourth part of the flag "4 = Full location of the running malware on disk (c:\xxx)" = "C:\Windows\System32\dllhost\svchost.exe"

We still need to know the name of the infected user, remember? We use the `envars` plugin to get the environment variables of the process.
```console
# volatility --plugins=plugins/ -f memory --profile=Win7SP1x64 envars -p 1928
Volatility Foundation Volatility Framework 2.6
Pid      Process              Block              Variable                       Value
-------- -------------------- ------------------ ------------------------------ -----
[...]
    1928 svchost.exe          0x0000000000131320 SystemRoot                     C:\Windows
    1928 svchost.exe          0x0000000000131320 TEMP                           C:\Users\iznogoud\AppData\Local\Temp
    1928 svchost.exe          0x0000000000131320 TMP                            C:\Users\iznogoud\AppData\Local\Temp
    1928 svchost.exe          0x0000000000131320 USERDOMAIN                     VBOSS-PC
    1928 svchost.exe          0x0000000000131320 USERNAME                       iznogoud
[...]
```
Bingo! Using the information gathered with the `mimikatz` plugin, we have two more parts of the flag. "2 = Name of the compromised user" = "iznogoud" and "3 = Password of the compromised user" = "klif".

Now we need to dig in the process memory to find the information we are looking for. Especially the strings that have been constructed during the execution. For example, in the disassembly we discovered that the malware UID was sent as a GET parameter to the C&C with the URL `/159487.php?uid=%s`. Shall we try?
```console
# strings 1928.dmp | grep -i "uid="
T /159487.php?uid=6eb7ec101042487bd3eb72d49180a144 HTTP/1.1
tps://westwood.aperture-science.fr/159487.php?uid=6eb7ec101042487bd3eb72d49180a144
/159487.php?uid=6eb7ec101042487bd3eb72d49180a144
T /159487.php?uid=6eb7ec101042487bd3eb72d49180a144 HTTP/1.1
[...]
```
We discover the fifth part "5 = Malware UID used to talk to the C2" = "6eb7ec101042487bd3eb72d49180a144".


With the same very advanced `strings` technique (:wink:), we try to find the name and location of the persistent malware on disk. We know that its name is `Kemel-%c%c%c%c.exe` and that it is in the `%TEMP%` folder, so...
```console
# strings 1928.dmp | grep "Kemel-"
%s\Kemel-%c%c%c%c.exe
%s\Kemel-%c%c%c%c.exe
```
Bad luck this time... We found the pattern but not the specific value for this execution...

We remember that Windows uses Unicode UTF-16 (see also ["Quals NDH 2018 - Where is my Purse ?"]({% post_url 2018-04-01-quals-NDH-18-whereismypurse %})), so we can try again with the `-el` (`-e` for "encoding" and `l` for "16-bit littleendian" which is UTF-16).
```console
# strings -el 1928.dmp | grep "Kemel-"
Kemel-MHGa.exe
\Device\HarddiskVolume2\Users\iznogoud\AppData\Local\Temp\Kemel-MHGa.exe
<Kemel-MHGa.exe
C:\Users\iznogoud\AppData\Local\Temp\Kemel-MHGa.exe
Kemel-MHGa.exe
[...]
```

Bingo! 🎉

"6 = Malware persistence location on disk (c:\xxx)" = "C:\Users\iznogoud\AppData\Local\Temp\Kemel-MHGa.exe"

Finally, the flag is **VBOSS-PCiznogoudklifC:\Windows\System32\dllhost\svchost.exe6eb7ec101042487bd3eb72d49180a144C:\Users\iznogoud\AppData\Local\Temp\Kemel-MHGa.exe**
