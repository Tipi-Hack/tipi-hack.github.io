const readline = require('readline')
const vm = require('vm')

const EVAL = function (src){
    const cmd = `_=${src}`
    eval(cmd)
    return _
}


function startPrompt(handler, ignoreEmptyLines=false){
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    rl.on('line', line => {
        if (ignoreEmptyLines && !line){
            return rl.prompt()
        }
        return handler(line) ? rl.close() : rl.prompt()
    })

    rl.prompt();
}

function main(){
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
        "_", " ", "\t",  // output and white space
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
}

main()