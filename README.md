# mqtt-packet-plus

#### mqtt
[v3.1.1中文版](https://mcxiaoke.gitbooks.io/mqtt-cn/content/mqtt/0309-SUBACK.html)
[v5.0介绍](https://zhuanlan.zhihu.com/p/37121056)

#### 功能：
1. generate模块 将客户端发送的报文按5.0规范转成Buffer网络传输
2. parse模块 将传来的ArrayBuffer转成客户端可以看懂的意思


TODO:
1. generate:
  
    - [ ] connect
    - [x] connack
    - [ ] publish
    - [ ] puback
    - [ ] pubrec
    - [ ] pubrel
    - [ ] pubcomp
    - [ ] subscribe
    - [ ] suback    // **doing**
    - [ ] unsubscribe
    - [ ] unsuback
    - [ ] pingreq
    - [ ] pingresp
    - [ ] disconnect
    
2. parse:
  暂未开发
