import jmbox.web.Config;
import jmbox.web.WebServer;

import java.io.File;
import java.io.IOException;
import java.net.InetSocketAddress;

public class TestLaunch {
    public static void main(String[] args) throws IOException {
        Config.load();
        String property = Config.prop.getProperty("port", "60752");
        int port = Integer.parseInt(property);

        WebServer server = new WebServer(new File("."), new InetSocketAddress(port));
        server.start();
    }
}
