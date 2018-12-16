---
title: Ph0wn - Healing the Toothbrush 1
authors: cnotin
layout: writeup
ctf_url: http://ph0wn.org/
---
Category: Reverse

## Challenge description
This challenge was based on the famous smart toothbrush of [@cryptax](https://twitter.com/cryptax) / Axelle Apvrille!

> Ph0wn aliens have abducted my smart toothbrush.
> My toothbrush has hidden this horrible episode far in its subconscious mind, but I know encrypted memories of the event are still there... My psychiatrist tells me I need to get my toothbrush talk, that it will help it heal.
>
> To do so, the psychiatrist advises, as a first step, to find the **decryption key** to those events. This key is hidden within the official Android application `Beam_v1.3.3_apkpure.com.apk` (sha256: `df8956a138a05230fb26be27a22dc767775b55b1d2250be25aa899c8bbee53b9`). 
>
> My psychiatrist provides the following information:
> - The toothbrush uses **Bluetooth Low Energy** to communicate.
> - It is useless to understand the entire application. You should concentrate on what handles toothbrush events. The class for those events is called `BrushEvent`.
> - [Is my toothbrush really smart?](https://download.ernw-insight.de/troopers/tr18/slides/TR18_NGI_BR_Is-my-toothbrush-really-smart.pdf)
>
> **Important** :
> - In this stage, you **do not need the smart toothbrush**.
> - Do not try to install the Android application on your smartphone: it is not malicious but it requires a client login (which you don't have) to operate, so it will be useless to run it...
> - Please **do not connect to the toothbrush via Bluetooth**, it may cause service disruptions for stage 2. And it won't help for stage 1. Actually, if you don't need Bluetooth on your smartphone or laptop, we recommend you **disable** it.
> - For this stage, you need to flag `ph0wn{hexstring of encryption key}`. The encryption key is required to complete stage 2.

## Challenge resolution
We used the usual `unzip`, `dex2jar` and `JD-GUI`/`Procyon` tools to reverse the Java code of the app.

We were told to look for the `BrushEvent` class. There was a false lead with hexadecimal values that looked promising but were actually `client_id` and `client_secret` values for OAuth.

We then decided to simply look for "crypt" in all the files and indeed it was a good idea :wink:
![](/assets/ph0wn-toothbrush1-key.png){: .image }

As a bonus we found the exact encryption algorithm: AES, in ECB mode, without padding. We kept this in mind for the [second stage]({% post_url 2018-12-16-Ph0wn-Healing-the-toothbrush-2 %}).