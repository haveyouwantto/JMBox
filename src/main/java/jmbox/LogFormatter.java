package jmbox;

import java.text.SimpleDateFormat;
import java.util.logging.Formatter;
import java.util.logging.LogRecord;

public class LogFormatter extends Formatter {
    public static SimpleDateFormat dateFormat = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss");

    @Override
    public String format(LogRecord record) {
        return String.format("[%s][%s] <%s:%s> %s\n",
                dateFormat.format(record.getMillis()),
                record.getLevel(),
                record.getSourceClassName(),
                record.getSourceMethodName(),
                record.getMessage()
        );
    }
}
