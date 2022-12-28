
import hywt.jmbox.web.Config;
import hywt.jmbox.web.WebServer;

import java.io.File;
import java.io.IOException;
import java.net.InetSocketAddress;
import java.util.prefs.Preferences;

public class Test {
    public static void main(String[] args) throws IOException {
        // Setup gervill config
        Preferences gervillPerf = Preferences.userRoot().node("/com/sun/media/sound/softsynthesizer");

        // Use sinc interpolation (best quality, slowest)
        System.out.println(gervillPerf.get("interpolation",null));
        Config.init();
        int port = Config.getInteger("port");

        WebServer server = new WebServer(new File("."), new InetSocketAddress(port), true);
        server.start();
    }
}
