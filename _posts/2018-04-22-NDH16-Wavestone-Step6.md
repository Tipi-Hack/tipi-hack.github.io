---
title: NDH16/Wavestone - Step 6 - Raiders of the lost file
published: false # delete line when ready to publish
authors: 0xTornado
layout: writeup
---

## Challenge description
> Oh no. We detected and eliminated the RAT on the vice-boss computer, but it managed to launch a ransomware before.
> 
> We quickly performed a memory dump of the computer, but  **one of the most important files has been encrypted**...
> 
> See if you can decrypt it and get the flag!
> 
> **Notice:**  this is a custom but real ransomware. However, the version you might find in memory does not delete the original files (phew!). However, for reverse sakes, do your analyses in a VM!

Note : The encrypted file was provided as : **Revolution.docx.wave**
## Solution 
Here we are, another gz file, let's extract the juicy memory dump.
```shell_session
root@kali:~/ndh16/step6# gzip -d 259338720a45a131e1ef701fa266f070.gz
```
Because I'm a lazy guy I always start with strings, sometimes it could be worthy, let's look for our vice-boss important file :
```shell_session
root@kali:~/ndh16/step6# strings 259338720a45a131e1ef701fa266f070 | grep Revolution.docx
```
Revolution.docx
Revolution.docx
Revolution.docx
Revolution.docx
Revolution.docx.wave
Revolution.docx.wave
Revolution.docx.wave
Revolution.docx.wave
Revolution.docx*
Wow, many files with the same name, let's pop Volatility and dig deeper. (Since I'm a nice guy, I won't skip the basics commands).
```shell_session
root@kali:~/ndh16/step6# volatility -f 259338720a45a131e1ef701fa266f070 imageinfo
Volatility Foundation Volatility Framework 2.6
INFO    : volatility.debug    : Determining profile based on KDBG search...
          Suggested Profile(s) : Win7SP1x64, Win7SP0x64, Win2008R2SP0x64, Win2008R2SP1x64_23418, Win2008R2SP1x64, Win7SP1x64_23418
                     AS Layer1 : WindowsAMD64PagedMemory (Kernel AS)
                     AS Layer2 : FileAddressSpace (/root/ndh16/step6/259338720a45a131e1ef701fa266f070)
                      PAE type : No PAE
                           DTB : 0x187000L
                          KDBG : 0xf800028560a0L
          Number of Processors : 2
     Image Type (Service Pack) : 1
                KPCR for CPU 0 : 0xfffff80002857d00L
                KPCR for CPU 1 : 0xfffff880009eb000L
             KUSER_SHARED_DATA : 0xfffff78000000000L
           Image date and time : 2018-06-22 15:21:47 UTC+0000
     Image local date and time : 2018-06-22 17:21:47 +0200
```
Grep is life, let's scan files on memory and look for the important one.
```shell_session
root@kali:~/ndh16/step6# volatility -f 259338720a45a131e1ef701fa266f070 --profile=Win7SP1x64 filescan | grep Revolution.docx
Volatility Foundation Volatility Framework 2.6
0x000000003ed6d530      2      0 RW---- \Device\HarddiskVolume2\Users\iznogoud\Desktop\Revolution.docx
```
Suprised again (not really), let's dump this file and see if it's the one we are looking for.
```shell_session
root@kali:~/ndh16/step6# volatility -f 259338720a45a131e1ef701fa266f070 --profile=Win7SP1x64 dumpfiles -Q 0x000000003ed6d530 --dump-dir dumped/
Volatility Foundation Volatility Framework 2.6
DataSectionObject 0x3ed6d530   None   \Device\HarddiskVolume2\Users\iznogoud\Desktop\Revolution.docx
```
Success, let's open our file and see if it contains something special :
```shell_session
root@kali:~/ndh16/step6# file dumped/file.None.0xfffffa8001068f10.dat 
dumped/file.None.0xfffffa8001068f10.dat: Microsoft Word 2007+
root@kali:~/ndh16/step6# mv dumped/file.None.0xfffffa8001068f10.dat dumped/Revolution.docx
```
Oups, the word document is corrupted, we can't open it. No problem, since we know that [docx files are ZIP archives](https://www.forensicswiki.org/wiki/Word_Document_(DOCX)), let's try otherwise. [Even Tay has told Paris Hilton about it.](https://twitter.com/SwiftOnSecurity/status/1013130217135755265) :p
```shell_session
root@kali:~/ndh16/step6# unzip dumped/Revolution.docx 
Archive:  dumped/Revolution.docx
  inflating: [Content_Types].xml     
  inflating: _rels/.rels             
  inflating: word/_rels/document.xml.rels  
  inflating: word/document.xml       
  inflating: word/footnotes.xml      
  inflating: word/endnotes.xml       
  inflating: word/theme/theme1.xml   
 extracting: word/media/image1.png   
  inflating: word/settings.xml       
  inflating: word/fontTable.xml      
  inflating: word/webSettings.xml    
  inflating: docProps/app.xml        
  inflating: word/styles.xml         
  inflating: docProps/core.xml
```
Let's see if we can still recover our data from document.xml file, by openening the file with a text editor we easilty spot the **flag**.
```xml
<w:t xml:space="preserve">Impressive, </w:t></w:r><w:proofErr w:type="spellStart"/><w:r><w:rPr><w:b/><w:sz w:val="48"/><w:lang w:val="en-US"/></w:rPr><w:t>huh</w:t></w:r><w:r w:rsidRPr="004B3C7D"><w:rPr><w:b/><w:sz w:val="4"/><w:szCs w:val="2"/><w:lang w:val="en-US"/></w:rPr><w:t>**flagbelow**</w:t></w:r><w:proofErr w:type="spellEnd"/></w:p><w:p w:rsidR="004B3C7D" w:rsidRPr="004B3C7D" w:rsidRDefault="004B3C7D" w:rsidP="004B3C7D"><w:pPr><w:jc w:val="center"/><w:rPr><w:b/><w:color w:val="FFFFFF" w:themeColor="background1"/><w:sz w:val="20"/><w:szCs w:val="20"/><w:lang w:val="en-US"/></w:rPr></w:pPr><w:r w:rsidRPr="004B3C7D"><w:rPr><w:b/><w:color w:val="FFFFFF" w:themeColor="background1"/><w:sz w:val="20"/><w:szCs w:val="20"/><w:lang w:val="en-US"/></w:rPr><w:t>WAVE{0dc621d0844f67a7d781b9fc4d5bf175}</w:t></w:r></w:p><w:sectPr w:rsidR="004B3C7D" w:rsidRPr="004B3C7D" w:rsidSect="004B3C7D"><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="709" w:right="1417" w:bottom="709" w:left="1417" w:header="708" w:footer="708" w:gutter="0"/><w:cols w:space="708"/><w:docGrid w:linePitch="360"/></w:sectPr></w:body></w:document>
```
W00t, no reverse needed, we got the **important file** containing the flag from memory & in just few minutes !
