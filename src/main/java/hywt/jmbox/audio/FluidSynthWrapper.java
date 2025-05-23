package hywt.jmbox.audio;

import javax.sound.sampled.AudioFormat;
import javax.sound.sampled.AudioInputStream;
import javax.sound.sampled.AudioSystem;
import java.io.File;

public class FluidSynthWrapper implements IMidiRenderer {

    private File midiFile;

    public FluidSynthWrapper(File midiFile) {
        this.midiFile = midiFile;
    }

    @Override
    public AudioInputStream getAudioInputStream() throws Exception {

        AudioInputStream probe = AudioSystem.getAudioInputStream(midiFile);
        long length = probe.getFrameLength();
        probe.close();

        ProcessBuilder processBuilder = new ProcessBuilder(
                "fluidsynth",
                "-ni",
                "-F","-",
                "-T", "raw",
                "-r", "44100",
                midiFile.getAbsolutePath());
        processBuilder.redirectErrorStream(true);
        Process process = processBuilder.start();
        AudioInputStream audioInputStream = new AudioInputStream(process.getInputStream(),
                new AudioFormat(44100, 16, 2, true, false), length);
        return audioInputStream;
    }
}
