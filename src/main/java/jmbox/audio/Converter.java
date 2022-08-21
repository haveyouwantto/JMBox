package jmbox.audio;

import javax.sound.sampled.AudioInputStream;
import javax.sound.sampled.AudioSystem;
import javax.sound.sampled.UnsupportedAudioFileException;
import java.io.*;

public class Converter {
    public InputStream is;

    public Converter(File midi) throws FileNotFoundException {
        this.is = new FileInputStream(midi);
    }

    public Converter(InputStream is) {
        this.is = is;
    }

    public AudioInputStream convert() throws IOException, UnsupportedAudioFileException {
        return AudioSystem.getAudioInputStream(is);
    }
}
