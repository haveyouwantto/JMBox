import jmbox.audio.Converter;

import javax.sound.sampled.AudioFileFormat;
import javax.sound.sampled.AudioSystem;
import javax.sound.sampled.UnsupportedAudioFileException;
import java.io.File;
import java.io.IOException;

public class Test {
    public static void main(String[] args) throws IOException, UnsupportedAudioFileException {
        Converter c = new Converter(new File("131.mid"));
        AudioSystem.write(c.convert(), AudioFileFormat.Type.WAVE, new File("out.wav"));
    }
}
