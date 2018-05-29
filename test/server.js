var aedes = require('aedes')()
var server = require('net').createServer(aedes.handle)
var port = 1883

server.listen(port, function () {
  console.log('server listening on port', port)
})

var message = {
  topic: '/hello/world',
  payload: 'hello world', // or a Buffer
  qos: 0, // 0, 1, or 2
  retain: false // or true
}

server.on('subscribed', () => {
  server.publish(message, function () {
    console.log('publish message done!')
  })
})
