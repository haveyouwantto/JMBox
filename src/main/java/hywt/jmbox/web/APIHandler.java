package hywt.jmbox.web;

import com.sun.net.httpserver.Headers;
import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;
import hywt.jmbox.IOStream;
import hywt.jmbox.audio.*;
import hywt.jmbox.logging.LoggerUtil;
import org.json.JSONArray;
import org.json.JSONObject;

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

    private String rootPrefix;

    APIHandler(File rootDir) throws IOException {
        super();
        this.rootDir = rootDir;
        executor = Executors.newFixedThreadPool(Runtime.getRuntime().availableProcessors());
        rootPrefix = rootDir.getCanonicalPath();
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
                File file = new File(rootDir, FilePath.buildPath(args, 3));

                if (!file.getCanonicalPath().startsWith(rootPrefix))
                    throw new SecurityException("Access denied: " + file);

                if (args.length > 2) {
                    switch (args[2]) {
                        case "play":
                            play(exchange, file);
                            return;
                        case "list":
                            list(exchange, file);
                            return;
                        case "midi":
                            midi(exchange, file);
                            return;
                        case "midiinfo":
                            midiinfo(exchange, file);
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
        } catch (SecurityException e){
            e.printStackTrace();
            send(exchange, 403, "Forbidden");
        }
    }

    private void midiinfo(HttpExchange exchange, File file) throws IOException {
        JSONObject obj = new JSONObject();
        obj.put("name", file.getName());
        obj.put("size", file.length());
        obj.put("lastModified", file.lastModified());

        byte[] b = obj.toString().getBytes(StandardCharsets.UTF_8);
        exchange.getResponseHeaders().set("Content-Type", "application/json;charset=UTF-8");
        exchange.sendResponseHeaders(200, b.length);
        exchange.getResponseBody().write(b);
        exchange.close();
    }

    // api/info
    private void info(HttpExchange exchange) throws IOException {
        JSONObject obj = new JSONObject();
        obj.put("serverName", Config.get("server-name"));
        obj.put("themeColor", Config.get("theme-color"));

        JSONObject capabilities = new JSONObject();
        capabilities.put("midi", Config.getBoolean("enable-midi"));
        capabilities.put("play", Config.getBoolean("enable-play"));

        obj.put("capabilities", capabilities);

        byte[] b = obj.toString().getBytes(StandardCharsets.UTF_8);
        exchange.getResponseHeaders().set("Content-Type", "application/json;charset=UTF-8");
        exchange.sendResponseHeaders(200, b.length);
        exchange.getResponseBody().write(b);
        exchange.close();
    }

    private void midi(HttpExchange exchange, File file) {
        if (!Config.getBoolean("enable-midi")) {
            send(exchange, 406, "Not Enabled");
            return;
        }
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

        JSONArray arr = new JSONArray();
        for (File file1 : filelist) {
            JSONObject fo = new JSONObject();
            fo.put("name", file1.getName());
            fo.put("size", file1.length());
            fo.put("date", file1.lastModified());
            fo.put("isDir", file1.isDirectory());
            arr.put(fo);
        }

        byte[] b = arr.toString().getBytes(StandardCharsets.UTF_8);
        exchange.getResponseHeaders().set("Content-Type", "application/json;charset=UTF-8");
        exchange.sendResponseHeaders(200, b.length);
        exchange.getResponseBody().write(b);
        exchange.close();
    }

    private void play(HttpExchange exchange, File file) {
        if (!Config.getBoolean("enable-play")) {
            send(exchange, 406, "Not Enabled");
            return;
        }

        Headers response = exchange.getResponseHeaders();
        Headers request = exchange.getRequestHeaders();

        // Detect if browser sent Range request
        long start = 0;
        boolean seeking = false;

        // Seeking
        if (request.get("Range") != null) {
            String range = request.get("Range").get(0);
            Matcher m = REGEX.matcher(range);
            if (m.find()) {
                start = Long.parseLong(m.group(1));
                seeking = true;
            }
        }

        boolean finalSeeking = seeking;
        long finalStart = start;
        Runnable r = () -> {
            IMidiRenderer renderer = null;
            AudioInputStream is = null;
            try {
                // Find for existing audio file
                FileResult fr = null;
                if (Config.getBoolean("scan-for-audio")) {
                    fr = FileFinder.findAudioFile(file);
                }
                if (fr != null) {
                    File audio = fr.getFile();
                    String mimeType = fr.getMimeType();
                    long totalLength = fr.getFile().length();

                    response.set("Content-Type", mimeType);
                    response.set("Last-Modified", TimeFormatter.format(audio.lastModified()));

                    FileInputStream fis = new FileInputStream(audio);

                    // Send existing audio
                    if (finalSeeking) {
                        response.set("Content-Range", String.format("bytes %d-%d/%d", finalStart, totalLength - 1, totalLength));
                        exchange.sendResponseHeaders(206, totalLength - finalStart);

                        fis.skip(finalStart);
                        IOStream.writeTo(fis, exchange.getResponseBody());
                    } else {
                        response.set("Content-Range", String.format("bytes 0-%d/%d", totalLength - 1, totalLength));
                        exchange.sendResponseHeaders(206, totalLength);
                        IOStream.writeTo(fis, exchange.getResponseBody());
                    }
                    fis.close();
                } else {

                    // Convert midi file to wave
                    if (file.length() > Config.getLong("max-file-size")) {
                        send(exchange, 503, "File size exceeded.");
                        return;
                    }

                    renderer = new FluidSynthWrapper(file);

                    // TODO: Calculate start microseconds

                    // Assume 44.1kHz, 16bit, stereo
                    // 44 bytes header
                    // long startMicroseconds = (long) ((float) (finalStart-44) / 2 / 44100 * 1000000);

                    is = renderer.getAudioInputStream(0);
                    long totalLength = is.getFrameLength() * is.getFormat().getFrameSize() + 44;

                    // Send directly
                    long length = is.getFrameLength() * is.getFormat().getFrameSize() + 44;

                    response.set("Content-Type", "audio/x-wav");
                    response.set("Last-Modified", TimeFormatter.format(file.lastModified()));

                    // Detect Streaming Mode (disables seeking)
                    if (file.length() > Config.getLong("streaming-file-size")) {
                        exchange.sendResponseHeaders(200, length);
                        AudioSystem.write(is, AudioFileFormat.Type.WAVE, exchange.getResponseBody());
                    } else {

                        // Seeking
                        if (finalSeeking) {
                            long skiplen = Math.max(finalStart - 44, 0);

                            if (skiplen > 0) {
                                is.skip(skiplen);

                                response.set("Content-Range", String.format("bytes %d-%d/%d", skiplen, totalLength - 1, totalLength));
                                exchange.sendResponseHeaders(206, totalLength - skiplen);
                                AudioSystem.write(is, AudioFileFormat.Type.WAVE, exchange.getResponseBody());
                                return;
                            }
                        }

                        // Non-streaming mode
                        response.set("Content-Range", String.format("bytes 0-%d/%d", length - 1, length));
                        exchange.sendResponseHeaders(206, length);
                        AudioSystem.write(is, AudioFileFormat.Type.WAVE, exchange.getResponseBody());
                    }
                }

            } catch (UnsupportedAudioFileException e) {
                logger.warning(e.toString());
                e.printStackTrace();
                send(exchange, 500, e.toString());
            } catch (FileNotFoundException e) {
                logger.warning(e.toString());
                send(exchange, 404, "Not Found");
            } catch (IOException e) {
                logger.warning(e.toString());
            } catch (Exception e) {
                throw new RuntimeException(e);
            } finally {
                exchange.close();
                if (is != null) {
                    try {
                        is.close();
                    } catch (IOException e) {
                        throw new RuntimeException(e);
                    }
                }
            }
        };

        new Thread(r).start();
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
