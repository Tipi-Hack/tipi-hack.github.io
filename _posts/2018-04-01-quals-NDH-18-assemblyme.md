---
title: Quals NDH 2018 - AssemblyMe
layout: writeup
authors: Marine Martin,qlemaire
date: 2018-04-01 16:30:00 +0200
---
Solves: 53 / Points: 300 / Category : Reverse

## Challenge description
> We updated our website with the latest technologies. In addition, this is secure ! You can try to log in if you want...

We start with a URL: [http://assemblyme.challs.malice.fr](http://assemblyme.challs.malice.fr)

## Challenge resolution
The webpage only contains a single user input `password`.

By submitting a random one, we can see that it is not forwarded to the server. The authentication is performed client-side.

Looking at the JavaScript code, we can see that `checkAuth` function is responsible for authentication:
```js
u = document.getElementById("i").value; // user input
var a = Module.cwrap('checkAuth', 'string', ['string']); // authentication function
var b = a(u); // testing authentication
document.getElementById("x").innerHTML = b; // output answer
```
However, we cannot read this function because it has been compiled in Web Assembly (within `index.wasm` file).

At first, we tried to decompile the assembly with several tools, such as `wasmdump` (from `wasm` Pypi). We got the source code, however, we could not find out where the `_checkAuth` function was implemented (mostly because we didn't know anything about Web Assembly). We realized that we could get the code and dynamically debug it from Firefox (which supports Web Assembly).

By setting a break point on the `a(u)` JavaScript call, we can dig into the web assembly source code.

We first stop the execution at the following point:
![Breakpoint]({{ site.url }}/assets/ndh18-assemblyme-breakpoint.png)

The `apply` function will execute the `checkAuth` function with the supplied user input as argument (the password). The output is given to the `Pointer_stringify` function which will be helpful later.

Stepping further, we get into the web assembly, within a function called `func35`:
![Func35]({{ site.url }}/assets/ndh18-assemblyme-func35.png)

At this point, we looked for the webassembly documentation to understand the assembly:
* http://webassembly.org/docs/text-format/
* http://webassembly.org/docs/semantics/

This was really useful.

The `func35` is performing severals checks, calling `func57` and comparing the return value with 0. If all the cascading conditions are met, the value `1690` is returned:
```python
def func35(password): # this is python pseudo-code for func35
    if func57(password, 1616, 4) == 0:
        if func57(password+4, 1638, 4) == 0:
            if func57(password+8, 1610, 5) == 0:
                if func57(password+13, 1598, 4) == 0:
                    if func57(password+17, 1681, 3) == 0:
                        if func57(password+20, 1654, 9):
                            return 1690
```

We can see what value is pointed by `1690` by using the `Pointer_stringify` function:
```js
> Pointer_stringify(1690)
"Authentication is successful. The flag is NDH{password}."
```

OK great! So now we have to find the right password to pass all these `if` conditions.

It means that we have to understand what the `func57` function is actually doing.

The `func57` has 3 parameters:
1. a string pointer related to the user input (let's call it "input")
2. a static string pointer which content can be retrieved via `Pointer_stringify` (let's call it "valid")
3. an integer value (let's call it "size")

Digging further with the debugger, we enter the `func57`:
![Func35]({{ site.url }}/assets/ndh18-assemblyme-func57.png)

Looking at the code, we can see that the function is checking if the `size` first characters of the `input` string match the `size` first characters of the `valid` string (which is similar to the `strncmp` function).

We have the following pseudo-code:
```python
def func57(input, valid, size):
    for i in range(size):
        if valid[i] != input[i]:
            return something_different_from_0
    return 0
```

Reusing the `Pointer_stringify` JS function, we can grab all the `valid` values:
```js
> Pointer_stringify(1616) 
"d51X1"
> Pointer_stringify(1638)
"Pox)sm"
> Pointer_stringify(1610)
"1S0xk"
> Pointer_stringify(1598)
"5S11x"
> Pointer_stringify(1681)
"W_enc_cb"
> Pointer_stringify(1654)
"KXK,,,xie"
```

We now have the following parameters given to `func57`:

| iteration | param0: input | param1: valid | param2: size |
| --- | --- | --- | --- |
| 0 | password | 1616 -> "d51X1" | 4 | 
| 1 | password+4 | 1638 -> "Pox)sm" | 4 | 
| 2 | password+8 | 1610 -> "1S0xk" | 5 |
| 3 | password+13 | 1598 -> "5S11x" | 4 |
| 4 | password+17 | 1681 -> "W_enc_cb" | 3 |
| 5 | password+20 | 1654 -> "KXK,,,xie" | 9 |

Hence, to pass the first condition, the 4 first characters (from 0 to 3) of our password need to be "d51x".
To pass the second condition, the characters from 4 to 7 need to be "Pox)".
To pass the third condition, the characters from 8 to 13 need to be "1S0xk".
And so on...

Putting everything together, the final password is "d51XPox)1S0xk5S11W_eKXK,,,xie", which validates:
![Flag]({{ site.url }}/assets/ndh18-assemblyme-flag.png)

Special thanks to Sébastien Mériot for his help on the Web Assembly reversing. We could not make it without him!
