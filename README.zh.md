# JMBox
简易MIDI服务器

![](resources/jmbox.png)


JMBox是一个轻量级的MIDI服务器软件，它允许用户将MIDI文件转换为音频并流式传输。它还具有基于浏览器的简易MIDI合成器，播放控制和直接控制MIDI设备（包括您的软件合成器，虚拟MIDI合成器和钢琴等物理MIDI设备）的功能。

JMBox的一个主要优点是其跨平台性。它可以在使用Termux应用程序的智能手机上运行，允许用户通过共享热点与他人共享MIDI文件。它也可以在NAS设备上运行，使其对局域网中的任何人都可以访问。

JMBox的一些限制包括在拖动进度条时需要完全渲染音频文件，以及控制MIDI设备时的显着延迟。尽管如此，JMBox仍然提供了一种方便且轻量级的MIDI播放和控制解决方案。 JMBox的开发人员欢迎拉取请求来解决这些限制并改进软件。

server.properties相关配置

| 属性 | 默认值 | 描述 |
| --- | ------ | ----------- |
| server-name | JMBox | 显示的服务器名称。 |
| port | 60752 | 服务器端口。 |
| external-ui | | 外部UI的路径。 |
| max-file-size | 1048576 | MIDI文件的最大允许大小，以字节为单位。 |
| theme-color | #00796b | UI的主题颜色。 |
| enable-midi | true | 是否启用MIDI功能。 |
| enable-play | true | 是否启用WAVE播放功能。 |