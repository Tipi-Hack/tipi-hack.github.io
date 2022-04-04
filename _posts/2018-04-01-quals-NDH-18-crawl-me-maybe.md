---
title: Quals NDH 2018 - Crawl me maybe
authors: _MrB0b
layout: writeup
ctf_url: https://nuitduhack.com/
---
Solves: 47 / Points: 100 / Category: Web
## Challenge description
> A website test if a web page validity. You can provide this page by url only. Find a way to find and get the flag.
![Challenge description](/assets/ndh18-crawl-me-maybe-challenge_description.png)

## Challenge resolution
This challenge was pretty straightforward.

The web application only presented the following form:
![Challenge interface](/assets/ndh18-crawl-me-maybe-challenge_interface.png)

When a site like `www.google.com` was provided, the application fetched the HTML page and printed its contents:
![HTML Result](/assets/ndh18-crawl-me-maybe-result.png)

While manipulating the only parameter sent (`url`), the following stack trace was returned by the web server:
![Stack trace](/assets/ndh18-crawl-me-maybe-stacktrace.png)

This error page disclosed the actual source code of the aplication as well as the software version:
![WEBrick version](/assets/ndh18-crawl-me-maybe-webrick_version.png)

A quick look for exploits revealed that the application was vulnerable to path traversal attacks:
![Path traversal](/assets/ndh18-crawl-me-maybe-path_traversal.png)

After a little bit of digging, the application also turned out to be vulnerable to OS command injection:
![OS command injection](/assets/ndh18-crawl-me-maybe-OS_command_injection.png)

From there, we found the flag was located in a subdirectory of the user `challenge` home folder:
![Flag location](/assets/ndh18-crawl-me-maybe-flag_location.png)

However, as the strings `flag` and `txt` were prohibited, the following error message was returned:
![Attack detected!](/assets/ndh18-crawl-me-maybe-attack_detected.png)

We thus used the `find` command to search for files in the `/home/challenge/src` folder that we displayed using the "cat" command:
![Final payload](/assets/ndh18-crawl-me-maybe-final_payload.png)

And... bingo!

![The flag!](/assets/ndh18-crawl-me-maybe-flag.png)
