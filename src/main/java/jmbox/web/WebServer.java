package jmbox.web;

import com.sun.net.httpserver.HttpServer;
import jmbox.IOStream;

import java.io.File;
import java.io.IOException;
import java.io.InputStream;
import java.net.InetSocketAddress;
import java.net.URLDecoder;
import java.util.Arrays;
import java.util.logging.Logger;

public class WebServer {
    private HttpServer server;
    private final Logger logger = Logger.getLogger("Web");

    public WebServer(File rootDir, InetSocketAddress address) throws IOException {
        server = HttpServer.create(address, 1);
        server.createContext("/api", new APIHandler(rootDir));
        server.createContext("/", new StaticHandler());
        logger.info(String.format("Listing on port %d", address.getPort()));
    }

    public void start() {
        server.start();
    }
}
