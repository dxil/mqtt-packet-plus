import { utils } from './utlis'

export class Generate {
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
  constructor (packet) {
    this._packet = packet
    this._cmd = packet.cmd || ''
    this.generate()
  }

  beforeGenerate () {
    if (!this._packet) {
      throw new Error('packet can not be empty!')
    }
  }

  generate () {
    this.beforeGenerate()
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
  connack () {
    let returnCode = this._packet.returnCode
    let sessionPresent = this._packet.sessionPresent

    if (typeof returnCode !== 'number') {
      utils.showError('Invalid return code')
    }
  }
}
