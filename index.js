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

// 模拟一个发送给客户端的报文
// expect [48, 25, 0, 12, 47, 104, 101, 108, 108, 111, 47, 119, 111, 114, 108, 100, 104, 101, 108, 108, 111, 32, 119, 111, 114, 108, 100]

let publishPacket = {
  topic: '/hello/world',
  payload: 'hello world',
  qos: 0,
  messageId: 1,
  cmd: 'publish'
}

let gen = new Generate()
let connackBuffer = gen.generate(connackPacket)
let subackBuffer = gen.generate(subackPacket)
let publishBuffer = gen.generate(publishPacket)
console.log(connackBuffer) // [32, 2, 0, 0]
console.log(subackBuffer) // [144, 3, 78, 182, 0]
console.log(publishBuffer) // [48, 25, 0, 12, 47, 104, 101, 108, 108, 111, 47, 119, 111, 114, 108, 100, 104, 101, 108, 108, 111, 32, 119, 111, 114, 108, 100]
