package jmbox.web;

import com.sun.net.httpserver.HttpServer;
import jmbox.IOStream;

import java.io.IOException;
import java.io.InputStream;
import java.net.InetSocketAddress;
import java.util.logging.Logger;

public class WebServer {
    private HttpServer server;
    private final Logger logger = Logger.getLogger("Web");

    public WebServer(InetSocketAddress address) throws IOException {
        server = HttpServer.create(address, 1);
        server.createContext("/api", new APIHandler());
        server.createContext("/", exchange -> {
            InputStream is = ClassLoader.getSystemResourceAsStream("index.html");
            exchange.getResponseHeaders().set("Content-Type", "Content-Type: text/html;charset=utf-8");
            exchange.sendResponseHeaders(200, is.available());

            IOStream.writeTo(is, exchange.getResponseBody());
            exchange.close();
        });
        server.createContext("/favicon.ico", exchange -> {
            InputStream is = ClassLoader.getSystemResourceAsStream("static/favicon.ico");
            exchange.getResponseHeaders().set("Content-Type", "image/x-icon");
            exchange.sendResponseHeaders(200, is.available());
            IOStream.writeTo(is, exchange.getResponseBody());
        });
        logger.info(String.format("Listing on port %d", address.getPort()));
    }

    public void start() {
        server.start();
    }
}
