package jmbox.web;

import java.io.IOException;

public class PermissionException extends IOException {
    public PermissionException(String format) {
        super(format);
    }
}
