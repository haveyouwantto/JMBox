import com.sun.media.sound.AudioSynthesizer;

import javax.sound.midi.InvalidMidiDataException;
import javax.sound.midi.MidiSystem;
import javax.sound.midi.MidiUnavailableException;
import javax.sound.midi.Sequencer;
import javax.sound.sampled.*;
import java.io.File;
import java.io.IOException;
import java.util.HashMap;
import java.util.Map;

public class Test {
    public static void main(String[] args) throws IOException, UnsupportedAudioFileException, MidiUnavailableException, InvalidMidiDataException, LineUnavailableException {

        Map<String, Object> ainfo = new HashMap<>();

        float sampleRate = 44100;
        int sampleSizeInBits = 16;
        int channels = 2;
        boolean signed = true;
        boolean bigEndian = false;

        AudioFormat af = new AudioFormat(sampleRate, sampleSizeInBits, channels, signed, bigEndian);
        ainfo.put("format", af);
        ainfo.put("max polyphony", 256);
        ainfo.put("interpolation", "sinc");

        SourceDataLine.Info info = new DataLine.Info(SourceDataLine.class, af, 48000);
        SourceDataLine sdl = (SourceDataLine) AudioSystem.getLine(info);

        sdl.open(af, 48000);
        sdl.start();

        AudioSynthesizer a = (AudioSynthesizer) MidiSystem.getMidiDevice(MidiSystem.getMidiDeviceInfo()[0]);
        if (a.getDefaultSoundbank() != null) {
            a.unloadAllInstruments(a.getDefaultSoundbank());
        }
        a.loadAllInstruments(MidiSystem.getSoundbank(new File("d:/1mgm.sf2")));

        Sequencer seq = MidiSystem.getSequencer(false);
        seq.setSequence(MidiSystem.getSequence(new File("bm.mid")));
        seq.getTransmitter().setReceiver(a.getReceiver());
        seq.open();
        seq.start();


        AudioSystem.write(a.openStream(af, ainfo), AudioFileFormat.Type.WAVE, new File("out.wav"));
    }
}
