package jmbox.web;

import com.google.gson.JsonArray;
import com.google.gson.JsonObject;
import com.sun.net.httpserver.Headers;
import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;
import jmbox.IOStream;
import jmbox.audio.Converter;

import javax.sound.sampled.AudioFileFormat;
import javax.sound.sampled.AudioInputStream;
import javax.sound.sampled.AudioSystem;
import javax.sound.sampled.UnsupportedAudioFileException;
import java.io.*;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.text.SimpleDateFormat;
import java.util.Locale;
import java.util.TimeZone;
import java.util.logging.Logger;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

public class APIHandler implements HttpHandler {
    private HttpExchange exchange;
    private File rootDir;
    private static final Pattern REGEX = Pattern.compile("(\\d+)?-(\\d+)?");
    private static final Logger logger = Logger.getLogger("API");
    private static final SimpleDateFormat format = new SimpleDateFormat("EEE, d MMM yyyy HH:mm:ss z", Locale.ENGLISH);

    APIHandler(File rootDir) {
        this.rootDir = rootDir;
    }

    @Override
    public void handle(HttpExchange exchange) {
        logger.info(String.format("%s %s %s", exchange.getRemoteAddress(), exchange.getRequestMethod(), exchange.getRequestURI()));
        this.exchange = exchange;
        new Thread(() -> {
            try {

                Headers headers = exchange.getResponseHeaders();
                headers.set("Access-Control-Allow-Origin", "*");
                headers.set("Access-Control-Allow-Headers", "*");
                headers.set("Server", "JMBox API");

                format.setTimeZone(TimeZone.getTimeZone("GMT"));

                if (exchange.getRequestMethod().equals("GET")) {
                    String[] args = URLDecoder.decode(exchange.getRequestURI().toString(), "UTF-8").split("/");
                    if (args.length > 2) {
                        switch (args[2]) {
                            case "play":
                                play(FilePath.buildPath(rootDir, args, 3));
                                return;
                            case "list":
                                list(FilePath.buildPath(rootDir, args, 3));
                                return;
                            case "midi":
                                midi(FilePath.buildPath(rootDir, args, 3));
                                return;
                            case "info":
                                info();
                                return;
                        }
                    }
                } else if (exchange.getRequestMethod().equals("OPTIONS")) {
                    exchange.getResponseHeaders().set("Allow", "OPTIONS, GET");
                    exchange.sendResponseHeaders(200, 0);
                    exchange.close();
                    return;
                }
                send(501, "Not Implemented");
            } catch (IOException e) {
                e.printStackTrace();
            }
        }).start();

    }

    private void info() throws IOException {
        JsonObject obj = new JsonObject();
        obj.addProperty("serverName", Config.prop.getProperty("server-name"));
        byte[] b = obj.toString().getBytes(StandardCharsets.UTF_8);
        exchange.getResponseHeaders().set("Content-Type", "application/json;charset=UTF-8");
        exchange.sendResponseHeaders(200, b.length);
        exchange.getResponseBody().write(b);
        exchange.close();
    }

    private void midi(File file) {
        try {
            FileInputStream fis = new FileInputStream(file);
            exchange.getResponseHeaders().set("Content-Type", "audio/midi");
            exchange.getResponseHeaders().set("Last-Modified", format.format(file.lastModified()));
            exchange.sendResponseHeaders(200, fis.available());
            OutputStream os = exchange.getResponseBody();

            IOStream.writeTo(fis, os);

        } catch (FileNotFoundException e) {
            logger.warning(e.toString());
            send(404, "Not Found");
        } catch (IOException e) {
            e.printStackTrace();
        } finally {
            exchange.close();
        }
    }

    private void list(File file) throws IOException {
        File[] list = file.listFiles(pathname -> pathname.toString().toLowerCase().endsWith(".mid") || pathname.toString().toLowerCase().endsWith(".midi") || pathname.isDirectory());
        if (list == null) {
            send(404, "Not Found");
            return;
        }
        JsonArray arr = new JsonArray();
        for (File file1 : list) {
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

    public void play(File file) {
        Converter c = new Converter(file);
        try (
                AudioInputStream is = c.convert();
        ) {
            long length = is.getFrameLength() * is.getFormat().getFrameSize() + 44;
            Headers response = exchange.getResponseHeaders();
            response.set("Content-Type", "audio/x-wav");
            response.set("Last-Modified", format.format(file.lastModified()));

            Headers request = exchange.getRequestHeaders();
            if (request.get("Range") != null) {
                String range = request.get("Range").get(0);
                Matcher m = REGEX.matcher(range);
                if (m.find()) {
                    long skiplen = Math.max(Long.parseLong(m.group(1)) - 44, 0);
                    is.skip(skiplen);

                    response.set("Content-Range", String.format("bytes %d-%d/%d", skiplen, length - 1, length));
                    exchange.sendResponseHeaders(206, length - skiplen);
                    AudioSystem.write(is, AudioFileFormat.Type.WAVE, exchange.getResponseBody());
                    return;
                }
            }

            response.set("Content-Range", String.format("bytes %d-%d/%d", 0, length - 1, length));
            exchange.sendResponseHeaders(206, length);

            AudioSystem.write(is, AudioFileFormat.Type.WAVE, exchange.getResponseBody());
        } catch (UnsupportedAudioFileException e) {
            logger.warning(e.toString());
            e.printStackTrace();
            send(500, "Internal Server Error");
        } catch (FileNotFoundException e) {
            logger.warning(e.toString());
            send(404, "Not Found");
        } catch (IOException e) {
            logger.warning(e.toString());
        } finally {
            exchange.close();
        }
    }

    private void send(int statusCode, String html) {
        try {
            exchange.sendResponseHeaders(statusCode, html.getBytes().length);
            exchange.getResponseBody().write(html.getBytes());
            exchange.close();
        } catch (IOException e) {
            logger.warning(String.format("HTTP Write failed. %s", e.toString()));
        }
    }

}
