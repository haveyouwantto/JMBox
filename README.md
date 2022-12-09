# JMBox
Simple MIDI File Server

![](resources/jmbox.png)

JMBox is a lightweight MIDI server software that allows users to convert MIDI files to audio and stream them. It also features an 8-bit MIDI browser-based player, playback controls, and the ability to directly control MIDI devices, including your software synthesizers, virtual MIDI synthesizers, and physical MIDI devices like pianos.

One of the key advantages of JMBox is its versatility. It can be run on a smartphone using the Termux app, allowing users to share MIDI files with others over a shared hotspot. It can also be run on a NAS device, making it accessible to anyone on the local network.

Some limitations of JMBox include the need to fully render audio files before seeking, as well as a significant delay when controlling MIDI devices. Despite this, JMBox offers a convenient and lightweight solution for MIDI playback and control. The developer of JMBox welcomes pull requests to address these limitations and improve the software.

server.properties properties
|  property   | default  | comment |
| ---- | ---- | ---- |
|  server-name  | JMBox | The displayed server name. |
|  port  | 60752 | The server port. |
|  external-ui | | Path to external ui. |
|  max-file-size  | 1048576 | Maximum allowed MIDI file size. |
|  theme-color | #00796b | Theme color for the ui. |