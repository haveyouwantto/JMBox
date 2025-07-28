package hywt.jmbox.web;

import com.sun.net.httpserver.Headers;
import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;
import hywt.jmbox.io.IOStream;
import hywt.jmbox.logging.LoggerUtil;

import java.io.*;
import java.net.URLDecoder;
import java.util.List;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.logging.Logger;

/**
 * The http handler to delivery static content
 */
public class StaticHandler implements HttpHandler {
    private static final Logger logger = LoggerUtil.getLogger("Static");
    private long bootTime;
    private ExecutorService executor;
    private boolean test;

    public StaticHandler() {
        this(false);
    }

    public StaticHandler(boolean test) {
        super();
        executor = Executors.newFixedThreadPool(Runtime.getRuntime().availableProcessors());
        bootTime = System.currentTimeMillis();
        this.test = test;
    }

    @Override
    public void handle(HttpExchange exchange) {
        logger.info(String.format("%s %s %s", exchange.getRemoteAddress(), exchange.getRequestMethod(), exchange.getRequestURI()));
        executor.submit(() -> process(exchange));
    }

    private void process(HttpExchange exchange) {
        try {
            String[] args = URLDecoder.decode(exchange.getRequestURI().toString(), "UTF-8").split("/");
            String baseFile;

            String ext = Config.get("external-ui");

            // if root path
            if (args.length == 0) {
                baseFile = "index.html";
            } else {
                baseFile = FilePath.buildPath(args, 0);
            }

            File file = null;
            InputStream is;
            if (ext.length() == 0) {
                // Use internal ui
                is = ClassLoader.getSystemResourceAsStream("ui/" + baseFile);
                if (is == null) {
                    notFound(exchange);
                    return;
                }
            } else {
                // External ui
                file = new File(ext, baseFile);
                if (!file.exists() || !file.isFile()) {
                    notFound(exchange);
                    return;
                }
                is = new FileInputStream(file);
            }

            Headers response = exchange.getResponseHeaders();

            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            is.transferTo(baos);

            byte[] content = baos.toByteArray();
            InputStream stream1 = new ByteArrayInputStream(content);
            is = new ByteArrayInputStream(content);
            String etag = ETagGenerator.md5(stream1);

            // Check if eTag matches
            List<String> lastEtag = exchange.getRequestHeaders().get("If-None-Match");
            if (lastEtag != null && !lastEtag.isEmpty() && etag != null && etag.equals(lastEtag.get(0))) {
                exchange.sendResponseHeaders(304, 0);
                return;
            }

            response.set("ETag", etag);
            if (!test) response.set("Cache-Control", "max-age=3600");

            // Send file
            exchange.sendResponseHeaders(200, is.available());
            IOStream.writeTo(is, exchange.getResponseBody());
            exchange.close();
        } catch (IOException e) {
            e.printStackTrace();
        }

    }

    private void notFound(HttpExchange exchange) throws IOException {
        exchange.sendResponseHeaders(404, 3);
        exchange.getResponseBody().write("404".getBytes());
        exchange.close();
    }
}
