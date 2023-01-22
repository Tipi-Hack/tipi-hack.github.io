---
title: "Insomni'Hack Teaser 2023 - Autopsy"
authors: Crypt0-M3lon
layout: writeup
ctf_url: https://teaser.insomnihack.ch
---
Category: forensic, windows, realistic

## Challenge description

### Autopsy

> A malicious actor has broken our Active Directory server and we suspect an active persistent access in it. Unfortunately, the attacker was able to erase the server logs. Fortunately, we have monitored all malicious actions made on our network. Do you think you can find out how he could have kept access to our server?
> File: [autopsy.pcap](/assets/autopsy-ab20b6bccf3bb8afc0149c47280e84cf948bef9bb56843cd0d72ce38046c9c8e.pcap)


## Challenge resolution

### PCAP analysis and secrets extraction

By analyzing the PCAP, we can discover two types of communication:
* HTTP communication using WEBDAV in clear text
* DCE/RPC calls related to scheduled tasks. These calls are encrypted, so we need a password or a hash to decrypt the traffic.

If we take a deeper look to the WEBDAV browsed URL, we can identify that the malicious actor was very interested by the `NTDS.dit`, `SECURITY` and `SYSTEM` files. If the attacker was able to retrieve some files, the Wireshark "Export Objects -> HTTP" feature should allow us to extract them easily.

A simple order-by-size allows us to extract all three files:
![webdav file extraction](/assets/ins_teaser23-autopsy-webdav-files.png)

Then, it is possible to use `secretsdump` from impacket to extract domain secrets:
```
$ secretsdump.py -ntds ntds.dit -security SECURITY -system SYSTEM local
Impacket v0.9.24 - Copyright 2021 SecureAuth Corporation

[*] Target system bootKey: 0x805486c875e5e6992d3d2afeb72c6999
[*] Dumping cached domain logon information (domain/username:hash)
[*] Dumping LSA Secrets
[*] $MACHINE.ACC 
$MACHINE.ACC:plain_password_hex:230c30b271c9[...]8806d91056
$MACHINE.ACC: aad3b435b51404eeaad3b435b51404ee:c9c59098f8f050ad394b7369b76986f1
[*] DPAPI_SYSTEM 
dpapi_machinekey:0xf886ff495f92f889f3580bed92143aa26bdc300d
dpapi_userkey:0x3ea213645556520d1de3a38beaa29bf6dce646ee
[*] NL$KM 
 0000   AE 82 9A 9B 3F 82 34 D5  AE 77 E9 23 FC 42 EF A8   ....?.4..w.#.B..
 0010   D2 63 69 6E E4 08 FB BE  BF CB DC 3A 4D FD 08 0E   .cin.......:M...
 0020   7B F7 C3 EF E0 00 90 AA  04 9A 87 AB 65 BB A8 06   {...........e...
 0030   F4 01 4A 85 4C FE 13 39  A5 23 B9 51 F8 35 42 07   ..J.L..9.#.Q.5B.
NL$KM:ae829a9b3f8234d5ae77e923fc42efa8d263696ee408fbbebfcbdc3a4dfd080e7bf7c3efe00090aa049a87ab65bba806f4014a854cfe1339a523b951f8354207
[*] Dumping Domain Credentials (domain\uid:rid:lmhash:nthash)
[*] Searching for pekList, be patient
[*] PEK # 0 found and decrypted: d550dd0de3e2e8c1633034fd19049cef
[*] Reading and decrypting hashes from ntds.dit 
Administrator:500:aad3b435b51404eeaad3b435b51404ee:cf7c9b980dd43ae8f651d02fe20ac915:::
Guest:501:aad3b435b51404eeaad3b435b51404ee:31d6cfe0d16ae931b73c59d7e0c089c0:::
SUPERMAN$:1000:aad3b435b51404eeaad3b435b51404ee:c9c59098f8f050ad394b7369b76986f1:::
krbtgt:502:aad3b435b51404eeaad3b435b51404ee:5e696d38da69b2597fd1039bea113486:::
inscorp.com\adm-drp:1103:aad3b435b51404eeaad3b435b51404ee:5c4dbe6a8a44446f8d2899ff08ea14f2:::
[*] Kerberos keys from ntds.dit 
Administrator:aes256-cts-hmac-sha1-96:dc8af90d000bf2fe011b5637e46840f59efd7a9f36c974e6c92e098e3c40b247
Administrator:aes128-cts-hmac-sha1-96:2a3e3f78faa3f28b6ef4bac2273b305f
Administrator:des-cbc-md5:3862c83b865d80da
SUPERMAN$:aes256-cts-hmac-sha1-96:a7396d86f611e874622bd6c2b4ae742cbe4ed2f418e9b885ef37061fa398112a
SUPERMAN$:aes128-cts-hmac-sha1-96:e5a8b63dcc276332a466f9502f548273
SUPERMAN$:des-cbc-md5:3bb910319efe2a16
krbtgt:aes256-cts-hmac-sha1-96:e072886952ce6c9cc5ddd09e2191b807c003dd7a2cabf407d4ab4d7ae9993d03
krbtgt:aes128-cts-hmac-sha1-96:a14abd37bd7767441e20166f032f94cf
krbtgt:des-cbc-md5:54409104e0263243
inscorp.com\adm-drp:aes256-cts-hmac-sha1-96:6102c3cfc067ca5c989c40a7a34b4166536904e646704ada56b25fa0c07000d5
inscorp.com\adm-drp:aes128-cts-hmac-sha1-96:c7e5d32f0b9e7da9d4c8cabac07b9277
inscorp.com\adm-drp:des-cbc-md5:70ad4cdf7326dc62
[*] Cleaning up... 
```
Now we have secrets from the domain, but can we use them to decrypt DCE/RPC communications?

