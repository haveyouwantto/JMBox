package hywt.jmbox.io;

import javax.sound.sampled.AudioFormat;
import javax.sound.sampled.AudioInputStream;
import java.io.*;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;
import java.util.logging.Level;
import java.util.logging.Logger;

public class OpusInputStream extends InputStream {

    private static final Logger LOGGER = Logger.getLogger(OpusInputStream.class.getName());
    private static final String DEFAULT_FFMPEG_PATH = "ffmpeg"; // Or provide full path, e.g., "/usr/local/bin/ffmpeg"

    private final AudioInputStream sourceAudioStream;
    private final Process ffmpegProcess;
    private final InputStream opusStreamFromFfmpeg; // ffmpeg's stdout
    private final OutputStream pcmToFfmpeg;       // ffmpeg's stdin
    private final Thread pcmWriterThread;
    private final Thread errorGobblerThread;
    private final ExecutorService threadExecutor; // For managing threads

    private volatile boolean closed = false;

    /**
     * Creates an OpusInputStream that converts an AudioInputStream to Opus using ffmpeg.
     *
     * @param sourceAudioStream The source audio stream (e.g., PCM).
     * @param ffmpegPath Path to the ffmpeg executable. If null, "ffmpeg" is assumed.
     * @param opusBitrate Target Opus bitrate in bits per second (e.g., 64000 for 64kbps).
     * @throws IOException If ffmpeg cannot be started or an I/O error occurs.
     */
    public OpusInputStream(AudioInputStream sourceAudioStream, String ffmpegPath, int opusBitrate) throws IOException {
        this.sourceAudioStream = sourceAudioStream;
        String actualFfmpegPath = (ffmpegPath == null || ffmpegPath.trim().isEmpty()) ? DEFAULT_FFMPEG_PATH : ffmpegPath;

        AudioFormat sourceFormat = sourceAudioStream.getFormat();

        List<String> command = new ArrayList<>();
        command.add(actualFfmpegPath);
        command.add("-hide_banner");
        command.add("-loglevel");
        command.add("error"); // Or "warning", "info", "debug" for more verbosity

        // Input options
        command.add("-f");
        command.add(getFfmpegFormatString(sourceFormat)); // e.g., s16le, s32be
        command.add("-ar");
        command.add(String.valueOf((int)sourceFormat.getSampleRate()));
        command.add("-ac");
        command.add(String.valueOf(sourceFormat.getChannels()));
        command.add("-i");
        command.add("pipe:0"); // Read from stdin

        // Output options
        command.add("-c:a");
        command.add("libopus");
        command.add("-b:a");
        command.add(String.valueOf(opusBitrate));
        command.add("-vbr"); // Variable Bitrate (usually good for Opus)
        command.add("on"); // or "off" or "constrained"
        command.add("-application");
        command.add("audio"); // "audio", "voip", or "lowdelay"

        // Output format and destination
        command.add("-f");
        command.add("opus"); // Raw Opus stream in Ogg container (common for streaming)
        // For raw Opus packets without container, you might try "-f data" or just rely on pipe,
        // but "-f opus" is generally safer for compatibility.
        command.add("pipe:1"); // Output to stdout

        LOGGER.log(Level.INFO, "Starting ffmpeg with command: " + String.join(" ", command));

        ProcessBuilder pb = new ProcessBuilder(command);
        // pb.redirectError(ProcessBuilder.Redirect.INHERIT); // Or capture it as below

        try {
            this.ffmpegProcess = pb.start();
        } catch (IOException e) {
            LOGGER.log(Level.SEVERE, "Failed to start ffmpeg. Is it in your PATH? Command: " + String.join(" ", command), e);
            throw new IOException("Failed to start ffmpeg: " + e.getMessage(), e);
        }

        this.opusStreamFromFfmpeg = ffmpegProcess.getInputStream();
        this.pcmToFfmpeg = ffmpegProcess.getOutputStream();
        InputStream ffmpegErrorStream = ffmpegProcess.getErrorStream();

        this.threadExecutor = Executors.newFixedThreadPool(2);

        // Thread to pump PCM data from AudioInputStream to ffmpeg's stdin
        this.pcmWriterThread = new Thread(() -> {
            byte[] buffer = new byte[4096];
            int bytesRead;
            try {
                while (!closed && (bytesRead = sourceAudioStream.read(buffer)) != -1) {
                    pcmToFfmpeg.write(buffer, 0, bytesRead);
                }
                pcmToFfmpeg.flush();
            } catch (IOException e) {
                if (!closed) { // Avoid logging error if closed intentionally
                    LOGGER.log(Level.SEVERE, "Error writing PCM data to ffmpeg", e);
                }
            } finally {
                try {
                    pcmToFfmpeg.close(); // Signal EOF to ffmpeg
                } catch (IOException e) {
                    LOGGER.log(Level.WARNING, "Error closing ffmpeg stdin", e);
                }
                try {
                    sourceAudioStream.close(); // Close the source stream
                } catch (IOException e) {
                    LOGGER.log(Level.WARNING, "Error closing source audio stream", e);
                }
                LOGGER.log(Level.INFO, "PCM writer thread finished.");
            }
        }, "Opus-PCM-Writer");
        this.pcmWriterThread.setDaemon(true); // Allow JVM to exit if this is the only thread left
        this.pcmWriterThread.start();


        // Thread to gobble ffmpeg's stderr to prevent blocking and log errors
        this.errorGobblerThread = new Thread(() -> {
            try (InputStreamReader isr = new InputStreamReader(ffmpegErrorStream);
                 BufferedReader br = new BufferedReader(isr)) {
                String line;
                while ((line = br.readLine()) != null) {
                    LOGGER.log(Level.WARNING, "ffmpeg stderr: " + line);
                }
            } catch (IOException e) {
                if (!closed) {
                    LOGGER.log(Level.WARNING, "Error reading ffmpeg stderr", e);
                }
            } finally {
                LOGGER.log(Level.INFO, "ffmpeg error gobbler thread finished.");
            }
        }, "Opus-FFmpeg-ErrorGobbler");
        this.errorGobblerThread.setDaemon(true);
        this.errorGobblerThread.start();
    }

