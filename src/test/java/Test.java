import jmbox.audio.Converter;

import javax.sound.sampled.AudioFileFormat;
import javax.sound.sampled.AudioInputStream;
import javax.sound.sampled.AudioSystem;
import javax.sound.sampled.UnsupportedAudioFileException;
import java.io.File;
import java.io.IOException;
import java.io.InputStream;

public class Test {
    public static void main(String[] args) throws IOException, UnsupportedAudioFileException {
        Converter c = new Converter(new File("131.mid"));
        AudioInputStream s = c.convert();
        s.skip(100000);
        AudioSystem.write(s, AudioFileFormat.Type.WAVE, new File("out.wav"));
    }
}
