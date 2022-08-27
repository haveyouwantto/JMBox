package jmbox;

import jmbox.web.Config;
import jmbox.web.WebServer;

import javax.sound.midi.MidiUnavailableException;
import java.io.File;
import java.io.IOException;
import java.net.InetSocketAddress;

public class Main {
    public static void main(String[] args) throws IOException {
        Config.load();
        int port = 64000;
        if (args.length>=2){
            port = Integer.parseInt(args[1]);
        }
        WebServer server = new WebServer(new File("."), new InetSocketAddress(port));
        server.start();
    }
}
