package hywt.jmbox.web;

import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.IOException;
import java.util.HashMap;
import java.util.Map;
import java.util.Properties;

public class Config {
    private static Properties prop;
    private static HashMap<String, String> defaults;

    public static void init() throws IOException {
        defaults = new HashMap<>();
        defaults.put("server-name", "JMBox");
        defaults.put("port", "60752");
        defaults.put("external-ui", "");
        defaults.put("streaming-file-size", "786432");
        defaults.put("max-file-size", "1048576");
        defaults.put("theme-color", "#00796b");
        defaults.put("enable-midi", "true");
        defaults.put("enable-play", "true");
        defaults.put("scan-for-audio", "false");
        defaults.put("gervill-max-polyphony", "256");
        defaults.put("gervill-interpolation", "sinc");
        defaults.put("gervill-large-mode", "false");
        load();
    }

    public static void load() throws IOException {
        File is = new File("server.properties");
        if (is.exists()) {
            prop = new Properties();
            prop.load(new FileInputStream(is));
        } else {
            create();
        }
    }

    private static void create() throws IOException {
        prop = new Properties();
        for (Map.Entry<String, String> def : defaults.entrySet()) {
            prop.setProperty(def.getKey(), def.getValue());
        }
        FileOutputStream fos = new FileOutputStream("server.properties");
        prop.store(fos, "JMBox server properties");
    }

    public static String get(String key) {
        String value = prop.getProperty(key);
        return value != null ? value : defaults.get(key);
    }

    public static byte getByte(String key) {
        return Byte.parseByte(get(key));
    }

    public static short getShort(String key) {
        return Short.parseShort(get(key));
    }

    public static int getInteger(String key) {
        return Integer.parseInt(get(key));
    }

    public static long getLong(String key) {
        return Long.parseLong(get(key));
    }

    public static float getFloat(String key) {
        return Float.parseFloat(get(key));
    }

    public static double getDouble(String key) {
        return Double.parseDouble(get(key));
    }

    public static boolean getBoolean(String key) {
        return Boolean.parseBoolean(get(key));
    }

    public static char getChar(String key) {
        return get(key).charAt(0);
    }
}
