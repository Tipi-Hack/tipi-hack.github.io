---
title: AUCTF 2020 - Animal Crossing
authors: _MrB0b
layout: writeup
ctf_url: https://ctf.auburn.edu
---
Category: Forensics

## Challenge resolution

For this challenge, a [pcap](/assets/AUCTF-20-animalcrossing.pcapng) file was provided.

A quick look at the network traffic revealed that a DNS exfiltration was performed:

![pcap](/assets/AUCTF-20-chall_animal_crossing_pcap.png)

We then extracted all the DNS resolutions' queries for the `ad.quickbrownfoxes.org` domain using the following `tshark` command:

```
$ tshark -r animalcrossing.pcapng -T fields -e ip.src -e dns.qry.name -Y "dns.flags.response eq 0 and dns.qry.name contains ad.quickbrownfoxes.org"
```

After combining all sub-domains on a single file, we then decoded the base64 string:

```
$ cat animalcrossing_dns_query_b64_uniq.txt | sed ':a;N;$!ba;s/\n//g' | base64 -d
Did you ever hear the tragedy of Darth Plagueis The Wise? I thought not. It’s not a story the Jedi would tell you. It’s a Sith legend. Darth Plagueis was a Dark Lord of the Sith, so powerful and so wise he could use the Force to influence the midichlorians to create life… auctf{it_was_star_wars_all_along} He had such a knowledge of the dark side that he could even keep the ones he cared about from dying. The dark side of the Force is a pathway to many abilities some consider to be unnatural. He became so powerful… the only thing he was afraid of was losing his power, which eventually, of course, he did. Unfortunately, he taught his apprentice everything he knew, then his apprentice killed him in his sleep. Ironic. He could save others from death, but base64: entrée incorrecte
```

Thus revealing the flag:

```
auctf{it_was_star_wars_all_along}
```