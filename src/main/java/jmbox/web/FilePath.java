package jmbox.web;

import java.io.File;

public class FilePath {
    public static File buildPath(File rootDir, String[] args, int off) {
        StringBuilder builder = new StringBuilder("./");
        for (int i = off; i < args.length; i++) {
            String path = args[i];
            if (!path.equals("..") && !path.equals("")) {
                builder.append(args[i]).append("/");
            }
        }
        return new File(rootDir, builder.toString());
    }
}
