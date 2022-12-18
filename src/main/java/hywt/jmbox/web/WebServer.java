package hywt.jmbox.web;

import com.sun.net.httpserver.HttpServer;
import hywt.jmbox.logging.LoggerUtil;

import java.io.File;
import java.io.IOException;
import java.net.InetSocketAddress;
import java.util.logging.Logger;

/** The main class for web server
 * */
public class WebServer {
    private HttpServer server;
    private final Logger logger = LoggerUtil.getLogger("Web");

    public WebServer(File rootDir, InetSocketAddress address) throws IOException {
        server = HttpServer.create(address, 1);
        server.createContext("/api", new APIHandler(rootDir));
        server.createContext("/", new StaticHandler());
        logger.info(String.format("Listing on port %d", address.getPort()));
        logger.info(String.format("http://127.0.0.1:%d", address.getPort()));
    }

    public void start() {
        server.start();
    }
}
