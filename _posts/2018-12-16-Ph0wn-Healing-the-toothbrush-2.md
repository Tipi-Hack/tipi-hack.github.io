---
title: Ph0wn 2018 - Healing the Toothbrush 2
authors: cnotin
layout: writeup
ctf_url: http://ph0wn.org/
---
Category: Misc

## Challenge description
This challenge was the second stage of [Healing the toothbrush 1]({% post_url 2018-12-16-Ph0wn-Healing-the-toothbrush-1 %}).

Now that we had the encryption key, we had to communicate with it. Fortunately most of the required information was provided and we did not have to reverse the app.

> Now that you know how events are encrypted in my toothbrush's subconscious mind, you are ready to **have it talk**.
> Fortunately, the psychiatrist helps you.
>
> The toothbrush's subconscious mind consists,  apparently, in a rolling table of 256 *events*, where each event is indexed by its index in the table.
> You cannot directly read an event entry, but you can *ask information for that index*.
> For that, you need to:
> 
> - Enable notifications via handle **0x26**
> - Write to handle **0x28** with data containing a **dummy event** with the index you want to *read*
> - Receive notifications on handle **0x25**
>
> The **format of an event** is:
>
> - raw data: 5 bytes (not used)
> - start date: 6 bytes (`YY MM DD HH MM SS`)
> - brushing duration: 4 bytes 
> - index: 1 byte
>
> Total: **16 bytes**
>
> Then, the bytes of the event are swapped reverse (first byte becomes last) and **encrypted** (see stage 1).
>
> Finally, the following might help you:
>
> - [Is my toothbrush really smart?](https://download.ernw-insight.de/troopers/tr18/slides/TR18_NGI_BR_Is-my-toothbrush-really-smart.pdf)
> - **Sample Python code** to get notifications (`example.py`). This code is for Linux only. If you don't have Linux, reading the source code might nevertheless help you out.

You can [download the example file](/assets/ph0wn_toothbrush_example.py).

## Challenge resolution
We first had to find the Bluetooth Low Energy MAC address of the toothbrush to connect to it:
![](/assets/ph0wn-toothbrush2-scan.png){: .image }

Then we adapted the example script for our need. You can [download our solution script](/assets/ph0wn_toothbrush_pwn.py).

It took us a lot of time but we finally managed to meticulously implement the protocol as described in the challenge description. Let's review some of the interesting parts.

### Cipher
The cipher configuration in Python that corresponds to the Java code previously reversed was:
```py
cipher = AES.new("e02b90e8e50be5b001c299a5039462c2".decode("hex"), AES.MODE_ECB)
```


### Ask information for an index
The first step was to ask the toothbrush information for each index.
```python
self.enable_notif(0x0026)
print "[+] Enabled notif"

for i in range(0, 256):
    self.enable_notif(0x0026)
    event = str(bytearray([0x41, 0x41, 0x41, 0x41, 0x41,        # raw data: 5 bytes (not used)
                           0xAA, 0xBB, 0xCC, 0xDD, 0xEE, 0x00,  # start date: 6 bytes (YY MM DD HH MM SS)
                           0xFF, 0xFF, 0xFF, 0xFF,              # brushing duration: 4 bytes
                           i,                                   # index: 1 byte
                           ]))

    event = cipher.encrypt(event)
    event = event[::-1]  # reverse
    self.req.write_by_handle(0x0028, event)
```
We enable the notifications via handle `0x26`, then iterate on all 256 index values by sending *dummy events* as advised. All values are meaningless in the *dummy event* except the index.

We wasted a lot of time since we understood that the challenge description asked us to encrypt then reverse the bytes, but it was actually the opposite that was required 🤦...


### Receive notification
After each request for information, the toothbrush answered via a notification that we handled.

We were initially surprised to receive a payload of 19 bytes which is not normal for an encrypted block (should be a multiple of 16 in our case). We observed that all payloads began with the same 3 bytes `1B 25 00`. Wireshark helped us understand that the payload actually contained a prefix that we had to discard:
![](/assets/ph0wn-toothbrush2-header.png){: .image }


Here is the handling code:
```py
class MyRequester(GATTRequester):
    def on_notification(self, handle, data):
        data = str(data)  # change type
        data = data[3:]  # remove first 3 bytes (only keep payload)
        data = data[::-1]  # reverse

        if len(data) % 16 == 0:  # only try to reverse if it's a block
            decrypted = cipher.decrypt(data)
            print decrypted
```


### Get flag
Finally we discovered the flag that was split accross several indexes: `ph0wn{brushUrTeeth2mins}`
![](/assets/ph0wn-toothbrush2-flag.jpg){: .image }