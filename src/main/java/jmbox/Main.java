package jmbox;

import jmbox.web.Config;
import jmbox.web.WebServer;

import javax.sound.midi.MidiUnavailableException;
import java.io.IOException;
import java.net.InetSocketAddress;

public class Main {
    public static void main(String[] args) throws IOException, MidiUnavailableException {
        Config.load();
        WebServer server = new WebServer(new InetSocketAddress(64000));
        server.start();
    }
}
