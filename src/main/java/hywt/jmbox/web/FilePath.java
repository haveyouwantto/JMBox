package hywt.jmbox.web;

import java.io.File;

public class FilePath {
    /** Http url to local file url
     * */
    public static String buildPath(String[] args, int off) {
        StringBuilder builder = new StringBuilder("");
        for (int i = off; i < args.length; i++) {
            String path = args[i];
            if (!path.equals("..") && !path.equals("")) {
                builder.append(args[i]);
                if (i != args.length - 1) {
                    builder.append("/");
                }
            }
        }
        return builder.toString();
    }
}
