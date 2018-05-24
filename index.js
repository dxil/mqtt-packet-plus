let Generate = require('./generate')

// 模拟一个服务端发送的连接确认包
// expect [32, 2, 0, 0]
let connackPacket = {
  returnCode: 0,
  sessionPresent: false,
  cmd: 'connack'
}

// 模拟一个服务端发送的订阅确认包
// expect [144, 3, 78, 182, 0]
let subackPacket = {
  messageId: 20150,
  granted: [0],
  cmd: 'suback'
}

let gen = new Generate()
let connackBuffer = gen.generate(connackPacket)
let subackBuffer = gen.generate(subackPacket)
console.log(connackBuffer) // [32, 2, 0, 0]
console.log(subackBuffer) // [144, 3, 78, 182, 0]
