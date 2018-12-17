---
title: Ph0wn - Chromecast
authors: Crypt0_M3lon
layout: writeup
ctf_url: http://ph0wn.org/
---
Category: Network

## Challenge description
This challenge required to plug a computer to a switch to analyze traffic. A TV displaying images from the Chromecast was available.

> Our company has just acquired a chromecast to display information for employees. However, we suspect that someone found a way to take control of what is displayed! We need you to help us on this! To avoid being detected when investigating, you will be allowed to connect to our local switch for 15min only. Please come and get a time slot at the organizer's desk. You may use ports 1 to 7 on the FortiSwitch. 
>
> **EDIT**: Make sure to take a close look at the images! 
>
> **EDIT2**: If you think you find the flag, but can't read it, come talk to us! Author: Roman

## Challenge resolution
After connecting to the switch, the first idea was to launch Wireshark and analyze the traffic. When the image displayed on the screen changed, we observed an HTTP request in Wireshark:
![](/assets/ph0wn-chromecast-wireshark.png){: .image }

All we had to do was to wait until the screen displayed the "Ph0wned" image and extract it from Wireshark. Then by playing with brightness we were able to identify some text:
![](/assets/ph0wn-chromecast-flag.png){: .image }

Unfortunatly, due to compression the flag was not readable. But it was enough to ask the valid flag to the admin :wink:
