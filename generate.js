let utils = require('./utlis')
let protocol = require('./constants')

module.exports = class Generate {
  /**
    var packet = {
      cmd: 'publish',
      retain: false,
      qos: 0,
      dup: false,
      length: 10,
      topic: 'test',
      payload: 'test' // Can also be a Buffer
    }
   */
  beforeGenerate (packet) {
    this._packet = packet
    this._cmd = packet.cmd || ''

    if (!this._packet) {
      throw new Error('packet can not be empty!')
    }
  }

  generate (packet) {
    this.beforeGenerate(packet)
    switch (this._cmd) {
      case 'connect':
        return this.connect() // 客户端到服务端发送的第一个请求 Connect
      case 'connack':
        return this.connack() // 服务端到客户端发送的第一个请求 Connack 请求确认
      case 'publish':
        return this.publish()
      case 'puback':
      case 'pubrec':
      case 'pubrel':
      case 'pubcomp':
      case 'unsuback':
      case 'subscribe':
        return this.subscribe()
      case 'suback':
        return this.suback()
      case 'unsubscribe':
        return this.unsubscribe()
      case 'pingreq':
      case 'pingresp':
      case 'disconnect':
        return this.emptyPacket()
      default:
        utils.showError('unknown command')
    }
  }

  connect () {
    // Todo: 客户端处实现
  }

  /* 连接确认 */
  connack () {
    let returnCode = this._packet.returnCode
    let sessionPresent = this._packet.sessionPresent

    if (typeof returnCode !== 'number') {
      utils.showError('Invalid return code')
    }

    let buffer = Buffer.alloc(4) // new Buffer() was deprecated since v6.0
    let pos = 0

    buffer.writeInt8(protocol.codes['connack'] << protocol.CMD_SHIFT, pos++, true)
    pos += this.writeLength(buffer, pos, 2)
    buffer.writeInt8((sessionPresent && protocol.SESSIONPRESENT_MASK) || 0, pos++, true)
    buffer.writeInt8(returnCode, pos++, true)

    return buffer
  }

  /* 订阅确认 */
  suback () {
    let messageId = this._packet.messageId
    let granted = this._packet.granted

    let length = 0
    let pos = 0

    if (typeof messageId !== 'number') {
      utils.showError('Invalid message id ')
    }

    length += 2

    // check QOS vector
    if (Array.isArray(granted) && granted.length) {
      for (let i = 0; i < granted.length; i++) {
        if (typeof granted[i] !== 'number') {
          utils.showError('Invalid QOS vector')
        }
        length += 1
      }
    } else {
      utils.showError('Invalid QOS vector')
    }

    let buffer = Buffer.alloc(1 + this.calcLengthLength(length) + length)

    // Header
    buffer.writeInt8(protocol.codes['suback'] << protocol.CMD_SHIFT, pos++, true)

    // Length 写入剩余长度
    pos += this.writeLength(buffer, pos, length)

    // Message Id
    pos += this.writeNumber(buffer, pos, messageId)

    // Subscriptions
    granted.forEach(val => {
      buffer.writeInt8(val, pos++, true)
    })

    return buffer
  }

  /**
   * 用于往buffer的pos开始处写入数值，数值最高位需符合大小端进位为符号位
   * @param {<Buffer> buffer} 传入的buffer
   * @param {<Number> pos} 目前的游标
   * @param {<Number> length} 需要写入的长度
   * @returns <Number> 返回消耗了多少buffer空间
   * @api private
   */

  writeLength (buffer, pos, length) {
    let digit = 0
    let origPos = pos // 储存初始游标位置

    do {
      digit = length % 128 | 0
      length = length / 128 | 0
      if (length > 0) {
        digit = digit | 0x80 // digit代表余数
      }
      buffer.writeUInt8(digit, pos++, true)
    } while (length > 0)

    return pos - origPos
  }

  /**
   * writeNumber - write a two byte number to the buffer
   *
   * @param <Buffer> buffer - destination
   * @param <Number> pos - offset
   * @param <String> number - number to write
   * @return <Number> number of bytes written
   *
   * @api private
   */
  writeNumber (buffer, pos, number) {
    buffer.writeUInt8(number >> 8, pos, true)
    buffer.writeUInt8(number & 0x00FF, pos + 1, true)

    return 2
  }

  /**
   * calcLengthLength - calculate the length of the remaining
   * length field
   *
   * @api private
   */
  calcLengthLength (length) {
    if (length >= 0 && length < 128) {
      return 1
    } else if (length >= 128 && length < 16384) {
      return 2
    } else if (length >= 16384 && length < 2097152) {
      return 3
    } else if (length >= 2097152 && length < 268435456) {
      return 4
    } else {
      return 0
    }
  }
}
