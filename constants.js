/*
  Protocol - protocol constants
*/

/**
 * type of MQTT Control Packet
 */

export const types = {
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
export const codes = {}
for (let k in types) {
  let v = types[k]
  codes[v] = k
}

/* header */
export const CMD_SHIFT = 4
