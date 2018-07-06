---
title: NDH16/Wavestone - Step 3 - Raise the dead
published: false # delete line when ready to publish
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
On Linux, Testdisk can be used to retrieve deleted file from a partition. One of the advantage over Photorec is that it conserves the original path of files. Initialy, the challenge was solved using Recuva on Windows.

First, we need to launch Testdisk against a raw dump file:
```bash
$ testdisk vboss-usb.raw
```
A module to browse the filesystem and retrieve deleted files can be found in the `Advanced` menu. The path to access it is : Select a media: `Proceed` -> Partition table type: `None` ->  `Advanced` -> `Undelete`.
Great, Testdisk found many deleted files!
![Testdisk](/assets/ndh18-wavestone-testdisk.png)

We can dump all files, including deleted one, by pressing `a` to select everything and `C` to dump.

Good! We have retrived all the deleted files from the dump. Maybe we can try to run `file` to identity suspicious result:
```bash
$ find . -exec sh -c "file {};" \;
[...]
./Dolphin-x64/QtPlugins/imageformats/QGIF.DLL: PE32+ executable (DLL) (GUI) x86-64, for MS Windows
./Dolphin-x64/QtPlugins/imageformats/QICO.DLL: PE32+ executable (DLL) (GUI) x86-64, for MS Windows
./Dolphin-x64/QtPlugins/imageformats/QJPEG.DLL: PE32+ executable (DLL) (GUI) x86-64, for MS Windows
./Dolphin-x64/QtPlugins/imageformats/qpng.dll: PE32 executable (GUI) Intel 80386, for MS Windows, UPX compressed
./Dolphin-x64/QtPlugins/platforms: directory
./Dolphin-x64/QtPlugins/platforms/QMINIMAL.DLL: PE32+ executable (DLL) (GUI) x86-64, for MS Windows
[...]
```
`qpng.dll` looks very interesting, the file is a UPXed PE despite the .dll extension and note the lowercase name and extension. We try to validate with path to the file and ... it works!

The third flag is **/Dolphin-x64/QtPlugins/imageformats/qpng.dll**.

*Note: according to the organizer, the file should have been the same that the one retrieved from step 2, then a simple hash comparison would have been sufficient to identify the malicious file. Unfortunately, the payload was UPXed in step 3 and not in step 2 ;)*