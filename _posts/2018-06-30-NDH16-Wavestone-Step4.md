---
title: NDH16/Wavestone - Step 4 - The great interceptor
published: false # delete line when ready to publish
authors: Crypt0_M3lon,cnotin
layout: writeup
---

## Challenge description
> It seems that this Remote Access Trojan was not state-of-the-art, and black command windows keep appearing every time a command is run on the system.
> 
> This behavior alerted the boss who contacted the IT team. They set up a network sniffer to see what was going on. You can see their results in network_activity.pcap, but they did not manage to understand what the attacker did.
> 
> They reported the IP address to the authorities, who managed to localize the attacker and to search his house. The backup.tar.gz they have found on his computer might be of help to you.
> 
> Tip: don't hesitate to analyse the RAT binary you may have found from a previous challenge.
> 
> To validate the challenge, you have to send the following concatenation (+ being the concat symbol):
> 
> *Concat = 1 + 2 + 3 + 4 + 5*
> * 1 = Name of the victim's computer
> * 2 = Name of the new administrator
> * 3 = Name of the program dropped on disk
> * 4 = Registry key path to allow cleartext passwords (use HKLM / HKCU in HIVE\KeyPath\ValueName)
> * 5 = Password of the "wavestone" user


## Solution 