    /**
     * Simplified constructor using default ffmpeg path and 64kbps bitrate.
     */
    public OpusInputStream(AudioInputStream sourceAudioStream) throws IOException {
        this(sourceAudioStream, DEFAULT_FFMPEG_PATH, 64000);
    }

    /**
     * Simplified constructor using default ffmpeg path.
     */
    public OpusInputStream(AudioInputStream sourceAudioStream, int opusBitrate) throws IOException {
        this(sourceAudioStream, DEFAULT_FFMPEG_PATH, opusBitrate);
    }


    private String getFfmpegFormatString(AudioFormat format) {
        String encoding;
        switch (format.getEncoding().toString()) {
            case "PCM_SIGNED":
                encoding = "s";
                break;
            case "PCM_UNSIGNED":
                encoding = "u";
                break;
            case "PCM_FLOAT":
                encoding = "f";
                break;
            default:
                throw new IllegalArgumentException("Unsupported PCM encoding: " + format.getEncoding());
        }

        int sampleSize = format.getSampleSizeInBits();
        if (sampleSize != 8 && sampleSize != 16 && sampleSize != 24 && sampleSize != 32) {
            throw new IllegalArgumentException("Unsupported sample size: " + sampleSize);
        }

        String endianness = format.isBigEndian() ? "be" : "le";

        // For 8-bit, endianness is usually not specified or matters less.
        // ffmpeg often expects "u8" or "s8" directly.
        if (sampleSize == 8) {
            return encoding + "8";
        }

        return encoding + sampleSize + endianness;
    }

    @Override
    public int read() throws IOException {
        if (closed) {
            throw new IOException("Stream closed");
        }
        return opusStreamFromFfmpeg.read();
    }

