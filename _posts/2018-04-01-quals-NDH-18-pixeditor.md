---
title: Quals NDH 2018 - PixEditor
authors: Ghostx_0
layout: writeup
published: false
---
Solves: 63 / Points: 350 / Category: Web

## Challenge description
> Create your own pixel art with this powerful tool.
![Challenge description]({{ site.url }}/assets/ndh18-pixeditor-challenge_description.png)

## Challenge resolution
This challenge presented us with an online Pixel Editor that allows the user to create an image pixel by pixel, and save it to a file on the web server using the popular file format (JPG, BMP, PNG and GIF).

![PixEditor interface.png]({{ site.url }}/assets/ndh18-pixeditor-pixeditor_interface.png)

### File extension control
The first step when exploting such application is to control the extension of the generated file.

3 parameters were sent while saving an image:
* Data: The array of pixels that forms the image
* Name: The filename of the generated image
* Format: The file format of the image

As the server is using PHP, we first tested several PHP extensions (.php, .php3, .php4, .php5, .phtml) as well as the use of the double-extensions or the null byte injection without any success:
![null byte error]({{ site.url }}/assets/ndh18-pixeditor-nullbyte_error.png)

After a little bit of digging, we noticed a comment stating that a truncation will occured if the filename exceeds 50 characters in length:
![Comments search]({{ site.url }}/assets/ndh18-pixeditor-comments_search.png)

Great ! The file extension can now be controlled:
![File extension control]({{ site.url }}/assets/ndh18-pixeditor-file_extension_control.png)

### File content
The next step is to control the content of the file in order to get code execution on the web server.

We first decided to use the BMP file format as no compression is applied on the generated image.

Then, while manipulating the "data" parameter, we noticed the following error message:
![data array error]({{ site.url }}/assets/ndh18-pixeditor-data_array_error.png)

This parameter thus contain an array of pixels representing a square of 32 pixels. Each pixel being represented on 4 bytes.

We just need to get our payload in the right order!

After some tests we noticed that each block of 3 characters (in decimal) were placed in reverse order and followed with the value "255".

We thus crafted our payload to get a phpinfo() page allowing to verify that our assessment was correct:
![Phpinfo]({{ site.url }}/assets/ndh18-pixeditor-phpinfo.png)

### Flag recovery
The final step is to locate and get the flag.

We thus uploaded our webshell using the upper mentionned technique, but this time with the passthru() PHP function in order to exectute command on the web server:
![Command execution]({{ site.url }}/assets/ndh18-pixeditor-command_execution.png)

And there it is !

![Flag]({{ site.url }}/assets/ndh18-pixeditor-flag.png)
