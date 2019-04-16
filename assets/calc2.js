const readline = require('readline');    
const vm = require('vm');

/* remove mainModule for better security */
process.mainModule = {};

function cloakObject(obj, allowed_properties=[]){
    /*
      Prevent access to properties defined before the cloaking
     */

    let _newProps = new Set(allowed_properties)
    return new Proxy(obj, {
        get: (obj, prop) => {
            return _newProps.has(prop) ? obj[prop] : undefined
        },

        set: (obj, prop, value) => {
            _newProps.add(prop)
            obj[prop] = value
            return true
        }
    })
}

function evalInJail(env, options){
    const context = vm.createContext(env);

    return function (script){
        /* "use strict" to prevent any callee/caller trickery */
        const src = `"use strict";\n${script}`;

        vm.createScript(src).runInNewContext(context, options);
    }
}

function startPrompt(handler, ignoreEmptyLines=false){
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    rl.on('line', line => {
        if (ignoreEmptyLines && !line){
            return rl.prompt();
        }
        return handler(line) ? rl.close() : rl.prompt()
    })

    rl.prompt()
}

function main(){
    console.log("   _________________________________ ")
    console.log("  |                                 |")
    console.log("  |   Welcome to our js evaluator   |");
    console.log("  | Enter your script, end with EOF |")
    console.log("  |  You can use the log() function |")
    console.log("  |_________________________________|\n")
    

    function readUntil(endline, finish){
        var buffer = ""
        return function(line){
            if (line == endline){
                finish(buffer)
                return true
            }
            buffer += `${line}\n`
            return false
        }
    }

    /* Give access to cloaked version of console.log */
    const env = {
        log: cloakObject(console.log)
    }

    const options = {
        timeout: 3000
    }



    startPrompt(readUntil("EOF", evalInJail(env, options)))
}

main()const readline = require('readline');    
const vm = require('vm');

/* remove mainModule for better security */
process.mainModule = {};

function cloakObject(obj, allowed_properties=[]){
    /*
      Prevent access to properties defined before the cloaking
     */

    let _newProps = new Set(allowed_properties)
    return new Proxy(obj, {
        get: (obj, prop) => {
            return _newProps.has(prop) ? obj[prop] : undefined
        },

        set: (obj, prop, value) => {
            _newProps.add(prop)
            obj[prop] = value
            return true
        }
    })
}

function evalInJail(env, options){
    const context = vm.createContext(env);

    return function (script){
        /* "use strict" to prevent any callee/caller trickery */
        const src = `"use strict";\n${script}`;

        vm.createScript(src).runInNewContext(context, options);
    }
}

function startPrompt(handler, ignoreEmptyLines=false){
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    rl.on('line', line => {
        if (ignoreEmptyLines && !line){
            return rl.prompt();
        }
        return handler(line) ? rl.close() : rl.prompt()
    })

    rl.prompt()
}

function main(){
    console.log("   _________________________________ ")
    console.log("  |                                 |")
    console.log("  |   Welcome to our js evaluator   |");
    console.log("  | Enter your script, end with EOF |")
    console.log("  |  You can use the log() function |")
    console.log("  |_________________________________|\n")
    

    function readUntil(endline, finish){
        var buffer = ""
        return function(line){
            if (line == endline){
                finish(buffer)
                return true
            }
            buffer += `${line}\n`
            return false
        }
    }

    /* Give access to cloaked version of console.log */
    const env = {
        log: cloakObject(console.log)
    }

    const options = {
        timeout: 3000
    }



    startPrompt(readUntil("EOF", evalInJail(env, options)))
}

main()