    @Override
    public int read(byte[] b) throws IOException {
        if (closed) {
            throw new IOException("Stream closed");
        }
        return opusStreamFromFfmpeg.read(b);
    }

    @Override
    public int read(byte[] b, int off, int len) throws IOException {
        if (closed) {
            throw new IOException("Stream closed");
        }
        return opusStreamFromFfmpeg.read(b, off, len);
    }

    @Override
    public long skip(long n) throws IOException {
        if (closed) {
            throw new IOException("Stream closed");
        }
        return opusStreamFromFfmpeg.skip(n);
    }

    @Override
    public int available() throws IOException {
        if (closed) {
            return 0; // Or throw IOException as per InputStream contract for closed streams
        }
        return opusStreamFromFfmpeg.available();
    }

    @Override
    public synchronized void close() throws IOException {
        if (closed) {
            return;
        }
        closed = true;
        LOGGER.log(Level.INFO, "Closing OpusInputStream...");

        // 1. Close the source AudioInputStream (this might signal PCM writer thread to stop)
        // The PCM writer thread also closes it, but doing it here is a safeguard.
        try {
            sourceAudioStream.close();
        } catch (IOException e) {
            LOGGER.log(Level.WARNING, "Error closing source AudioInputStream during OpusInputStream close", e);
        }

        // 2. Close the stream we write PCM to (ffmpeg's stdin)
        // This should ideally be done by the pcmWriterThread when it finishes.
        // But if the thread is stuck or an error occurred, we ensure it's closed.
        try {
            if (pcmToFfmpeg != null) pcmToFfmpeg.close();
        } catch (IOException e) {
            LOGGER.log(Level.WARNING, "Error closing pcmToFfmpeg stream", e);
        }

        // 3. Wait for PCM writer thread to finish
        if (pcmWriterThread != null && pcmWriterThread.isAlive()) {
            try {
                LOGGER.log(Level.FINE, "Waiting for PCM writer thread to join...");
                pcmWriterThread.join(5000); // Wait up to 5 seconds
                if (pcmWriterThread.isAlive()) {
                    LOGGER.log(Level.WARNING, "PCM writer thread did not terminate, interrupting.");
                    pcmWriterThread.interrupt(); // Attempt to interrupt if stuck
                }
            } catch (InterruptedException e) {
                LOGGER.log(Level.WARNING, "Interrupted while waiting for PCM writer thread", e);
                Thread.currentThread().interrupt();
            }
        }

        // 4. Close the Opus stream (ffmpeg's stdout)
        try {
            opusStreamFromFfmpeg.close();
        } catch (IOException e) {
            LOGGER.log(Level.WARNING, "Error closing opusStreamFromFfmpeg", e);
            // Continue cleanup
        }

        // 5. Destroy the ffmpeg process
        if (ffmpegProcess != null && ffmpegProcess.isAlive()) {
            LOGGER.log(Level.INFO, "Destroying ffmpeg process...");
            ffmpegProcess.destroy(); // Request graceful termination
            try {
                if (!ffmpegProcess.waitFor(5, TimeUnit.SECONDS)) {
                    LOGGER.log(Level.WARNING, "ffmpeg process did not terminate gracefully, forcing.");
                    ffmpegProcess.destroyForcibly(); // Forceful termination
                }
            } catch (InterruptedException e) {
                LOGGER.log(Level.WARNING, "Interrupted while waiting for ffmpeg process to terminate", e);
                ffmpegProcess.destroyForcibly();
                Thread.currentThread().interrupt();
            }
        }
        LOGGER.log(Level.INFO, "ffmpeg process exited with: " + (ffmpegProcess != null ? ffmpegProcess.exitValue() : "N/A"));


        // 6. Wait for error gobbler thread to finish
        if (errorGobblerThread != null && errorGobblerThread.isAlive()) {
            try {
                LOGGER.log(Level.FINE, "Waiting for error gobbler thread to join...");
                errorGobblerThread.join(1000); // Wait up to 1 second
                if (errorGobblerThread.isAlive()) {
                    LOGGER.log(Level.WARNING, "Error gobbler thread did not terminate, interrupting.");
                    errorGobblerThread.interrupt();
                }
            } catch (InterruptedException e) {
                LOGGER.log(Level.WARNING, "Interrupted while waiting for error gobbler thread", e);
                Thread.currentThread().interrupt();
            }
        }

        // 7. Shutdown the executor service (not strictly necessary if threads are daemon, but good practice)
        if (threadExecutor != null) {
            threadExecutor.shutdown();
            try {
                if (!threadExecutor.awaitTermination(1, TimeUnit.SECONDS)) {
                    threadExecutor.shutdownNow();
                }
            } catch (InterruptedException e) {
                threadExecutor.shutdownNow();
                Thread.currentThread().interrupt();
            }
        }

        LOGGER.log(Level.INFO, "OpusInputStream closed.");
    }

