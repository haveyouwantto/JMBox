package jmbox.web;

import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;
import jmbox.IOStream;

import java.io.File;
import java.io.FileInputStream;
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
        File baseFile;

        String ext = Config.prop.getProperty("external-ui");
        if (args.length == 0) {
            baseFile = new File("index.html");
        } else {
            baseFile = FilePath.buildPath(new File(""), args, 0);
        }

        InputStream is;
        if (ext == null) {
            is = ClassLoader.getSystemResourceAsStream(baseFile.getPath());
            if (is == null) {
                notFound(exchange);
                return;
            }
        } else {
            File file = new File(ext, baseFile.getPath());
            if (!file.exists() || !file.isFile()) {
                notFound(exchange);
                return;
            }
            is = new FileInputStream(file);
        }

        exchange.sendResponseHeaders(200, is.available());
        IOStream.writeTo(is, exchange.getResponseBody());
        exchange.close();
    }

    public void notFound(HttpExchange exchange) throws IOException {
        exchange.sendResponseHeaders(404, 0);
        exchange.close();
    }
}
