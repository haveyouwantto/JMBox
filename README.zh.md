# JMBox
简易MIDI服务器

![](resources/jmbox.png)


JMBox是一个轻量级的MIDI服务器软件，它允许用户将MIDI文件转换为音频进行流式传输，并使用浏览器来播放。它还具有基于浏览器的简易MIDI合成器，播放控制和直接控制MIDI设备（包括您的软件合成器，虚拟MIDI合成器和钢琴等物理MIDI设备）的功能。

JMBox的一个主要优点是其跨平台性。它可以在使用Termux应用程序的智能手机上运行，允许用户通过共享热点与他人共享MIDI文件。它也可以在NAS设备上运行，使其对局域网中的任何人都可以访问。

JMBox甚至包含一个高性能的钢琴瀑布功能，使用户能够以更直观的方式可视化MIDI数据。钢琴瀑布能够轻松地在PC上打开并流畅渲染超过100万音符的MIDI文件。

JMBox的一些限制包括在拖动进度条时需要完全渲染音频文件，以及控制MIDI设备时的显着延迟。尽管如此，JMBox仍然提供了一种方便且轻量级的MIDI播放和控制解决方案。 JMBox的开发人员欢迎拉取请求来解决这些限制并改进软件。

## 服务器配置
第一次运行时，JMBox会在当前文件夹下自动生成一个 `server.properties`。
server.properties相关配置

| 属性 | 默认值 | 描述 |
| --- | ------ | ----------- |
| server-name | JMBox | 显示的服务器名称 |
| port | 60752 | 服务器端口 |
| external-ui | | 外部UI的路径 |
| streaming-file-size | 786432 | 进入串流模式的最小文件大小 |
| max-file-size | 1048576 | MIDI文件的最大允许大小，以字节为单位 |
| theme-color | #00796b | UI的主题颜色 |
| enable-midi | true | 是否启用MIDI功能 |
| enable-play | true | 是否启用WAVE播放功能 |
| scan-for-audio | false | 是否扫描同名音频文件 |


## 编译

编译一个纯Java软件很简单，只要按照以下步骤操作：
  1. 克隆此仓库 
  2. 进入项目文件夹
  3. 使用 Gradle 编译项目:
  ```
  ./gradlew jar
  ```
  4. 编译后的软件将位于 `build/libs` 文件夹中。