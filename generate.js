let utils = require('./utlis')
let protocol = require('./constants')

const emptyBuffer = Buffer.from([0])
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
        return this.confirmation()
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

  /* 请求连接 */
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

  /* 发布 */
  publish () {
    let dup = this._packet.dup ? protocol.DUP_MASK : 0
    let qos = this._packet.qos
    let retain = this._packet.retain ? protocol.RETAIN_MASK : 0
    let topic = this._packet.topic
    let payload = this._packet.payload || emptyBuffer
    let messageId = this._packet.messageId

    // 定义游标和长度
    let length = 0
    let pos = 0

    // Topic must be a non-empty string or Buffer
    if (typeof topic === 'string') {
      length += Buffer.byteLength(topic) + 2 // +2用于保存Topic长度
    } else if (Buffer.isBuffer(topic)) {
      length += topic.length + 2
    } else {
      utils.showError('Invalid topic')
    }

    // Payload length caculate
    if (Buffer.isBuffer(payload)) {
      length += Buffer.byteLength(payload)
    } else {
      length += payload.length
    }

    let buffer = Buffer.alloc(1 + this.calcLengthLength(length) + length)

    // Header
    buffer.writeInt8(
      protocol.codes['publish'] << protocol.CMD_SHIFT |
      dup |
      qos << protocol.QOS_SHIFT |
      retain, pos++, true)

    // Length
    pos += this.writeLength(buffer, pos, length)

    // Topic
    pos += this.writeStringOrBuffer(buffer, pos, topic)

    // MessageId
    if (qos > 0) {
      pos += this.writeNumber(buffer, pos, messageId)
    }

    // Payload
    if (!Buffer.isBuffer(payload)) {
      this.writeStringNoPos(buffer, pos, payload)
    } else {
      this.writeBuffer(buffer, pos, payload)
    }

    return buffer
  }

  /* puback、pubrec、pubrel、pubcomp、unsuback流程可一样处理 */
  confirmation () {
    let cmd = this._cmd
    let messageId = this._packet.messageId
    let dup = (this._packet.dup && cmd === 'pubrel') ? protocol.DUP_MASK : 0
    let qos = 0

    if (cmd === 'pubrel') {
      qos = 1
    }

    // check messageID
    if (typeof messageId !== 'number') {
      utils.showError('Invalid messageId')
    }

    let buffer = Buffer.alloc(4)
    let pos = 0

    // Header
    buffer[pos++] =
    protocol.codes[cmd] << protocol.CMD_SHIFT |
    dup |
    qos << protocol.QOS_SHIFT

    // Length
    pos += this.writeLength(buffer, pos, 2)

    // Message ID
    pos += this.writeNumber(buffer, pos, messageId)

    return buffer
  }

  /* 断开连接 */
  emptyPacket () {
    let buffer = Buffer.alloc(2)
    let cmd = this._cmd
    buffer[0] = protocol.codes[cmd] << protocol.CMD_SHIFT
    buffer[1] = 0

    return buffer
  }
  /**
   * 用于往buffer的pos开始处写入数值，数值最高位需符合大小端进位为符号位
   * @param {<Buffer>} buffer 传入的buffer
   * @param {<Number>} pos 目前的游标
   * @param {<Number>} length 需要写入的长度
   * @returns <Number> 返回消耗了多少buffer空间
   * @api private
   */

  // 如果 length = 16385 buffer = [48, 129, 128, 1, 0 ....] 48代表 110000 publish   128 * 127 + 129
  // 如果 length = 16384 buffer = [48, 128, 128, 1, 0 ....] 48代表 110000 publish   128 * 127 + 128
  // 如果 length = 16383 buffer = [48, 255, 127, 0, 0 ....] 48代表 110000 publish   128 * 127 + 128
  // 如果 length = 2097151 buffer = [48, 255, 255, 127, 0 ....]
  // 如果 length = 128 buffer = [48, 128, 1, 0 ....]
  // 如果 length = 127 buffer = [48, 127, 0, 0 ....]
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
   * @param {<Buffer>} buffer - destination
   * @param {<Number>} pos - offset
   * @param {<String>} number - number to write
   * @return {<Number>} number of bytes written
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

  /**
   * writeStringOrBuffer - write a String or Buffer with the its length prefix 抹平写入Buffer/String的差异性
   *
   * @param <Buffer> buffer - destination
   * @param <Number> pos - offset
   * @param <String> toWrite - String or Buffer
   * @return <Number> number of bytes written
  */
  writeStringOrBuffer (buffer, pos, toWrite) {
    let written = 0

    if (toWrite && typeof toWrite === 'string') {
      written += this.writeString(buffer, pos + written, toWrite)
    } else if (toWrite) {
      written += this.writeNumber(buffer, pos + written, toWrite.length)
      written += this.writeBuffer(buffer, pos + written, toWrite)
    } else {
      written += this.writeNumber(buffer, pos + written, 0)
    }

    return written
  }

  /**
   * writeString - write a utf8 string to the buffer
   *
   * @param <Buffer> buffer - destination
   * @param <Number> pos - offset
   * @param <String> string - string to write
   * @return <Number> number of bytes written
   *
   * @api private
  */
  writeString (buffer, pos, string) {
    let strLen = Buffer.byteLength(string)

    this.writeNumber(buffer, pos, strLen)

    this.writeStringNoPos(buffer, pos + 2, string)

    return strLen + 2
  }

  /**
   * Only write string don't write string length
   * @param {<Buffer>} buffer
   * @param {<Number>} pos
   * @param {<String>} string
   * @api private
   */
  writeStringNoPos (buffer, pos, string) {
    buffer.write(string, pos)
  }

  /**
   * write_buffer - write buffer to buffer
   *
   * @param {<Buffer>} buffer - dest buffer
   * @param {<Number>} pos - offset
   * @param {<Buffer>} src - source buffer
   * @return {<Number>} number of bytes written
   *
   * @api private
   */
  writeBuffer (buffer, pos, src) {
    src.copy(buffer, pos)
    return src.length
  }
}
