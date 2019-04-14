---
title: BreizhCTF 2019 - Primera Sangra
authors: cnotin
layout: writeup
ctf_url: https://www.breizhctf.com/
---
Solves: 2 / Points: ?? / Category: ??

## Challenge description
The challenge description gives us a website URL. It says that the webmaster made a mistake and disclosed the password, a common one, and quickly fixed it directly in production.

Indeed, the website is access restricted and only shows a password form. We understand that we have to find the password.

## Challenge resolution
### Step one: discovery
We quickly try a few trivial passwords on the form, but they do not work. The goal of this kind of challenge is usually not to do an online brute-force (which have the side effect of ruining the challenge for other players... 🤨), so we try something different.

The challenge description gives the hint that the developer fixed it in production. What if he uses a version control system (VCS, such as git/SVN) directly in production to pull the source-code? This is actually very common...
So, we try to access the `/.git/` folder but it returns a 404 not-found error. However, we know that some web servers return this error when requesting folders, and if directory listing is disabled, even if the folder effectively exists! So, we try to access `/.git/conf` too and it works! 💡
![](/assets/breizhctf-19-primera-1.png)

For your information, there are other similar files you can try accessing in this situation, such as `/.git/index`, `/.git/HEAD`, `/.git/logs/HEAD`, where among binary data we see interesting file names:
![](/assets/breizhctf-19-primera-2.png)

Now we know that there is an exposed git repository with interesting files, and we want to obtain it.

