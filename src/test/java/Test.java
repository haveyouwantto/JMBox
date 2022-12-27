
import hywt.jmbox.web.Config;
import hywt.jmbox.web.WebServer;

import java.io.File;
import java.io.IOException;
import java.net.InetSocketAddress;
import java.util.prefs.Preferences;

public class Test {
    public static void main(String[] args) throws IOException {
        Config.init();
        int port = Config.getInteger("port");

        WebServer server = new WebServer(new File("."), new InetSocketAddress(port), true);
        server.start();
    }
}
