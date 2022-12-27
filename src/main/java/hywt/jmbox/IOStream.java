package hywt.jmbox;

import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
public class IOStream {
    /** Writing an InputStream to an OutputStream
     * */
    public static void writeTo(InputStream is, OutputStream os) throws IOException {
        byte[] b = new byte[4096];
        int len;
        while ((len = is.read(b)) >= 0) {
            os.write(b, 0, len);
        }
        os.close();
    }
}
