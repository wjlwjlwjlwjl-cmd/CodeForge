package com.wjl.file.util;

import org.springframework.mock.web.MockMultipartFile;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.FileInputStream;
import java.io.IOException;
import java.io.InputStream;

public class ToMultipartFile {
    public static MultipartFile toMultipartFile(File file) throws IOException {
        try(InputStream inputStream = new FileInputStream(file)) {
            return new MockMultipartFile(
                    file.getName(),
                    file.getName(),
                    "image.jpeg",
                    inputStream
            );
        }
    }
}
