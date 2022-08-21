package jmbox.web;

import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;
import com.sun.net.httpserver.HttpServer;

import java.io.IOException;
import java.io.InputStream;
import java.net.InetSocketAddress;

public class WebServer {
    private HttpServer server;

    public WebServer(InetSocketAddress address) throws IOException {
        server = HttpServer.create(address, 1);
        server.createContext("/api", new APIHandler());
        server.createContext("/", new HttpHandler() {
            @Override
            public void handle(HttpExchange exchange) throws IOException {
                InputStream is = ClassLoader.getSystemResourceAsStream("index.html");
                exchange.getResponseHeaders().set("Content-Type", "Content-Type: text/html;charset=utf-8");
                exchange.sendResponseHeaders(200, is.available());
                byte[] buffer = new byte[4096];
                int len;
                while ((len = is.read(buffer)) >= 0) {
                    exchange.getResponseBody().write(buffer, 0, len);
                }
                exchange.close();
            }
        });
    }

    public void start() {
        server.start();
    }
}
