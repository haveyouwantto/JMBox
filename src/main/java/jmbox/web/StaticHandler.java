package jmbox.web;

import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;
import jmbox.IOStream;

import java.io.File;
import java.io.IOException;
import java.io.InputStream;
import java.net.URLDecoder;
import java.util.logging.Logger;

public class StaticHandler implements HttpHandler {
    private static final Logger logger = Logger.getLogger("Static");

    @Override
    public void handle(HttpExchange exchange) throws IOException {
        logger.info(String.format("%s %s %s", exchange.getRemoteAddress(), exchange.getRequestMethod(), exchange.getRequestURI()));
        String[] args = URLDecoder.decode(exchange.getRequestURI().toString(), "UTF-8").split("/");
        String fileName;
        if (args.length == 0) {
            fileName = "index.html";
        } else {
            fileName = FilePath.buildPath(new File("static"), args, 0).getPath();
        }
        InputStream is = ClassLoader.getSystemResourceAsStream(fileName);
        exchange.getResponseHeaders().set("Content-Type", "Content-Type: text/html;charset=utf-8");
        exchange.sendResponseHeaders(200, is.available());

        IOStream.writeTo(is, exchange.getResponseBody());
        exchange.close();
    }
}
