package jmbox.audio;

import com.sun.media.sound.MidiUtils;

import javax.sound.midi.*;
import javax.sound.sampled.AudioInputStream;
import javax.sound.sampled.AudioSystem;
import javax.sound.sampled.UnsupportedAudioFileException;
import java.io.*;

/**
 * Midi converter wrapper
 */
public class Converter {
    public File midi;

    public Converter(File midi) {
        this.midi = midi;
    }

    public void trim(Sequence sequence, long startTick) {
        Track[] tracks = sequence.getTracks();
        for (Track track : tracks) {
            for (int i = 0; i < track.size(); i++) {
                MidiEvent event = track.get(i);
                MidiMessage message = event.getMessage();
                long tick = event.getTick();
                if (tick <= startTick) {
                    // Filter out note on
                    if (message instanceof ShortMessage) {
                        ShortMessage sm = (ShortMessage) event.getMessage();
                        if (sm.getCommand() == ShortMessage.NOTE_ON || sm.getCommand() == ShortMessage.NOTE_OFF) {
                            track.remove(event);
                            i--;
                            continue;
                        }
                    }
                    event.setTick(0);
                } else {
                    event.setTick(tick - startTick);
                }
            }
        }
    }

    // TODO: replace midiutils
    public long getTick(Sequence sequence, double duration) {
        MidiUtils.TempoCache cache = new MidiUtils.TempoCache(sequence);
        return MidiUtils.microsecond2tick(sequence, (long) (duration * 1e6), cache);
    }

    public AudioInputStream convert() throws IOException, UnsupportedAudioFileException {
        return AudioSystem.getAudioInputStream(midi);
    }

    public AudioInputStream convert(double startTime)
            throws IOException, InvalidMidiDataException, UnsupportedAudioFileException {
        // 打开midi文件
        FileInputStream inputStream = new FileInputStream(midi);
        Sequence sequence = MidiSystem.getSequence(inputStream);

        long startTick = getTick(sequence, startTime);
        trim(sequence, startTick);

        // 写入内存
        ByteArrayOutputStream os = new ByteArrayOutputStream();
        MidiSystem.write(sequence, 1, os);
        ByteArrayInputStream is = new ByteArrayInputStream(os.toByteArray());

        // 获取midi文件中的音频数据
        AudioInputStream audioStream = AudioSystem.getAudioInputStream(is);

        // 关闭文件流
        inputStream.close();

        return audioStream;
    }
}
