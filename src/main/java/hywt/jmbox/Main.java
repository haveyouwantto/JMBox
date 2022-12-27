package hywt.jmbox;


import hywt.jmbox.web.Config;
import hywt.jmbox.web.WebServer;

import java.io.File;
import java.io.IOException;
import java.net.InetSocketAddress;
import java.util.prefs.Preferences;

public class Main {
    public static void main(String[] args) throws IOException {
        // Setup gervill config
        Preferences gervillPerf = Preferences.userRoot().node("/com/sun/media/sound/softsynthesizer");

        // Use interpolation (best quality, slowest)
        gervillPerf.put("interpolation","sinc");
        // Max polyphony
        gervillPerf.put("max polyphony","500");

        Config.init();
        int port = Config.getInteger("port");
        WebServer server = new WebServer(new File("."), new InetSocketAddress(port));
        server.start();
    }
}
