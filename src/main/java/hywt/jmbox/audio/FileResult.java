package hywt.jmbox.audio;

import java.io.File;

public class FileResult {
    private File file;
    private String mimeType;

    public FileResult(File file, String mimeType) {
        this.file = file;
        this.mimeType = mimeType;
    }

    public File getFile() {
        return file;
    }

    public String getMimeType() {
        return mimeType;
    }
}