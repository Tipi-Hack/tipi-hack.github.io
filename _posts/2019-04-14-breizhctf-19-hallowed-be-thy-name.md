---
title: BreizhCTF 2019 - Hallowed be thy name
authors: cnotin
layout: writeup
ctf_url: https://www.breizhctf.com/
---
Solves: ?? / Points: 300 / Category: crypto

## Challenge description
We have the instructions to connect to a server and we can download its Python script.

The server offers 3 actions:
1. "Enter plain, we give you the cipher". It returns the ciphertext of the plaintext.
2. "Need a flag ?". It returns a base64 encoded string, probably encrypted, and different each time it is called even within the same connection 🤔
3. Exit

Here is the server script, by [@G4N4P4T1](https://twitter.com/g4n4p4t1) (thank you for this challenge 👋), and of course the flag is redacted here:
```python
import sys
import random
import base64
import socket
from threading import *

FLAG = "bzhctf{REDACTED}"

serversocket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
init_seed = random.randint(0,65535)


class client(Thread):
    def __init__(self, socket, address):
        Thread.__init__(self)
        self.sock = socket
        self.addr = address
        self.start()

    def get_keystream(self, r, length):
    	r2 = random.Random()
    	seed = r.randint(0, 65535)
    	r2.seed(seed)
        mask = ''
        for i in range(length):
            mask += chr(r2.randint(0, 255))
        return mask

    def xor(self, a, b):
        cipher = ''
        for i in range(len(a)):
            cipher += chr(ord(a[i]) ^ ord(b[i]))
        return base64.b64encode(cipher)

    def run(self):
        r = random.Random()
        r.seed(init_seed)

        self.sock.send(b'Welcome to the Cipherizator !\n1 : Enter plain, we give you the cipher\n2 : Need a flag ?\n3 : Exit')    
        while 1:
            self.sock.send(b'\n>>> ')
            response = self.sock.recv(2).decode().strip()
            if response == "1":
                self.sock.send(b'\nEnter plain : ')
                plain = self.sock.recv(1024).decode().strip()
                mask = self.get_keystream(r, len(plain))
                self.sock.send(b'Your secret : %s' % self.xor(mask, plain))
            elif response == "2":
                mask = self.get_keystream(r, len(FLAG))
                self.sock.send(b'Your secret : %s' % self.xor(mask, FLAG))
            elif response == "3":
                self.sock.close()
                break


if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("usage: %s port" % sys.argv[0])
        sys.exit(1)

    serversocket.bind(('0.0.0.0', int(sys.argv[1])))
    serversocket.listen(5)
    print ('server started and listening')
    while 1:
        clientsocket, address = serversocket.accept()
        print("new client : %s" % clientsocket)
        client(clientsocket, address)
```

## Challenge resolution
### Script analysis
The script accepts multiple clients in parallel through threads. When it starts, it generates a first seed with:
```python
init_seed = random.randint(0,65535)
```
65'536 possible values: that is not a very random nor robust seed. This seed is global and it is used for all clients.

When a client connects, a new thread is started. A first `Random` object is created using the global seed:
```python
r = random.Random()
r.seed(init_seed)
```

When the client uses the 1. or 2. action, the `self.get_keystream()` function is called:
```python
if response == "1":
    self.sock.send(b'\nEnter plain : ')
    plain = self.sock.recv(1024).decode().strip()
    mask = self.get_keystream(r, len(plain))
    self.sock.send(b'Your secret : %s' % self.xor(mask, plain))
elif response == "2":
    mask = self.get_keystream(r, len(FLAG))
    self.sock.send(b'Your secret : %s' % self.xor(mask, FLAG))
```

The `get_keystream()` function receives the first `Random` object seeded with the global seed, and it does this:
```python
def get_keystream(self, r, length):
    r2 = random.Random()
    seed = r.randint(0, 65535)
    r2.seed(seed)
    mask = ''
    for i in range(length):
        mask += chr(r2.randint(0, 255))
    return mask
```
A second seed is created, based on the output of the first `Random` object, and it is used to seed a second `Random` object. Like for the first one, only 65'536 values are possible which is weak. The first `Random` object is used to seed the second... From this second object, a mask is generated with the length passed as argument.

This length corresponds to the length of the data to encrypt. Indeed, the mask is combined with the input using the `xor()` function. The mask can then be considered as an encryption key. Here, we recognize in `xor()` a common function which applies the XOR operator on both inputs, character by character, and returns it base64-encoded:
```python
def xor(self, a, b):
    cipher = ''
    for i in range(len(a)):
        cipher += chr(ord(a[i]) ^ ord(b[i]))
    return base64.b64encode(cipher)
```

### Weakness
`Random` is a PRNG (Pseudorandom number generator) and so it has an interesting weakness: it is actually deterministic! Given a seed, it will always generate the same output sequence 😉
Combined with the fact that we can obtain the ciphertext of a plaintext of our choice, that the seeds are very small, and that the second `Random` object is not shared with other players (so we will not be perturbated by others): we have a very good chance to brute-force the seeds off-line and therefore the encryption key that allows to decrypt the flag.

### Solution
Our solution is to first send a static plaintext string to the server, then ask for the encrypted flag in the same connection (and nothing between). This way we know that the seed for the first `Random` object is the same for both requests and that this object is used only twice.
```
# nc ctf.bzh 11000
Welcome to the Cipherizator !
1 : Enter plain, we give you the cipher
2 : Need a flag ?
3 : Exit
>>> 1

Enter plain : test
Your secret : n3xljA==
>>> 2
Your secret : UlXaKcVLuVuORY3lY3/0myvHh0FjDsoumjjOCempaoVQDRmtHSnJw1WOXb5P9I+I
```

Our script will brute-force the first seed by trying to encrypt our chosen-plaintext and comparing with the obtained ciphertext, with the first `Random` object re-created everytime to start fresh. When it matches, the state of the first `Random` object is the good one, and the same as it was on the server, and we can then ask it to generate a second `randint()` for us. It will be the same as the one generated on the server to encrypt the flag we requested second, so we can generate a mask with it and decrypt the flag ciphertext we got.

There is no need to brute-force the second seed too (as we initially thought), as its value is a direct consequence of the state of the first `Random` object.

This is the Python script:
```python
import random
import base64
import sys

const = "test"
const_out = "n3xljA=="
flag = base64.b64decode("UlXaKcVLuVuORY3lY3/0myvHh0FjDsoumjjOCempaoVQDRmtHSnJw1WOXb5P9I+I")


def xor(a, b):
    cipher = ''
    for i in range(len(a)):
        cipher += chr(ord(a[i]) ^ ord(b[i]))
    return base64.b64encode(cipher)


# brute-force seed1
for seed1 in range(0, 65535):
    print "try seed1=%d" % seed1
    rand1 = random.Random()
    rand1.seed(seed1)

    rand2 = random.Random()
    rand2.seed(rand1.randint(0, 65535)) # first call to first Random object

    # generate the mask
    mask = ''
    for i in range(len(const)):
        mask += chr(rand2.randint(0, 255))

    # apply the mask to encrypt
    ret = xor(mask, const)

    if ret == const_out:
        # we found the seed1!
        print "GOT IT"
        print "seed1=%d" % seed1

        rand2 = random.Random()
        seed2 = rand1.randint(0, 65535) # second call to first Random object
        print "seed2=%d" % seed2
        rand2.seed(seed2)

        mask = ''
        for i in range(len(flag)):
            mask += chr(rand2.randint(0, 255))

        print base64.b64decode(xor(mask, flag))
        sys.exit(0)
```
And its output:
```terminal
try seed1=0
GOT IT
seed1=0
seed2=49673
bzhctf{The_sands_of_time_for_me_are_running_low}
```

As we are lucky, or the challenge creator is nice, the first seed is '0' so it does not even have to loop and we instantly get the flag 😁

Fun fact: the challenge title "Hallowed be thy name", is an Iron Maiden song, and the flag is a verse of the lyrics...

### "Cheating" solution
The solution above is, we believe, the intended solution. However, when writing this, we found that actually we could brute-force only the second seed. Yes it is generated from a first random generator, but as it has only 65'536 possible values, so we can brute-force it on its own 😉

Our trick here is also to know that the flag certainly contains "breizhctf" or "bzhctf". Without this, and with a truly random flag (otherwise we could search for ASCII-only candidates), this would not work.

Python script:
```python
import random
import base64
import sys

flag = base64.b64decode("UlXaKcVLuVuORY3lY3/0myvHh0FjDsoumjjOCempaoVQDRmtHSnJw1WOXb5P9I+I")


def xor(a, b):
    cipher = ''
    for i in range(len(a)):
        cipher += chr(ord(a[i]) ^ ord(b[i]))
    return base64.b64encode(cipher)


for seed2 in range(0, 65535):
    rand2 = random.Random()
    rand2.seed(seed2)

    # generate the mask
    mask = ''
    for i in range(len(flag)):
        mask += chr(rand2.randint(0, 255))

    decode = base64.b64decode(xor(mask, flag))
    # if it looks like a flag, it should be a flag ;)
    if "bzhctf" in decode or "breizhctf" in decode:
        print decode
        sys.exit(0)
```
It finds the flag in just a few seconds.