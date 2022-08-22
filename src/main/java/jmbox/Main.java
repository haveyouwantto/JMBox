package jmbox;

import jmbox.web.WebServer;

import java.io.IOException;
import java.net.InetSocketAddress;
import java.util.logging.Logger;

public class Main {
    public static void main(String[] args) throws IOException {
        WebServer server = new WebServer(new InetSocketAddress(64000));
        server.start();
    }
}
