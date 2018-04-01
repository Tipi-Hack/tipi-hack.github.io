---
title: Quals NDH 2018 - whereismypurse
authors: ZeArioch, Crypt0_M3lon
layout: writeup
published: false
---
Solves: 48 / Points: 200
## Challenge description
> Helps an important person to find the content of his numeric purse.
Attachments: whereismypurse.7z
## Challenge resolution
The archive attached to the challenge contains two files:
* `whereismypurse.vdi`: 8 GB, the extension points to VirtualBox hard drive file.
* `whereismypurse.raw`: 540 MB, since the other file is a hard drive we suppose this is a memory dump.

### Analyzing the .raw file
We start by checking the supposed RAM dump with Volatility:

```shell
vol.py -f ./whereismypurse.raw imageinfo
Volatility Foundation Volatility Framework 2.6
INFO    : volatility.debug    : Determining profile based on KDBG search...
          Suggested Profile(s) : Win7SP1x64, Win7SP0x64, Win2008R2SP0x64, Win2008R2SP1x64_23418, Win2008R2SP1x64, Win7SP1x64_23418
                     AS Layer1 : WindowsAMD64PagedMemory (Kernel AS)
                     AS Layer2 : VirtualBoxCoreDumpElf64 (Unnamed AS)
                     AS Layer3 : FileAddressSpace (/cases/whereismypurse/whereismypurse.raw)
                      PAE type : No PAE
                           DTB : 0x187000L
                          KDBG : 0xf800028070a0L
          Number of Processors : 1
     Image Type (Service Pack) : 1
                KPCR for CPU 0 : 0xfffff80002808d00L
             KUSER_SHARED_DATA : 0xfffff78000000000L
           Image date and time : 2017-12-26 16:53:32 UTC+0000
     Image local date and time : 2017-12-26 17:53:32 +0100
```

Definitely a memory dump! We start by listing processes to have an idea of what's going on:

```shell
vol.py -f ./whereismypurse.raw --profile=Win7SP1x64 -g 0xf800028070a0 pslist
Volatility Foundation Volatility Framework 2.6
Offset(V)          Name                    PID   PPID   Thds     Hnds   Sess  Wow64 Start                          Exit                          
------------------ -------------------- ------ ------ ------ -------- ------ ------ ------------------------------ ------------------------------
0xfffffa800069a040 System                    4      0     77      516 ------      0 2017-12-26 15:51:54 UTC+0000                                 
0xfffffa8000e2f770 smss.exe                232      4      2       29 ------      0 2017-12-26 15:51:54 UTC+0000                                 
[...]
0xfffffa800084e060 KeePassX.exe           2212   1804      4      268      1      1 2017-12-26 16:10:57 UTC+0000                                 
[...]
```

One process stands out of the usual Windows processes: `KeePassX`, a password manager. We are going to take a closer look and dump the process memory:

```shell
vol.py -f ./whereismypurse.raw --profile=Win7SP1x64 -g 0xf800028070a0 memdump -p 2212 -D .
Volatility Foundation Volatility Framework 2.6
************************************************************************
Writing KeePassX.exe [  2212] to 2212.dmp
```

Now, we want to look for interesting strings. Windows uses Unicode, specifically UTF-16 with little endian byte order. The SysInternals `strings` tool decodes such strings by default so we give it a try:

```PowerShell
PS> strings64.exe -n 8 .\2212.dmp | Select-String -context 10 -Pattern "(wallet|purse)"
[...]
  C:/Users/SatNak/Documents/mykeepass.kdb - KeePassX
  OLEChannelWnd
> decred wallet
[...]
> decred wallet
> Group:InternetCreation:26/12/2017Username:****Access:26/12/2017Password:****Modification:26/12/2017Attachment:Expiration:Jamais [-]URL:decred walletComment:pass to decrypt my purse
        font-weight
> on:Jamais [-]URL:Comment:pass to decrypt my purse :)
  nt-size : 10px;
        font-weight
  Adobe ImageReady
  Dupliquer l'entr
  W4lLet_!Passw0rd
```

Bingo on the last line! Also we can see that our user of interest is `SatNak`.

**Note:** the same result can be achieved with UNIX `strings`, but you will need to use the `-e l` switch to make it properly parse UTF-16 strings.

### Analyzing the .vdi file
To access the VDI file, we can go the traditional forensics route and use `qemu-img` to convert the file then an evidence management tool such as [FTK Imager](https://accessdata.com/product-download/ftk-imager-version-4.2.0)... Or go the quick n' dirty way and just use 7-Zip, proving yet again this tool will open just about anything:
![7zip]({{ site.url }}/assets/ndh18-whereismypurse-7zip.png)

Either way, we'll start by navigating the `SatNak` user folder. We find the following interesting items:
* A `decred` folder containing binaries related to the [Decred](https://www.decred.org/) crypto-currency,
![Decred]({{ site.url }}/assets/ndh18-whereismypurse-decred-binaries.png)
* Folders named `Dcrctl`, `Dcrd`, and `Dcrwallet` within the `AppData\Local` folder. 

We'll replicate the whole folder structure to a controlled environment. Then, after messing around for a while with the executables, we find the way to get what we want:
* Run `dcrd.exe`
* Run `dcrwallet.exe`
* Run `dcrctl.exe --wallet getbalance`
That last command displays the flag:
```
{
  "balances": [
    {
      "accountname": "flag{thx_you_found_my_wallet}",
      "immaturecoinbaserewards": 0,
      "immaturestakegeneration": 0,
      "lockedbytickets": 0,
      "spendable": 0,
[...]
 ```

 And we're done!