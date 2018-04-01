---
title: Quals NDH 2018 - Kebab STO
published: false # delete line when ready to publish
authors: Zweisamkeit
layout: writeup
---
Solves: 89 / Points: 350 / Category: Network


## Challenge description
> The challenge consists in finding the flag into a network capture.

## Challenge resolution
### Mail exchange
The network capture contains some SMTP requests which contain an intersting exchange.
![smtp_file.png](/assets/ndh18-kebab-smtp_file.png){: .image }

Tomato said there's a file which name begins by "kd" that his friend should open.

By filtering on HTTP requests, we find a GET request on a file called "kdsqfkpdsdf".

![http_get_zip.png](/assets/ndh18-kebab-http_get_zip.png){: .image }

### WiFi

A simple `file` informs us this file is a zip archive.
It contains a file named "lkdjflknezcz" which is  WiFi capture with some handshakes.
We crack the WPA key and collect the ESSID using aircrack-ng.

![kebab-aircrack.png](/assets/ndh18-kebab-aircrack.png){: .image }

Now, we can decrypt the WiFi capture:

![wifi_decrypt.png](/assets/ndh18-kebab-wifi_decrypt.png){: .image }

After several minutes of research, we find another zip file in the capture transfert using FTP.

![kebab-zip_wifi.png](/assets/ndh18-kebab-zip_wifi.png){: .image }

This archive appears to be protected by a password. After searching another interesting data and trying to crack it using john, we go back to the first capture and find another intersting mail.

![kebab-mail_key.png](/assets/ndh18-kebab-mail_key.png){: .image }

We reconstruct this zip file and open it.

![kebab-b64_zip.png](/assets/ndh18-kebab-b64_zip.png){: .image }

We obtain a ciphertext we suppose to be the key of the encrypted archive, and a public key - probably associated to the private key used to construct the ciphertext.

After trying to broke this public key to retrieve the private one, we focus on the second sentance of the last mail: 
```
Besides, they also found a service at mydomainndh.ndh (port 55555) which
decrypts every text encrypted with the public key, apart from the
interesting one.
```

We try to join the server used to host the challenges in the port 8888 (Sysdream corrected the port number) and ask to the decrypt oracle to decrypt the ciphertext.

![kebab-plaintext.png](/assets/ndh18-kebab-plaintext.png){: .image }

Finally, we use this plaintext to unzip the encrypted archive and get the flag!

![kebab-flag.png](/assets/ndh18-kebab-flag.png){: .image }
