/*
  Protocol - protocol constants
*/

/**
 * type of MQTT Control Packet
 */

module.exports.types = {
  0: 'reserved',
  1: 'connect',
  2: 'connack',
  3: 'publish',
  4: 'puback',
  5: 'pubrec',
  6: 'pubrel',
  7: 'pubcomp',
  8: 'subscribe',
  9: 'suback',
  10: 'unsubscribe',
  11: 'unsuback',
  12: 'pingreq',
  13: 'pingresp',
  14: 'disconnect',
  15: 'reserved'
}

/* Mnemonic => Command code */
module.exports.codes = {}
for (let k in module.exports.types) {
  let v = module.exports.types[k]
  module.exports.codes[v] = k
}

/* header */
module.exports.CMD_SHIFT = 4

/* connack */
module.exports.SESSIONPRESENT_MASK = 0x01
