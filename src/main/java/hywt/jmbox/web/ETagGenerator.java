package hywt.jmbox.web;

import java.io.*;
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

    public static String md5(InputStream is){
        try {
            MessageDigest md = MessageDigest.getInstance("MD5");
            byte[] buffer = new byte[8192]; // Use a larger buffer for better performance
            int length;
            while ((length = is.read(buffer)) != -1) {
                md.update(buffer, 0, length);
            }
            byte[] messageDigest = md.digest();
            StringBuilder hexString = new StringBuilder();
            for (byte b : messageDigest) {
                hexString.append(String.format("%02x", b));
            }
            return hexString.toString();
        } catch (NoSuchAlgorithmException e) {
            System.err.println("MD5 algorithm not available: " + e.getMessage()); // Handle the exception appropriately
            return null;
        } catch (IOException e) {
            System.err.println("Error reading file: " + e.getMessage()); // Handle the exception appropriately
            return null;
        } finally {
            try {
                if (is != null) {
                    is.close();
                }
            } catch (IOException e) {
                System.err.println("Error closing file: " + e.getMessage()); // Handle the exception appropriately
            }
        }
    }
}
