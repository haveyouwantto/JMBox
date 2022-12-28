package hywt.jmbox.audio;

import java.io.File;

public class FileFinder {
    // 定义需要查找的音频格式
    static String[] audioFormats = {"flac", "wav", "ogg", "mp3"};
    static String[] mimeTypes = {"audio/flac", "audio/x-wav", "audio/ogg", "audio/mpeg"};

    public static FileResult findAudioFile(File file) {
        // 获取文件所在的文件夹
        File folder = file.getParentFile();

        // 删除文件的后缀名
        String filenameWithoutExt = file.getName().replaceFirst("[.][^.]+$", "");

        // 遍历所有音频格式
        for (int i = 0; i < audioFormats.length; i++) {
            String format = audioFormats[i];
            // 构造文件名
            String filename = String.format("%s.%s", filenameWithoutExt, format);

            // 检查文件夹中是否有同名的文件
            File audioFile = new File(folder, filename);
            if (audioFile.exists()) {
                // 如果找到了，返回文件
                return new FileResult(audioFile, mimeTypes[i]);
            }
        }

        // 如果没有找到，返回null
        return null;
    }
}