    // Main method for basic testing
    public static void main(String[] args) {
        // Example: Create a dummy AudioInputStream (e.g., 1 second of 48kHz, 16-bit mono sine wave)
        // In a real scenario, you'd get this from a file, microphone, etc.
        int sampleRate = 48000;
        int sampleSizeInBits = 16;
        int channels = 1;
        boolean signed = true;
        boolean bigEndian = false; // Little-endian is common for PCM
        AudioFormat format = new AudioFormat(AudioFormat.Encoding.PCM_SIGNED, sampleRate, sampleSizeInBits, channels,
                (sampleSizeInBits / 8) * channels, sampleRate, bigEndian);

        // Create a short silent audio stream for testing
        int durationSeconds = 2;
        int numFrames = sampleRate * durationSeconds;
        byte[] audioData = new byte[numFrames * format.getFrameSize()];
        // Fill with silence (zeros), or a sine wave if you want actual audio
        // For sine wave:
        // double freq = 440.0; // A4 note
        // for (int i = 0; i < numFrames; i++) {
        //     double angle = 2.0 * Math.PI * i * freq / sampleRate;
        //     short sample = (short) (Math.sin(angle) * Short.MAX_VALUE * 0.5); // 0.5 amplitude
        //     audioData[i*2] = (byte) (sample & 0xFF);
        //     audioData[i*2 + 1] = (byte) ((sample >> 8) & 0xFF);
        // }

        ByteArrayInputStream bais = new ByteArrayInputStream(audioData);
        AudioInputStream ais = new AudioInputStream(bais, format, numFrames);

        LOGGER.info("Starting Opus encoding test...");
        OpusInputStream opusInputStream = null;
        try {
            // Assuming ffmpeg is in PATH and using 96kbps Opus bitrate
            opusInputStream = new OpusInputStream(ais, null, 96000);

            LOGGER.info("OpusInputStream created. Reading Opus data...");

            // Read Opus data (e.g., write to a file or process further)
            java.io.FileOutputStream fos = new java.io.FileOutputStream("output.opus"); // Ogg Opus file
            byte[] buffer = new byte[1024];
            int bytesRead;
            long totalBytes = 0;
            while ((bytesRead = opusInputStream.read(buffer)) != -1) {
                fos.write(buffer, 0, bytesRead);
                totalBytes += bytesRead;
                // System.out.print("."); // Progress indicator
            }
            fos.close();
            LOGGER.info("\nFinished reading. Total Opus bytes: " + totalBytes);
            if (totalBytes == 0) {
                LOGGER.warning("No Opus data was produced. Check ffmpeg logs.");
            } else {
                LOGGER.info("Opus data written to output.opus");
            }

        } catch (IOException e) {
            LOGGER.log(Level.SEVERE, "Error during OpusInputStream test", e);
        } finally {
            if (opusInputStream != null) {
                try {
                    opusInputStream.close();
                } catch (IOException e) {
                    LOGGER.log(Level.SEVERE, "Error closing OpusInputStream in finally block", e);
                }
            }
            LOGGER.info("Opus encoding test finished.");
        }
    }
}