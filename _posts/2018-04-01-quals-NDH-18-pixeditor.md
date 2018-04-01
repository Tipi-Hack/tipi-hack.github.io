---
title: Quals NDH 2018 - PixEditor
authors: Ghostx_0
layout: writeup
---
Solves: 63 / Points: 350 / Category: Web

## Challenge description
> Create your own pixel art with this powerful tool.
![Challenge description](/assets/ndh18-pixeditor-challenge_description.png){: .image }

## Challenge resolution
This challenge presented us with an online Pixel Editor that allows the user to create an image pixel by pixel, and save it to a file on the Web server using popular file formats (JPG, BMP, PNG and GIF).

![PixEditor interface](/assets/ndh18-pixeditor-pixeditor_interface.png){: .image }

### File extension control
The first step when exploiting such an application is to control the extension of the generated file.

Three parameters were sent while saving an image:
* Data: the array of pixels that forms the image
* Name: the filename of the generated image
* Format: the file format of the image

Since the server is using PHP, we first tested several PHP extensions (.php, .php3, .php4, .php5, .phtml) as well as the use of the double-extensions or null byte injection without any success:
![null byte error](/assets/ndh18-pixeditor-nullbyte_error.png){: .image }

After a little bit of digging, we noticed a comment stating that a truncation will occur if the filename exceeds 50 characters in length:
![Comments search](/assets/ndh18-pixeditor-comments_search.png){: .image }

Great! The file extension can now be controlled:
![File extension control](/assets/ndh18-pixeditor-file_extension_control.png){: .image }

### File content
The next step is to control the content of the file in order to get code execution on the Web server.

We first decided to use the BMP file format as no compression is applied on the generated image.

Then, while manipulating the "data" parameter, we noticed the following error message:
![Data array error](/assets/ndh18-pixeditor-data_array_error.png){: .image }

This parameter thus contains an array of pixels representing a square of 32 pixels, each pixel being represented on 4 bytes.

We just need to get our payload in the right order!

After some tests we noticed that each block of three characters (in decimal) were placed in reverse order and followed with the value "255".

We thus crafted our payload to get a phpinfo() page allowing to verify that our assessment was correct:
![Phpinfo](/assets/ndh18-pixeditor-phpinfo.png){: .image }

### Flag recovery
The final step is to locate and get the flag.

We thus uploaded a webshell using the technique mentioned above, but this time with the passthru() PHP function in order to exectute commands on the Web server:
![Command execution](/assets/ndh18-pixeditor-command_execution.png){: .image }

And there it is!

![Flag](/assets/ndh18-pixeditor-flag.png){: .image }
