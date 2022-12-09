package jmbox.web;

import com.google.gson.JsonArray;
import com.google.gson.JsonObject;
import com.sun.media.sound.WaveFileWriter;
import com.sun.net.httpserver.Headers;
import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;
import jmbox.IOStream;
import jmbox.audio.Converter;
import jmbox.logging.LoggerUtil;

import javax.sound.midi.InvalidMidiDataException;
import javax.sound.sampled.AudioFileFormat;
import javax.sound.sampled.AudioInputStream;
import javax.sound.sampled.AudioSystem;
import javax.sound.sampled.UnsupportedAudioFileException;
import java.io.*;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.logging.Logger;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * API processor
 */
public class APIHandler implements HttpHandler {
    private File rootDir;
    private static final Pattern REGEX = Pattern.compile("(\\d+)?-(\\d+)?");
    private static final Logger logger = LoggerUtil.getLogger("API");

    private ExecutorService executor;

    APIHandler(File rootDir) {
        super();
        this.rootDir = rootDir;
        executor = Executors.newFixedThreadPool(Runtime.getRuntime().availableProcessors());
    }

    @Override
    public void handle(HttpExchange exchange) {
        logger.info(String.format("%s %s %s", exchange.getRemoteAddress(), exchange.getRequestMethod(), exchange.getRequestURI()));
        executor.submit(() -> process(exchange));
    }

    private void process(HttpExchange exchange) {
        try {
            Headers headers = exchange.getResponseHeaders();
            headers.set("Access-Control-Allow-Origin", "*");
            headers.set("Access-Control-Allow-Headers", "*");
            headers.set("Server", "JMBox API");

            if (exchange.getRequestMethod().equals("GET")) {
                // GET api/<operation>/<params>
                String[] args = URLDecoder.decode(exchange.getRequestURI().toString(), "UTF-8").split("/");
                if (args.length > 2) {
                    switch (args[2]) {
                        case "play":
                            play(exchange, new File(rootDir, FilePath.buildPath(args, 3)));
                            return;
                        case "list":
                            list(exchange, new File(rootDir, FilePath.buildPath(args, 3)));
                            return;
                        case "midi":
                            midi(exchange, new File(rootDir, FilePath.buildPath(args, 3)));
                            return;
                        case "midiinfo":
                            midiinfo(exchange, new File(rootDir, FilePath.buildPath(args, 3)));
                            return;
                        case "info":
                            info(exchange);
                            return;
                    }
                }
                send(exchange, 400, "Bad Request");
            } else if (exchange.getRequestMethod().equals("OPTIONS")) {
                exchange.getResponseHeaders().set("Allow", "OPTIONS, GET");
                exchange.sendResponseHeaders(200, 0);
                exchange.close();
            } else {
                send(exchange, 501, "Not Implemented");
            }
        } catch (IOException e) {
            e.printStackTrace();
        }
    }

    private void midiinfo(HttpExchange exchange, File file) throws IOException {
        JsonObject obj = new JsonObject();
        obj.addProperty("name", file.getName());
        obj.addProperty("size", file.length());
        obj.addProperty("lastModified", file.lastModified());

        byte[] b = obj.toString().getBytes(StandardCharsets.UTF_8);
        exchange.getResponseHeaders().set("Content-Type", "application/json;charset=UTF-8");
        exchange.sendResponseHeaders(200, b.length);
        exchange.getResponseBody().write(b);
        exchange.close();
    }

    // api/info
    private void info(HttpExchange exchange) throws IOException {
        JsonObject obj = new JsonObject();
        obj.addProperty("serverName", Config.prop.getProperty("server-name", "JMBox"));
        obj.addProperty("themeColor", Config.prop.getProperty("theme-color", "#00796b"));

        byte[] b = obj.toString().getBytes(StandardCharsets.UTF_8);
        exchange.getResponseHeaders().set("Content-Type", "application/json;charset=UTF-8");
        exchange.sendResponseHeaders(200, b.length);
        exchange.getResponseBody().write(b);
        exchange.close();
    }

