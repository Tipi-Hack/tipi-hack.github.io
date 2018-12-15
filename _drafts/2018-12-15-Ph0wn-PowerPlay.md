---
title: Ph0wn - PowerPlay
authors: cnotin
layout: writeup
ctf_url: http://ph0wn.org/
---
Category: Misc

## Challenge description
In this challenge we were provided with a smart plug and we knew we could connect to it via Wi-Fi. The SSID was written on the side.

> The invasion has started.
> 
> The alien force is trying to take over the power. Literally.
> 
> Something has gone horribly wrong with this smart plug. And I wanted to make
> everything right. I set a strong password to make sure nobody fiddles with the
> configuration of this fragile piece of IoT, and yet here we are ...
> 
> Please help me. I've noted the plug's WiFi on its side, I trust you to know how to handle this computer stuff. 
> 
> Ah, one last thing: I wouldn't pair this thing with my smartphone. Ever. Really not. I'm serious. That's not a joke. YOU COULD BRICK THIS PIECE OF ART.

## Challenge resolution
The Wi-Fi was open so we just joined it. We obtained a private IP address via DHCP. The `.1` IP was the one of the device.

A quick `nmap` showed that 2 services were avaible: Telnet on TCP/23 and Web on TCP/80. We quickly discovered that the manufacturer was *Meross* and found an [interesting writeup on a Meross MSS110 vulnerability](https://garrettmiller.github.io/meross-mss110-vuln/).

The writeup explains that Telnet works with `admin/<blank>` which indeed worked on the provided device. The writeup explains that the Wi-Fi configuration, including password, could be leaked but it was empty.

As described, the web interface allowed us to change the password but it did not give something new since we were already able to connect to Telnet:
![](/assets/ph0wn-powerplay-web.png){: .image }

By browsing the available menus (hint: use the `help` command), we discovered that under the `cfg` menu, the `prof show` command allowed to dump the configuration, including the flag :wink::
![](/assets/ph0wn-powerplay-flag.png){: .image }

We actually lost some time since the first smart plug we used was reseted and did not contain the flag. But we had the good idea to try with another one!