package hywt.jmbox.web;

import java.io.File;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;

public class ETagGenerator {
    public static String generateETag(File file, String type) throws NoSuchAlgorithmException {
        String template = file.getAbsolutePath() + "|" + file.lastModified() + "|" + type;
        MessageDigest messageDigest = MessageDigest.getInstance("MD5");
        byte[] hash = messageDigest.digest(template.getBytes(StandardCharsets.UTF_8));
        StringBuilder hexString = new StringBuilder();
        for (byte b : hash) {
            hexString.append(String.format("%02x", b));
        }
        return hexString.toString();
    }
}
