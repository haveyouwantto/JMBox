package jmbox;

import jmbox.web.Config;
import jmbox.web.WebServer;

import java.io.File;
import java.io.IOException;
import java.net.InetSocketAddress;

public class Main {
    public static void main(String[] args) throws IOException {
        Config.load();
        String property = Config.prop.getProperty("port");
        int port;
        if (property == null) {
            port = 60752;
        } else {
            port = Integer.parseInt(property);
        }
        WebServer server = new WebServer(new File("."), new InetSocketAddress(port));
        server.start();
    }
}
