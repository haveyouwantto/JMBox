package hywt.jmbox.io;

import java.io.FilterInputStream;
import java.io.IOException;
import java.io.InputStream;

public class ZeroPaddingInputStream extends FilterInputStream {

    private boolean paddingMode = false; // 标记是否已进入填充模式

    public ZeroPaddingInputStream(InputStream in) {
        super(in);
    }

    @Override
    public int read() throws IOException {
        if (paddingMode) {
            return 0; // 如果处于填充模式，则返回 0
        }

        int result = super.read(); // 从底层 InputStream 读取

        if (result == -1) {
            paddingMode = true; // 如果到达流的末尾，则进入填充模式
            return 0; // 返回第一个填充的 0
        }

        return result; // 返回从底层 InputStream 读取的值
    }

    @Override
    public int read(byte[] b, int off, int len) throws IOException {
        if (b == null) {
            throw new NullPointerException();
        } else if (off < 0 || len < 0 || len > b.length - off) {
            throw new IndexOutOfBoundsException();
        } else if (len == 0) {
            return 0;
        }

        int bytesRead = 0;
        if (!paddingMode) {
            bytesRead = super.read(b, off, len); // 从底层 InputStream 读取

            if (bytesRead == -1) {
                paddingMode = true; // 进入填充模式
                bytesRead = 0; // 将 bytesRead 重置为 0，以便进行填充
            }
        }

        if (paddingMode) {
            for (int i = 0; i < len; i++) {
                b[off + i] = 0; // 用 0 填充缓冲区
            }
            return len; // 返回填充的字节数
        } else {
            return bytesRead; // 返回从底层 InputStream 读取的字节数
        }
    }

    @Override
    public long skip(long n) throws IOException {
        if (n <= 0) {
            return 0;
        }

        if (paddingMode) {
            return n; // 如果已经进入填充模式，可以跳过任意数量的 0
        }

        long skipped = super.skip(n);
        if (skipped < n) {
            paddingMode = true; // 进入填充模式
        }
        return skipped;
    }

    @Override
    public int available() throws IOException {
        if (paddingMode) {
            return Integer.MAX_VALUE; // 无限的 0 可用
        } else {
            return super.available(); // 返回底层 InputStream 的可用字节数
        }
    }

    @Override
    public boolean markSupported() {
        return false; // 不支持 mark/reset
    }

    @Override
    public void mark(int readlimit) {
        // 不支持 mark/reset
    }

    @Override
    public void reset() throws IOException {
        throw new IOException("mark/reset not supported");
    }
}