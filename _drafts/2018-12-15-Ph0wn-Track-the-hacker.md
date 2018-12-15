---
title: Ph0wn - Track the hacker
authors: cnotin
layout: writeup
---
Category: Misc

## Challenge description
This challenge was the next step of [Save the factory]({% post_url 2018-12-15-Ph0wn-Save-the-factory %}). We were told that the hacker found a way to store data, some kind of file, and we were asked to find it.

## Challenge resolution
Like previously, we discovered that many nodes were standing out. They were named `frg_<number>`, like *"fragment number..."*.
* Using the `uals` tool:
![](/assets/ph0wn-track_the_hacker-uals.png){: .image }

* Using the provided interactive Python shell:
![](/assets/ph0wn-track_the_hacker-script.png){: .image }

Their values were hex encoded. We retrieved them and sorted the nodes based on the number in their name.

But a simple mistake cost us a lot of time: the leading zeros were missing from the output (i.e. a 2-bytes value `0x0123` would have been displayed `123` with the first `0` missing).

After adding the leading zeros, we concatenated all values (using the `Hxd` hexadecimal editor on Windows). The `file` command on the output file looked promising:
![](/assets/ph0wn-track_the_hacker-gzip.png){: .image }

We expanded the file with `gunzip` and spotted the flag directly in the output:
![](/assets/ph0wn-track_the_hacker-flag.png){: .image }

The flag was mixed with garbage since it was actually contained in a Tar archive:
![](/assets/ph0wn-track_the_hacker-tar.png){: .image }