    private void midi(HttpExchange exchange, File file) {
        try {
            FileInputStream fis = new FileInputStream(file);
            exchange.getResponseHeaders().set("Content-Type", "audio/midi");
            exchange.getResponseHeaders().set("Last-Modified", TimeFormatter.format(file.lastModified()));
            exchange.sendResponseHeaders(200, fis.available());
            OutputStream os = exchange.getResponseBody();

            IOStream.writeTo(fis, os);

        } catch (FileNotFoundException e) {
            logger.warning(e.toString());
            send(exchange, 404, "Not Found");
        } catch (IOException e) {
            e.printStackTrace();
        } finally {
            exchange.close();
        }
    }

    private void list(HttpExchange exchange, File file) throws IOException {
        File[] filelist = file.listFiles(pathname -> pathname.toString().toLowerCase().endsWith(".mid") || pathname.toString().toLowerCase().endsWith(".midi") || pathname.isDirectory());

        if (filelist == null) {
            send(exchange, 404, "Not Found");
            return;
        }

        JsonArray arr = new JsonArray();
        for (File file1 : filelist) {
            JsonObject fo = new JsonObject();
            fo.addProperty("name", file1.getName());
            fo.addProperty("size", file1.length());
            fo.addProperty("isDir", file1.isDirectory());
            arr.add(fo);
        }

        byte[] b = arr.toString().getBytes(StandardCharsets.UTF_8);
        exchange.getResponseHeaders().set("Content-Type", "application/json;charset=UTF-8");
        exchange.sendResponseHeaders(200, b.length);
        exchange.getResponseBody().write(b);
        exchange.close();
    }

    private void play(HttpExchange exchange, File file) {
        if (file.length() > Long.parseLong(Config.prop.getProperty("max-file-size", "1048576"))) {
            send(exchange, 503, "File size exceeded.");
            return;
        }
        Converter c = new Converter(file);
        try(
            AudioInputStream is = c.convert();
            ) {
            long totalLength = is.getFrameLength() * is.getFormat().getFrameSize() + 44;

            Headers response = exchange.getResponseHeaders();
            Headers request = exchange.getRequestHeaders();

//            // Seeking
            if (request.get("Range") != null) {
                String range = request.get("Range").get(0);
                Matcher m = REGEX.matcher(range);
                if (m.find()) {
                    long start = Long.parseLong(m.group(1));
                    long skiplen = Math.max(start - 44, 0);

                    if (skiplen > 0) {
                        is.skip(skiplen);

                        long length = is.getFrameLength() * is.getFormat().getFrameSize() + 44;
                        response.set("Content-Range", String.format("bytes %d-%d/%d", skiplen, totalLength - 1, totalLength));
                        exchange.sendResponseHeaders(206, totalLength - skiplen);
                        AudioSystem.write(is, AudioFileFormat.Type.WAVE, exchange.getResponseBody());
                        return;
                    }
                }
            }

            // Send directly
            long length = is.getFrameLength() * is.getFormat().getFrameSize() + 44;

            response.set("Content-Type", "audio/x-wav");
            response.set("Last-Modified", TimeFormatter.format(file.lastModified()));


            response.set("Content-Range", String.format("bytes %d-%d/%d", 0, length - 1, length));
            exchange.sendResponseHeaders(206, length);

            AudioSystem.write(is, AudioFileFormat.Type.WAVE, exchange.getResponseBody());
        } catch (UnsupportedAudioFileException e) {
            logger.warning(e.toString());
            e.printStackTrace();
            send(exchange, 500, "Internal Server Error");
        } catch (FileNotFoundException e) {
            logger.warning(e.toString());
            send(exchange, 404, "Not Found");
        } catch (IOException e) {
            logger.warning(e.toString());
        } finally {
            exchange.close();
        }
    }

    private void send(HttpExchange exchange, int statusCode, String html) {
        try {
            exchange.sendResponseHeaders(statusCode, html.getBytes().length);
            exchange.getResponseBody().write(html.getBytes());
            exchange.close();
        } catch (IOException e) {
            logger.warning(String.format("HTTP Write failed. %s", e.toString()));
        }
    }

}
