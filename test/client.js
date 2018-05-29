var mqtt = require('mqtt')
// var client = mqtt.connect('mqtt://test.mosquitto.org')
var client = mqtt.connect('mqtt://127.0.0.1:1883')

client.on('connect', function () {
  client.subscribe('/hello/world')
  // client.publish('presence', 'Hello mqtt')
  console.log('subscribed /hello/world')
})

client.on('message', function (topic, message) {
  // message is Buffer
  console.log('received data')
  console.log(message.toString())
  // client.end()
  client.unsubscribe('/hello/world')
})
