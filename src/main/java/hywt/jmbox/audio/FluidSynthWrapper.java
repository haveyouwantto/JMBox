package hywt.jmbox.audio;

import javax.sound.midi.MidiSystem;
import javax.sound.midi.Sequence;
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
    public AudioInputStream getAudioInputStream(long start) throws Exception {
        System.out.println(start);

        AudioFormat audioFormat = new AudioFormat(44100, 16, 2, true, false);
        
        Sequence sequence = MidiSystem.getSequence(midiFile);
        long length = sequence.getMicrosecondLength();
        long sampleLen = (long) ((length / 1000000f)*audioFormat.getSampleRate());

        ProcessBuilder processBuilder = new ProcessBuilder(
                "fluidsynth",
                "-ni",
                "-F","-",
                "-T", "raw",
                "-r", "44100",
                "-o", "synth.gain=1",
                "-o", "synth.polyphony=128",
                midiFile.getAbsolutePath());
        Process process = processBuilder.start();
        AudioInputStream audioInputStream = new AudioInputStream(process.getInputStream(),
                audioFormat, sampleLen);
        return audioInputStream;
    }
}
