---
title: BreizhCTF 2k18 - Dickcrypt
authors: cnotin
layout: writeup
---
Solves: ?? / Points: 75 / Category: Crypto

## Challenge description
> Chef, un p'tit flag, on a soif ! feat gr4nd J0j0
We get a Python script implementing a server (find the [full script in appendix](#python-script-from-the-challenge)) and the IP and the port where we could contact this service.

The server takes a raw value and returns it encrypted and base64-encoded.

Our goal is given in the Python script: we have an encrypted value to decrypt. Of course, the value of the secret key is redacted from the given script.

Note: the original version of the challenge was broken. We wasted a bit of time before reporting it, then it was quickly fixed!

## Challenge resolution
### Observation
The plaintext is processed character by character. The character is converted to its ASCII then binary form, with the "0b" prefix removed:
```python
c = bin(ord(char))[2:]
```
For example, 'A' is 65 in decimal which gives '1000001' in binary:
```python
>>> bin(ord('A'))[2:]
'1000001'
```

Then if the resulting script is shorter than 8 characters, '0' characteres are prepended. Therefore, in the previous 'A' example, we obtain the `'01000001'` string.
This padding was unfortunately missing in the first version of this challenge. You will understand later why it is important.

Every character is processed like this and appended to form a new plaintext string.
This plaintext string is now padded and encrypted with AES in ECB-mode with the secret key.
```python
    plain = pad(cipher)
    algo = AES.new(KEY, AES.MODE_ECB)
    return algo.encrypt(plain)
```

AES is secure: everything should be fine, isn't it? :thinking:

### ECB mode
In AES the block size is of 16 octets:
```python
>>> from Crypto.Cipher import AES
>>> print AES.block_size
16
```
This value is also reminded in the script.

The [ECB mode](https://en.wikipedia.org/wiki/Block_cipher_mode_of_operation#Electronic_Codebook_(ECB)) has famous weaknesses. Here we will exploit the fact that each block is encrypted independently.

Given the fact that each character is transformed into 8 characters (of binary digits), and that the block size is 16, we know that each block only holds 2 characters of original plaintext.
```AA -> 01000001 01000001 -> 1x block```

### Exploit
We can ask the server to encrypt every two-letters combinations and use this as a decryption dictionnary.

Here is the Python script we can use for this:
```python
from pwn import *
import string
import itertools

out = open("dico.txt", "w)")

conn = remote("148.60.87.243", 13000)
conn.recvuntil(">>> ")

for test in itertools.product(string.digits + string.letters + string.punctuation, repeat=2):
    test = "".join(test)
    out.write(test)
    conn.sendline(test)
    resp = conn.recvuntil(">>> ").split("\r\n")[0].decode("base64").encode("hex")
    out.write(resp)
```

We suppose that the flag is composed of letters, digits and punctuation characters.
```python
>>> import string
>>> len(string.digits + string.letters + string.punctuation)
94
```

Thus this makes 94*94 = 8 836 combinations of two-letters to ask for encryption, which is totally reasonable. This script could be improved by sending a longer plaintext to encrypt and by cutting the answer into independent blocks.
E.g. ask to encrypt "ABCD" or more and receive two blocks, the first with the encryption of "AB" and the second with the encryption of "CD".

We use the following Python script to split the encrypted text that we have to decrypt, into its 16 octets blocks:
```python
enc = "r88MbGH77/JvAR5bqB2FFoPyW3a+TNQgPneNmMLWx337iz8b7ho0qV7WzQ1BoNZ9iLK+P2eEcYptlaip5k/\
PRLTlN1gCOz7RZ7IAVk0Pjr57fgWuFprJA3u7/74TjwCL/HWAVkKVzus6Rb7K+GQQnxaYGhm8vQGU3UaF7u2KiaspEw\
L2jX/9JG+Aj46DUPpIZMw/F/tJJK/806A/HiLli+wKORIu9lQt8HSWCIy02achHsclTyZpSnLjlIuBwqyTs4y95bpO5\
QucsKFjfOiVHw==".decode("base64")

for i in range(0, (len(enc) / 16)):
    print enc[i * 16: (i + 1) * 16].encode("hex")
```

The script prints:
```
afcf0c6c61fbeff26f011e5ba81d8516
83f25b76be4cd4203e778d98c2d6c77d
fb8b3f1bee1a34a95ed6cd0d41a0d67d
88b2be3f6784718a6d95a8a9e64fcf44
b4e53758023b3ed167b200564d0f8ebe
7b7e05ae169ac9037bbbffbe138f008b
fc7580564295ceeb3a45becaf864109f
16981a19bcbd0194dd4685eeed8a89ab
291302f68d7ffd246f808f8e8350fa48
64cc3f17fb4924affcd3a03f1e22e58b
ec0a39122ef6542df07496088cb4d9a7
211ec7254f26694a72e3948b81c2ac93
b38cbde5ba4ee50b9cb0a1637ce8951f
```

Here are the relevant extracts from the `dico.txt` file previously generated:
```
...
0_
291302f68d7ffd246f808f8e8350fa48b38cbde5ba4ee50b9cb0a1637ce8951f
0j
16981a19bcbd0194dd4685eeed8a89abb38cbde5ba4ee50b9cb0a1637ce8951f
Ru
64cc3f17fb4924affcd3a03f1e22e58bb38cbde5ba4ee50b9cb0a1637ce8951f
_J
fc7580564295ceeb3a45becaf864109fb38cbde5ba4ee50b9cb0a1637ce8951f
bz
afcf0c6c61fbeff26f011e5ba81d8516b38cbde5ba4ee50b9cb0a1637ce8951f
hc
83f25b76be4cd4203e778d98c2d6c77db38cbde5ba4ee50b9cb0a1637ce8951f
l3
ec0a39122ef6542df07496088cb4d9a7b38cbde5ba4ee50b9cb0a1637ce8951f
nd
7b7e05ae169ac9037bbbffbe138f008bb38cbde5ba4ee50b9cb0a1637ce8951f
r4
b4e53758023b3ed167b200564d0f8ebeb38cbde5ba4ee50b9cb0a1637ce8951f
tf
fb8b3f1bee1a34a95ed6cd0d41a0d67db38cbde5ba4ee50b9cb0a1637ce8951f
z}
211ec7254f26694a72e3948b81c2ac93b38cbde5ba4ee50b9cb0a1637ce8951f
{G
88b2be3f6784718a6d95a8a9e64fcf44b38cbde5ba4ee50b9cb0a1637ce8951f
...
```
Due to the padding, the output consists of two blocks with the second one having always the same value (that is the padding).

### Resolution
We see that the first block of encrypted data `afcf0c6c61fbeff26f011e5ba81d8516` is linked to the cleartext `bz`. We do the same for the next blocks and finally we get the entire flag two letters by two letters:
```
bzhctf{Gr4nd_J0j0_Rul3z}
```

We could have improved even more our Python script by fully automating all steps in order. However, during CTFs, we prefer to do quick and efficient prototyping and not proper software engineering :ok_hand:

### Conclusion
Home-made cryptography and ECB mode are bad. But I trust you already knew it :wink:

* * *

## Python script from the challenge
```python
from Crypto.Cipher import AES
import base64

KEY = "_REDACTED_"
BLOCK_SIZE = 16
pad = lambda s: s + (BLOCK_SIZE - len(s) % BLOCK_SIZE) * \
                    chr(BLOCK_SIZE - len(s) % BLOCK_SIZE)
unpad = lambda s: s[:-ord(s[len(s) - 1:])]


def encrypt(plain):
    cipher = ""
    for char in plain:
        c = bin(ord(char))[2:]
        if len(c) < 8:
            c = "%s%s" % ("0" * (8 - len(c)), c)
        cipher = "%s%s" % (cipher, c)

    plain = pad(cipher)
    #    algo = AES.new(KEY, AES.MODE_ECB, plain[:BLOCK_SIZE])
    algo = AES.new(KEY, AES.MODE_ECB)

    return algo.encrypt(plain)


if __name__ == "__main__":
    finished = False
    print("(exit to quit, other will be ciphered)")
    while not finished:
        data_in = raw_input(">>> ")
        if data_in == "exit":
            finished = True
            continue
        print(base64.b64encode(encrypt(data_in)))

"""
Uncipher me : r88MbGH77/JvAR5bqB2FFoPyW3a+TNQgPneNmMLWx337iz8b7ho0qV7WzQ1BoNZ9iLK+P2eEcYptlaip5k/PRLTlN1gCOz7RZ7IAVk0Pjr57fgWuFprJA3u7/74TjwCL/HWAVkKVzus6Rb7K+GQQnxaYGhm8vQGU3UaF7u2KiaspEwL2jX/9JG+Aj46DUPpIZMw/F/tJJK/806A/HiLli+wKORIu9lQt8HSWCIy02achHsclTyZpSnLjlIuBwqyTs4y95bpO5QucsKFjfOiVHw==
"""
```