### The DCE/RPC decryption problem

One of our teammates, [@cnotin](https://twitter.com/cnotin/), recently wrote a blog post about [decrypting Kerberos/NTLM “encrypted stub data” in Wireshark](https://medium.com/tenable-techblog/decrypt-encrypted-stub-data-in-wireshark-deb132c076e7) (He also presented a workshop at Sharkfest 22 about it, [it's on Youtube](https://www.youtube.com/watch?v=5O1tKxEa1iY)), in which he explains how to decrypt Kerberos-encrypted communications using a keytab file, but here we have NTLMSSP-encrypted communication. He explains that it should be possible, as per the [Wireshark NTLMSSP documentation](https://wiki.wireshark.org/NTLMSSP.md):
> The "NT Password" setting can contain a password used to decrypt NTLM exchanges: both the NTLM challenge/response and further protocol payloads (like DCE/RPC that may be encrypted with keys derived from the NTLM authentication.
> Just input the user's password in the field. According to the source-code, only ASCII passwords are supported (due to the simple method for Unicode encoding). It doesn't seem to support NTLM hashes so make sure to use the cleartext password.

Here comes the problem: a clear-text ASCII password is needed, but all we have is an NTLM hash. We tried to crack the hash without success, was it even possible? By taking a look at the [wireshark code related to NTLMSSP decrypting](https://gitlab.com/wireshark/wireshark/-/blob/b71d87ed273fbadb92842d90ede49981ae1213e1/epan/dissectors/packet-ntlmssp.c#L512), we realize that the hash is calculated by Wireshark itself before decoding the communication. A dirty solution that worked, was to recompile Wireshark by adding the following code, on line 518, and recompile it:
```c
// Copy our hash directly in the variable
memcpy(nt_password_hash, "\x5c\x4d\xbe\x6a\x8a\x44\x44\x6f\x8d\x28\x99\xff\x08\xea\x14\xf2", NTLMSSP_KEY_LEN);
```

But could it be done properly? The answer is yes! When loading decryption key (aka NTLM hash), Wireshark is also looking at the Kerberos keytab file, eventually provided, using `read_keytab_file_from_preferences()`, and then iterates over each key to load its `keyvalue`. Why? Because, if the Kerberos encryption type is 23 (rc4-hmac), then the HT hash is directly equal to the RC4 encryption key, stored within the keytab. If our reading of the code is correct, it is possible to decrypt the DCE/RPC communication using a keytab: let's give it a try!

The first step is to forge a keytab using the previously retrieved hash. On Linux, `ktutil` can be used:
```
$ ktutil
ktutil:  addent -p adm-drp@inscorp.com -k 1 -key -e rc4-hmac
Key for adm-drp@inscorp.com (hex): 5c4dbe6a8a44446f8d2899ff08ea14f2
ktutil:  wkt ins.keytab
ktutil:  q
```

We can check that our keytab contains the inserted key with etype 23:
```
$ file ins.keytab 
ins.keytab: Kerberos Keytab file, realm=inscorp.com, principal=adm-drp/, type=91085, date=Wed May 19 11:41:52 2060, kvno=23
```

Perfect, now the keytab can be loaded in Wireshark under KRB5 options:
![krb5 load keytab](/assets/ins_teaser23-autopsy-kerberos-keytab.png)

Finally, just filter on the `dcerpc` packets, and look for interesting calls, such as `SchRpcRegisterTask`. The previously encrypted data is now decrypted:
![decrypted stub](/assets/ins_teaser23-autopsy-decrypted-stub.png)

All we have to do is copy the XML of the scheduled task, and get the flag:
```xml
<?xml version="1.0" encoding="UTF-16"?>
<Task version="1.2" xmlns="http://schemas.microsoft.com/windows/2004/02/mit/task">
  <Triggers>
    <CalendarTrigger>
      <StartBoundary>2015-07-15T20:35:13.2757294</StartBoundary>
      <Enabled>true</Enabled>
      <ScheduleByDay>
        <DaysInterval>1</DaysInterval>
      </ScheduleByDay>
    </CalendarTrigger>
  </Triggers>
  <Principals>
    <Principal id="LocalSystem">
      <UserId>S-1-5-18</UserId>
      <RunLevel>HighestAvailable</RunLevel>
    </Principal>
  </Principals>
  <Settings>
    <MultipleInstancesPolicy>IgnoreNew</MultipleInstancesPolicy>
    <DisallowStartIfOnBatteries>false</DisallowStartIfOnBatteries>
    <StopIfGoingOnBatteries>false</StopIfGoingOnBatteries>
    <AllowHardTerminate>true</AllowHardTerminate>
    <RunOnlyIfNetworkAvailable>false</RunOnlyIfNetworkAvailable>
    <IdleSettings>
      <StopOnIdleEnd>true</StopOnIdleEnd>
      <RestartOnIdle>false</RestartOnIdle>
    </IdleSettings>
    <AllowStartOnDemand>true</AllowStartOnDemand>
    <Enabled>true</Enabled>
    <Hidden>true</Hidden>
    <RunOnlyIfIdle>false</RunOnlyIfIdle>
    <WakeToRun>false</WakeToRun>
    <ExecutionTimeLimit>P3D</ExecutionTimeLimit>
    <Priority>7</Priority>
  </Settings>
  <Actions Context="LocalSystem">
    <Exec>
      <Command>cmd.exe</Command>
      <Arguments>/C net user Administrator INS{N1c3_j0b_Dud3_y0u_F0und_m3!}</Arguments>
    </Exec>
  </Actions>
</Task>   
```

The flag was `INS{N1c3_j0b_Dud3_y0u_F0und_m3!}`.
