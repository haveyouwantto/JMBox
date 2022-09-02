package jmbox;

import jmbox.web.Config;
import jmbox.web.WebServer;

import java.io.File;
import java.io.IOException;
import java.net.InetSocketAddress;
import java.util.Arrays;

public class Main {
    public static void main(String[] args) throws IOException {
        Config.load();
        int port = 64000;
        if (args.length >= 1) {
            port = Integer.parseInt(args[0]);
        }
        WebServer server = new WebServer(new File("."), new InetSocketAddress(port));
        server.start();
    }
}
