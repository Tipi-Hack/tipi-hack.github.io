---
title: NDH16/Wavestone - Step 3 - Raise the dead
authors: Crypt0_M3lon
layout: writeup
---

## Challenge description
> Bad news! Our vice-boss seems to have been targeted as well. He received last week a USB key from a friend and installed some programs that were on it.
> 
> But this week, when he plugged it in his computer, the antivirus software raised an alert and deleted the file.
> 
> Can you help us retrieve the path of the file on the USB disk, like this: *\path\to\file*?

## Solution 
[TestDisk](https://www.cgsecurity.org/wiki/TestDisk) can be used to retrieve deleted files from a partition. One of the advantage over PhotoRec (same author) is that it conserves the original files paths. Initially, the challenge was solved using [Recuva](https://www.ccleaner.com/recuva) on Windows.

First, we launch TestDisk against the raw dump file:
```terminal
$ testdisk vboss-usb.raw
```
A module to browse the filesystem and retrieve deleted files can be found in the `Advanced` menu. The path to access it is: Select a media: `Proceed` -> Partition table type: `None` ->  `Advanced` -> `Undelete`.

Great, TestDisk finds many deleted files!
![TestDisk](/assets/ndh18-wavestone-testdisk.png){: .image }

We can dump all files, including deleted ones, by pressing `a` to select everything then `C` to dump.

Good! We have retrieved all the deleted files from the dump. We try to run `file` on all of them to identify potential suspicious files:
```terminal
$ find . -exec file {} \;
[...]
./Dolphin-x64/QtPlugins/imageformats/QGIF.DLL: PE32+ executable (DLL) (GUI) x86-64, for MS Windows
./Dolphin-x64/QtPlugins/imageformats/QICO.DLL: PE32+ executable (DLL) (GUI) x86-64, for MS Windows
./Dolphin-x64/QtPlugins/imageformats/QJPEG.DLL: PE32+ executable (DLL) (GUI) x86-64, for MS Windows
./Dolphin-x64/QtPlugins/imageformats/qpng.dll: PE32 executable (GUI) Intel 80386, for MS Windows, UPX compressed
./Dolphin-x64/QtPlugins/platforms: directory
./Dolphin-x64/QtPlugins/platforms/QMINIMAL.DLL: PE32+ executable (DLL) (GUI) x86-64, for MS Windows
[...]
```
`qpng.dll` looks very interesting, the file is a UPX-ed executable despite the .dll extension and note the lowercase name and extension. We try to flag with the path to the file and... it works!

The third flag is therefore **\Dolphin-x64\QtPlugins\imageformats\qpng.dll**.

*Note: according to the organizer, the file should have been the same that the one retrieved from step 2, then a simple hash comparison would have been sufficient to identify the malicious file. Unfortunately, the payload was UPX-ed in step 3 and not in step 2 ;)*
