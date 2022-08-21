package jmbox.web;

import com.google.gson.JsonArray;
import com.google.gson.JsonObject;
import com.sun.net.httpserver.Headers;
import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;
import jmbox.audio.Converter;

import javax.sound.sampled.AudioFileFormat;
import javax.sound.sampled.AudioInputStream;
import javax.sound.sampled.AudioSystem;
import javax.sound.sampled.UnsupportedAudioFileException;
import java.io.File;
import java.io.FileNotFoundException;
import java.io.IOException;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.util.Arrays;

public class APIHandler implements HttpHandler {
    private HttpExchange exchange;

    @Override
    public void handle(HttpExchange exchange) throws IOException {
        this.exchange = exchange;
        new Thread(() -> {
            try {
                if (exchange.getRequestMethod().equals("GET")) {
                    String[] args = URLDecoder.decode(exchange.getRequestURI().toString(), "UTF-8").split("/");
                    switch (args[2]) {
                        case "play":
                            play(new File(buildPath(args)));
                            return;
                        case "list":
                            list(new File(buildPath(args)));
                            return;
                    }
                    send(200, "OK");
                }
            } catch (IOException e) {
                e.printStackTrace();
            }
        }).start();

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
        exchange.getResponseBody().close();
    }

    public void play(File file) throws IOException {
        Converter c = new Converter(file);
        System.out.println(file);
        try {
            AudioInputStream is = c.convert();
            Headers response = exchange.getResponseHeaders();
            response.set("Content-Type", "audio/wav");
            exchange.sendResponseHeaders(200, is.getFrameLength() * is.getFormat().getFrameSize() + 44);

            AudioSystem.write(is, AudioFileFormat.Type.WAVE, exchange.getResponseBody());
//            OutputStream os = exchange.getResponseBody();
//            int len;
//            byte[] buffer = new byte[4096];
//            while ((len = is.read(buffer)) >= 0) {
//                os.write(buffer, 0, len);
//            }
//            os.close();
        } catch (UnsupportedAudioFileException e) {
            e.printStackTrace();
            send(500, "Internal Server Error");
        } catch (FileNotFoundException e) {
            send(404, "Not Found");
        } catch (IOException e) {
        } finally {
            exchange.close();
        }
    }

    private void send(int statusCode, String html) throws IOException {
        exchange.sendResponseHeaders(statusCode, html.getBytes().length);
        exchange.getResponseBody().write(html.getBytes());
        exchange.getResponseBody().close();
    }

    private String buildPath(String[] args) {
        StringBuilder builder = new StringBuilder("./");
        for (int i = 3; i < args.length; i++) {
            String path = args[i];
            if (!path.equals("..") && !path.equals("")) {
                builder.append(args[i]).append("/");
            }
        }
        return builder.toString();
    }
}
