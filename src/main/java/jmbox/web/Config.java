package jmbox.web;

import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.IOException;
import java.util.Properties;

public class Config {
    public static Properties prop;

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
        prop.setProperty("server-name", "JMBox");
        prop.setProperty("port", "60752");

        FileOutputStream fos = new FileOutputStream("server.properties");
        prop.store(fos, "JMBox server properties");
    }
}
