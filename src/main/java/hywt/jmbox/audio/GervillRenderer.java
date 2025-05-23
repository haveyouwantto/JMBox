package hywt.jmbox.audio;

import javax.sound.sampled.AudioInputStream;
import javax.sound.sampled.AudioSystem;
import java.io.*;

/**
 * Midi converter wrapper
 */
public class GervillRenderer implements IMidiRenderer{
    public File midi;

    public GervillRenderer(File midi) {
        this.midi = midi;
    }

    @Override
    public AudioInputStream getAudioInputStream() throws Exception{
        return AudioSystem.getAudioInputStream(this.midi);
    }
}
