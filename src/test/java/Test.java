

import javax.sound.midi.*;
import javax.sound.sampled.AudioFileFormat;
import javax.sound.sampled.AudioFormat;
import javax.sound.sampled.AudioInputStream;
import javax.sound.sampled.AudioSystem;
import java.io.File;
import java.io.IOException;
import java.lang.reflect.InvocationTargetException;
import java.lang.reflect.Method;
import java.util.Map;

public class Test {
    public static void main(String[] args) throws MidiUnavailableException, InvalidMidiDataException, IOException, InterruptedException, NoSuchMethodException, InvocationTargetException, IllegalAccessException {
        Synthesizer synth = MidiSystem.getSynthesizer();
        Soundbank soundbank = MidiSystem.getSoundbank(new File("Ct8mgm.sf2"));
        synth.loadAllInstruments(soundbank);
//        synth.open();

        Method method = synth.getClass().getMethod("openStream", AudioFormat.class, Map.class);
        AudioInputStream ais = (AudioInputStream) method.invoke(synth, new AudioFormat(44100, 16, 2, true, false), null);
        AudioInputStream out = new AudioInputStream(ais, ais.getFormat(), (long) (ais.getFormat().getSampleRate() * 10));
        Receiver receiver = synth.getReceiver();

        receiver.send(new ShortMessage(ShortMessage.NOTE_ON, 60, 100), 0);
        receiver.send(new ShortMessage(ShortMessage.NOTE_ON, 62, 100), 1000000);
        receiver.send(new ShortMessage(ShortMessage.NOTE_ON, 64, 100), 2000000);
//        Thread.sleep(1000);
        AudioSystem.write(out, AudioFileFormat.Type.WAVE, new File("out.wav"));
    }
}
