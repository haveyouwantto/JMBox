package jmbox.audio;

import javax.sound.midi.InvalidMidiDataException;
import javax.sound.midi.MidiSystem;
import javax.sound.midi.MidiUnavailableException;
import javax.sound.midi.Sequence;
import javax.sound.sampled.AudioFormat;
import javax.sound.sampled.AudioInputStream;
import javax.sound.sampled.AudioSystem;
import javax.sound.sampled.UnsupportedAudioFileException;
import javax.sound.sampled.spi.AudioFileReader;
import java.io.*;
import java.util.Arrays;

/** Midi converter wrapper
 * */
public class Converter {
    public File midi;

    public Converter(File midi) {
        this.midi = midi;
    }

    public AudioInputStream convert() throws IOException, UnsupportedAudioFileException {
        return AudioSystem.getAudioInputStream(midi);
    }
}
