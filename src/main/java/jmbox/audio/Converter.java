package jmbox.audio;

import javax.sound.sampled.AudioInputStream;
import javax.sound.sampled.AudioSystem;
import javax.sound.sampled.UnsupportedAudioFileException;
import java.io.*;

public class Converter {
    public File midi;

    public Converter(File midi) {
        this.midi = midi;
    }

    public AudioInputStream convert() throws IOException, UnsupportedAudioFileException {

        return AudioSystem.getAudioInputStream(midi);
    }
}