### Step two: exploitation
When a webserver has directory listing enabled, it is easy to fetch the repository with a recursive download but this is not the case here.
Many tools are available for this. We try several here and obtain similar results, except one that goes on an infinite loop, and we will understand later why 😉. Here is a quick list:
* [DVCS-Pillage](https://github.com/evilpacket/DVCS-Pillage)
* [dvcs-ripper](https://github.com/kost/dvcs-ripper)
* [GitTools](https://github.com/internetwache/GitTools)
* [git-grab](https://www.pentestpartners.com/security-blog/git-extraction-abusing-version-control-systems/)
For example:
![](/assets/breizhctf-19-primera-3.png)

We think that we are finished here, but the content of `secret_password.py` is quite disappointing:
```py
secret_password = "REDACTED"
```
And "REDACTED" is indeed not the correct password (we tried, you never know when you might be lucky 😉). So we read more about this technique of dumping git repositories without directory listing, and we are reminded that everything in git is well organized. There are trees, nodes, objects, and all of them pointing to others, and everything has a hash (like commit IDs, but for internal objects), etc.

### Step three: dive into git internals
Some articles show the usage of the `git fsck` command to check if a repository is valid: are all objects presents and with a valid integrity? In fact some git dumping tools are based on this command, where it is run repeatedly: it complains about a missing file, then the file is downloaded, and again.
Its result on our copy of the repository is interesting:
```console
# git fsck
error: sha1 mismatch for .git/objects/37/4e045ef2ea84be825ead668a69aac28ce7b53e (expected 374e045ef2ea84be825ead668a69aac28ce7b53e)
error: 374e045ef2ea84be825ead668a69aac28ce7b53e: object corrupt or missing: .git/objects/37/4e045ef2ea84be825ead668a69aac28ce7b53e
Checking object directories: 100% (256/256), done.
missing blob 374e045ef2ea84be825ead668a69aac28ce7b53e
```
Ok, so one of the objects has a wrong hash 🤔 Now we understand why one of the tools goes to an infinite loop as it cannot download a correct version of the file and re-tries again and again.
The article ["Reading git objects"](https://matthew-brett.github.io/curious-git/reading_git_objects.html) teaches us to read its compressed content, and obtain the hash, here with the following command:
```console
# python -c "from hashlib import sha1; import zlib; decompressed=zlib.decompress(open('.git/objects/37/4e045ef2ea84be825ead668a69aac28ce7b53e','rb').read()); print decompressed; print sha1(decompressed).hexdigest()"
blob 49 secret_password = "REDACTED"
2d1873bdd1fcf3724385f3da4d1db117eba3883d
```

We have the confirmation that the hash differs from the expected one "374e045ef2ea84be825ead668a69aac28ce7b53e". We guess that the developer changed the password in the git repository too, but without actual a proper method which leads to a file integrity issue!
We note that in `.git/objects` there are folders with 2 characters names, which are the first 2 characters of the hashes, then the remaining of the hash in the filename. So the file with hash "374e045ef2ea84be825ead668a69aac28ce7b53e" is stored in the "37/" folder and filename "4e045ef2ea84be825ead668a69aac28ce7b53e". We also note that the hash is not based only on the actual content of the file, since there is a prefix added by git which is the type of the object (here "blob"), followed by its original size (49 octets, which is less than 'secret_password = "REDACTED"'), ended with a NULL-byte separator "\x00" (caution as it was not visible in the output of the previous command). This also well explained in the ["Deep dive into git: git Objects"](https://aboullaite.me/deep-dive-into-git/) article:
![](/assets/breizhctf-19-primera-4.png)

Here are a few other results from git commands:
```terminal
# git log
commit 21ff7f561f87c1a682d11dcb2572772e4e1872af (HEAD -> master)
Author: ganapati <ganapati@ganapati.com>
Date:   Tue Sep 25 14:35:47 2018 +0200

    First commit
# git ls-tree 21ff7f561f87c1a682d11dcb2572772e4e1872af
100644 blob b9a9f0016edfa13722676a5a7764e5e90683bb6e    bottle.py
100644 blob a8d36c721525b80c9cb29dac6f06b5acf8c60c2b    challenge.py
100644 blob 374e045ef2ea84be825ead668a69aac28ce7b53e    secret_password.py
```

### Step four: brute-force and conclude
Now we know the expected hash, and the expected format of the file (we assume that only the password was redacted, and nothing else changed). Now we have to brute-force the redacted password. Let's remind the challenge description that says that the password is common: we will probably not have to do a complicated brute-force. Our first idea is unsurprisingly to use the rockyou passwords dictionnary.

We cannot use (or actually we do not know how) a standard password cracking tool as the input to hash depends on the length of every tested password.

Therefore, we use the following Python script (totally unoptimized but good enough for the task here):
```python
import hashlib
import sys

for word in open("/usr/share/wordlists/rockyou.txt").read().split("\n"):
    content = 'secret_password = "' + word + '"'
    content = 'blob %d\0%s' % (len(content), content)
    if hashlib.sha1(content).hexdigest() == "374e045ef2ea84be825ead668a69aac28ce7b53e":
        print content
        sys.exit(0)
```
After a few seconds, it gives us the original password and content of the git object (and therefore of the original file):
```python
blob 49 secret_password = "mhonowa2248116553575515246859"
```

We confirm this result by using this password on the challenge website and it is accepted 👍

Thank you to [@G4N4P4T1](https://twitter.com/g4n4p4t1) for this interesting challenge!

### Bonus
We initially thought that the brute-force would be more difficult and we thought we would need to make use of password rules. How to combine this with our custom Python script?
We can chain John-the-Ripper, only used to generate password candidates using a dictionnary and rules and outputs them to `stdout`, with our script to format it and compute the hash of the whole.
The script is modified as follows to iterate on `stdin` candidate passwords:
```python
import hashlib
import fileinput
import sys

for word in fileinput.input():
    word = word.strip()
    content = 'secret_password = "' + word + '"'
    content = 'blob %d\0%s' % (len(content), content)
    if hashlib.sha1(content).hexdigest() == "374e045ef2ea84be825ead668a69aac28ce7b53e":
        print word
        sys.exit(0)
```
And run the whole with these commands:
```terminal
john --wordlist=/usr/share/wordlists/rockyou --rules=all --stdout | python crack2.py
```