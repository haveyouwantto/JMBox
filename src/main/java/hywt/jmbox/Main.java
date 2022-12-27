package hywt.jmbox;


import hywt.jmbox.web.Config;
import hywt.jmbox.web.WebServer;

import java.io.File;
import java.io.IOException;
import java.net.InetSocketAddress;

public class Main {
    public static void main(String[] args) throws IOException {
        Config.init();
        int port = Config.getInteger("port");
        WebServer server = new WebServer(new File("."), new InetSocketAddress(port));
        server.start();
    }
}
