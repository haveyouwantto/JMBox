package jmbox.web;

import java.text.SimpleDateFormat;
import java.util.Locale;
import java.util.TimeZone;

public class TimeFormatter {
    private static final SimpleDateFormat format = new SimpleDateFormat("EEE, d MMM yyyy HH:mm:ss z", Locale.ENGLISH);
    private TimeFormatter() {

    }

    public static String format(long mills){
        format.setTimeZone(TimeZone.getTimeZone("GMT"));
        return format.format(mills);
    }
}
