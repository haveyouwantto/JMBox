package hywt.jmbox.audio;

import javax.sound.sampled.AudioInputStream;
import javax.sound.sampled.AudioSystem;
import java.io.*;

/**
 * Midi converter wrapper
 */
public class GervillRenderer implements IMidiRenderer {
    public File midi;

    public GervillRenderer(File midi) {
        this.midi = midi;
    }

    @Override
    public AudioInputStream getAudioInputStream(long startMicroseconds) throws Exception {
        AudioInputStream stream = AudioSystem.getAudioInputStream(this.midi);
        // if (startMicroseconds > 0) {
        //     // Calculate the number of frames to skip
        //     long framesToSkip = (long) (startMicroseconds * stream.getFormat().getFrameRate() / 1000000);
        //     // Skip the frames
        //     stream.skip(framesToSkip * stream.getFormat().getFrameSize());
        // }
        return stream;
    }
}
