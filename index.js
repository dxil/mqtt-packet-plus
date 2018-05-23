let Generate = require('./generate')

let packet = {
  returnCode: 0,
  sessionPresent: false,
  cmd: 'connack'
}

let gen = new Generate()
let buffer = gen.generate(packet)
console.log(buffer)
