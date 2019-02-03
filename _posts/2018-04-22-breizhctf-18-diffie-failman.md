---
title: BreizhCTF 2k18 - Diffie-Failman - strike back
authors: cnotin
layout: writeup
ctf_url: https://www.breizhctf.com/
---
Solves: 16% / Points: 200 / Category: Crypto

## Challenge description
> Do you remember diffie failman last year ? I've patched all the vulns ! (i think...)

Fortunately we have already solved the [similarly named challenged of last year](https://securite.intrinsec.com/2017/05/01/breizhctf-2017/) :wink:

We get a ZIP file with a Python script implementing a server and a client, (find the [full script in appendix](#python-script-from-the-challenge)) and a pcap capture with only one TCP exchange.

The goal is clear: understand the script implementing the crypto, find a flaw, then decrypt the exchange!

## Challenge resolution
### Observation
The TCP exchange in the pcap is the following (client -> server in red, server -> client in blue):
![pcap exchange](/assets/breizhctf18-diffie-failman-pcap.png)

Before the encrypted communication, we see some parameters exchanged in clear:
- Client -> server
  - prime
  - public_key
  - group
- Server -> client
  - public_key

### Code analysis advice
In this kind of challenge, you must understand exactly what values are generated on which side, the ones that are exchanged and the ones that are kept private, etc.
We recommend to draw on paper a quick [sequence diagram](https://www.ibm.com/developerworks/rational/library/3101.html) (UML, anyone? :stuck_out_tongue:).

It makes it easier to understand the values we observe in the capture and not get lost.

### Code analysis
The `encrypt` and `decrypt` functions are core to the script. They take as parameters the message and a key which is, in both the client and server cases, called `shared_key`.

This key comes from:
```python
shared_key = derivate_psk(pre_shared_key)
```

The `derivate_psk` function is really simple as it only computes a SHA256 hash from the input:
```python
def derivate_psk(psk):
    return hashlib.sha256(str(psk)).digest()
```

Then where does the `pre_shared_key` comes from? Just a line before we have:
```python
pre_shared_key = (key_exchange_data["public_key"] ** private_key) % key_exchange_data["prime"]
```
Note that in Python, `**` is the power operator (exponent), not a simple multiply operator.

If you know cryptography, you have already noticed a [modular exponentation](https://en.wikipedia.org/wiki/Modular_exponentiation). Otherwise, it is not a problem, since this is not required to solve the challenge.

### Obtaining the missing values
In summary, we can compute the `shared_key` and decrypt the messages, as soon as we have the following values:
- `key_exchange_data["public_key"]`
- `private_key`
- `key_exchange_data["prime"]`

As hinted in their names, we already have `key_exchange_data["public_key"]` and `key_exchange_data["prime"]` since they are exchanged in clear before the encrypted communication.

We are only missing the `private_key`...

Here is how it is generated:
```python
private_key = randint(2**(size-1), 2**size)
```

Let's see in Python how large is the space where the `private_key` is randomly selected:
```python
>>> from Crypto.Cipher import AES
>>> size = AES.block_size
>>> 2**(size-1)
32768
>>> 2**size
65536
```
From 32768 to 65536 is a very small space with small numbers to get a cryptographic private key :open_mouth:

We also notice how the `public_key` is obtained. It is slightly different in the client and the server but the arguments are the same:
```python
public_key = (key_exchange_data["group"]**private_key) % key_exchange_data["prime"]
```

Based on these two observations we see that we can guess the `private_key` by bruteforcing every possible value that gives the `public_key` we observed.

### Bruteforce time
We use the following simple Python script to obtain candidate `private_key` values:
```python
from Crypto.Cipher import AES

size = AES.block_size

group = 33776
prime = 47143

for private in range(2 ** (size - 1), 2 ** size):
    public = (group ** private) % prime
    if public == 1691:
        print private
```

There is only a few thousands values to test, but the script is slow, so we only collect the first few candidate `private_key` values.

We extract from Wireshark the encrypted messages as hex values and we try to decrypt them with the following Python script:
```python
import hashlib

from Crypto.Cipher import AES

# required functions, copied from the original challenge script
pad = lambda s: s + (size - len(s) % size) * chr(size - len(s) % size)
unpad = lambda s: s[0:-ord(s[-1])]


def derivate_psk(psk):
    return hashlib.sha256(str(psk)).digest()


def decrypt(message, key):
    IV = message[:size]
    aes = AES.new(key, AES.MODE_CBC, IV)
    return unpad(aes.decrypt(message[size:]))


# observed in the pcap exchange
group = 33776
prime = 47143
public = 1691

size = AES.block_size

msgs = []

# observed in the pcap exchange, we just have to remove unnecessary spaces and parse them as hex
for msg in ([
    "cf 98 83 b9 f4 3d 70 80  38 9b 00 44 5d 9a 68 36  6b 4d 70 2b f8 2f 2f 05  05 af 80 17 8c b8 74 d0 ",
    "8f e5 e9 a2 f8 0b 51 6a  b7 03 35 03 da ed bf 8f   ca 59 87 d4 41 b5 46 69  e2 18 61 ff bd 70 06 4f",

    "c2 d4 bb 4f 98 39 6f fa  05 9e 48 99 19 7c ae 6d28 ad d2 21 10 33 c3 91  ac 90 56 97 c4 1b 30 bd88 19\
     6d b8 14 e0 39 66  30 f5 2a 20 ec 7a 22 dd7b 29 55 b0 b9 5b f9 b2  99 87 65 10 72 8f a5 58",

    "d7 50 66 f1 96 25 ba 3b  36 ab cc a7 09 88 1e 6b     74 19 ee c6 2c 04 3c eb  a4 3f 73 7d 55 8c 0e 7d  ",
    "e0 13 94 a0 2e 5c 40 a5  89 89 95 f9 ef bd 95 57  b6 ac a6 24 64 08 15 1b  3c 1c dc b4 a6 55 fa 30 86 58 \
    98 15 6e f9 c8 2b  2c 2d 19 4c 02 fd 0c 5000 73 3b 3f ab c5 de 96  41 21 9f 24 0f 37 69 1e   6e 80 42 e1 \
    26 21 0a d2  5e f4 c3 19 fa 40 15 a171 6f dc d1 b4 33 27 5b  25 ff 4e d5 39 b6 0a 79   ",

    "    78 47 85 e9 9f 30 3f 4e  3c 6e dc c1 21 0d 96 10   db 17 b8 e5 8b 83 6f ef  76 aa 80 3f eb 23 eb 85   "
]):
    msgs.append(msg.replace(" ", "").decode("hex"))

# candidate private_key values obtained previously
privates = (34240,
            36859,
            39478,
            42097,
            44716,
            47335)

# try to decrypt every message with every private key
for secret_message in msgs:
    for private in privates:
        pre_shared_key = (public ** private) % prime
        shared_key = derivate_psk(pre_shared_key)
        message = decrypt(secret_message, shared_key)
        print message
```

The output is the following:
```
Hi !
Hello :)
I finally understood how diffie-hellman works !
Good man !
Hey, I can give you the flag now : bzhctf{D1ff13_1s_n0t_my_fr13nd}
Thx !
```

(We removed every duplicate message from the output since all the candidate private keys are valid and give the same `shared_key` value!)

### Conclusion
Now that the CTF is over and that we obtained the flag `bzhctf{D1ff13_1s_n0t_my_fr13nd}`, it is a good time to read more about the [Diffie–Hellman key exchange](https://en.wikipedia.org/wiki/Diffie%E2%80%93Hellman_key_exchange).
> The Diffie–Hellman key exchange method allows two parties that have no prior knowledge of each other to jointly establish a shared secret key over an insecure channel. This key can then be used to encrypt subsequent communications using a symmetric key cipher.

Isn't it awesome? And contrary to this custom implementation, it is not flawed! :relieved:

* * *

## Python script from the challenge
```python
from Crypto.Cipher import AES
from Crypto import Random
from random import randint
import hashlib
import socket
import json
import sys

size = AES.block_size
server = "0.0.0.0"
is_server = True
shared_key = ''

pad = lambda s: s + (size - len(s) % size) * chr(size - len(s) % size)
unpad = lambda s : s[0:-ord(s[-1])]

def encrypt(message, key):
    message = pad(message)
    IV = Random.new().read(size)
    aes= AES.new(key, AES.MODE_CBC, IV)
    return "%s%s" % (IV, aes.encrypt(message))

def decrypt(message, key):
    IV = message[:size]
    aes = AES.new(key, AES.MODE_CBC, IV)
    return unpad(aes.decrypt(message[size:]))

def is_prime(num, test_count):
    if num == 1:
        return False
    if test_count >= num:
        test_count = num - 1
    for x in range(test_count):
        val = randint(1, num - 1)
        if pow(val, num-1, num) != 1:
            return False
    return True

def generate_prime(n):
    found_prime = False
    while not found_prime:
        p = randint(2**(n-1), 2**n)
        if is_prime(p, 1000):
            return p

def derivate_psk(psk):
    return hashlib.sha256(str(psk)).digest()


if __name__ == "__main__":

    s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)

    if len(sys.argv) > 1:
        server = sys.argv[1]
        is_server = False

    try:
        if is_server:
            print("Start server")
            s.bind((server, 31337))
            while True:
                s.listen(1024)
                client, accept = s.accept()
                key_exchange_data_json = client.recv(1024)
                key_exchange_data = json.loads(key_exchange_data_json)
                private_key = randint(2**(size-1), 2**size)
                public_key = (key_exchange_data["group"]**private_key) % key_exchange_data["prime"]
                client.send(json.dumps({"public_key": public_key}))
                pre_shared_key = (key_exchange_data["public_key"] ** private_key) % key_exchange_data["prime"]
                shared_key = derivate_psk(pre_shared_key)
                while True:
                    secret_message = client.recv(1024)
                    message = decrypt(secret_message, shared_key)
                    print("<<< %s" % message)
                    message = raw_input(">>> ")
                    secret_message = encrypt(message, shared_key)
                    client.send(secret_message)
        else:
            print("Connect to %s" % server)
            s.connect((server, 31337))
            prime = generate_prime(size)
            group = randint(2**(size-1), 2**size)
            private_key = randint(2**(size-1), 2**size)
            public_key = (group**private_key) % prime
            key_exchange_data = {"prime": prime,
                                 "group": group,
                                 "public_key": public_key}
            s.send(json.dumps(key_exchange_data))
            key_exchange_data_json = s.recv(1024)
            key_exchange_data = json.loads(key_exchange_data_json)
            pre_shared_key = (key_exchange_data["public_key"] ** private_key) % prime
            shared_key = derivate_psk(pre_shared_key)
            while True:
                message = raw_input(">>> ")
                secret_message = encrypt(message, shared_key)
                s.send(secret_message)
                secret_message = s.recv(1024)
                message = decrypt(secret_message, shared_key)
                print("<<< %s" % message)

    except NotImplementedError:
        s.close()
    s.close()
```
