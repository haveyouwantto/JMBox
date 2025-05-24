package hywt.jmbox.audio;

import javax.sound.sampled.AudioInputStream;

public interface IMidiRenderer {
    AudioInputStream getAudioInputStream(long startMicrosecond) throws Exception;
}
