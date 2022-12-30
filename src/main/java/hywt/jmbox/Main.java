package hywt.jmbox;


import hywt.jmbox.web.Config;
import hywt.jmbox.web.WebServer;

import java.io.File;
import java.io.IOException;
import java.net.InetSocketAddress;
import java.util.prefs.Preferences;

public class Main {
    public static void main(String[] args) throws IOException {
        Config.init();

        // Gervill hacks
        Preferences gervillPerf = Preferences.userRoot().node("/com/sun/media/sound/softsynthesizer");

        // Max polyphony
        gervillPerf.put("max polyphony", Config.get("gervill-max-polyphony"));
        // Interpolation
        gervillPerf.put("interpolation", Config.get("gervill-interpolation"));

        gervillPerf.put("large mode", Config.get("gervill-large-mode"));

        int port = Config.getInteger("port");
        WebServer server = new WebServer(new File("."), new InetSocketAddress(port));
        server.start();
    }
}
