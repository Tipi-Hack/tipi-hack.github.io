---
title: Quals NDH 2018 - Kebab STO
authors: Zweisamkeit
layout: writeup
ctf_url: https://nuitduhack.com/
---
Solves: 89 / Points: 350 / Category: Network

## Challenge description
> The challenge consists in finding the flag into a network capture.

Attachments: `kebabsto.pcapng`

## Challenge resolution
### Mail exchange
The network capture contains some SMTP requests that contain an intersting exchange.
![smtp_file.png](/assets/ndh18-kebab-smtp_file.png)

Tomato said there's a file whose name starts with "kd" that his friend should open.

By filtering on HTTP requests, we find a GET request on a file called "kdsqfkpdsdf".

![http_get_zip.png](/assets/ndh18-kebab-http_get_zip.png)

### WiFi
A simple `file` informs us this file is a zip archive.
It contains a file named `lkdjflknezcz` which is a WiFi capture with some handshakes.
We crack the WPA key and collect the ESSID using `aircrack-ng`:
![kebab-aircrack.png](/assets/ndh18-kebab-aircrack.png)

Now, we can decrypt the WiFi capture:
![wifi_decrypt.png](/assets/ndh18-kebab-wifi_decrypt.png)

After searching for several minutes, we find another Zip file in the capture transfered using FTP:
![kebab-zip_wifi.png](/assets/ndh18-kebab-zip_wifi.png)

This archive appears to be protected by a password.

### Encrypted Zip
After searching for other interesting pieces of data and trying to crack it using John the Ripper, we go back to the first capture and find another intersting e-mail:
![kebab-mail_key.png](/assets/ndh18-kebab-mail_key.png)

We reconstruct this Zip file and open it:
![kebab-b64_zip.png](/assets/ndh18-kebab-b64_zip.png)

We obtain a ciphertext we suppose is the key of the encrypted archive, and a public key probably associated to the private key used to construct the ciphertext.

After trying (and failing) to break this public key to retrieve the private one, we focus on the second sentence of the last e-mail:
```
Besides, they also found a service at mydomainndh.ndh (port 55555) which
decrypts every text encrypted with the public key, apart from the
interesting one.
```

We connect to the server used to host the challenges on port 8888 (Sysdream corrected the port number) and ask the decryption oracle to decrypt the ciphertext.
![kebab-plaintext.png](/assets/ndh18-kebab-plaintext.png)

Finally, we use this plaintext to unzip the encrypted archive and get the flag!
![kebab-flag.png](/assets/ndh18-kebab-flag.png)
