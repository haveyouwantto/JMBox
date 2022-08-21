package jmbox;

import jmbox.web.WebServer;

import java.io.IOException;
import java.net.InetSocketAddress;

public class Main {
    public static void main(String[] args) throws IOException {
        WebServer server = new WebServer(new InetSocketAddress(64000));
        server.start();
    }
}
