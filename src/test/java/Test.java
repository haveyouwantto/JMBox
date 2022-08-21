import jmbox.audio.Converter;
import jmbox.web.WebServer;

import javax.sound.sampled.AudioFileFormat;
import javax.sound.sampled.AudioSystem;
import javax.sound.sampled.UnsupportedAudioFileException;
import java.io.File;
import java.io.IOException;
import java.net.InetSocketAddress;

public class Test {
    public static void main(String[] args) throws IOException, UnsupportedAudioFileException {
//        Converter c = new Converter(new File("131.mid"));
//        AudioSystem.write(c.convert(), AudioFileFormat.Type.WAVE, new File("out.wav"));
        WebServer server = new WebServer(new InetSocketAddress(64000));
        server.start();
    }
}
