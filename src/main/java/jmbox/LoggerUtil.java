package jmbox;

import java.util.logging.ConsoleHandler;
import java.util.logging.Logger;

public class LoggerUtil {
    private LoggerUtil(){}

    public static Logger getLogger(String name){
        Logger logger = Logger.getLogger(name);
        logger.setUseParentHandlers(false);
        ConsoleHandler handler = new ConsoleHandler();
        logger.addHandler(handler);
        handler.setFormatter(new LogFormatter());
        return logger;
    }
}
