package com.wjl.file;

import com.wjl.core.utils.ColorLog;
import com.wjl.file.util.FileUtil;
import com.wjl.file.util.ToMultipartFile;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;

@SpringBootTest(classes = FileApplication.class)
public class FileTest {
    @Autowired
    private FileUtil fileUtil;

    @Test
    public void testUploadFile(){
        ColorLog.info(System.getProperty("user.dir"));
        File file = new File("./test.png");
        try{
            MultipartFile multipartFile = ToMultipartFile.toMultipartFile(file);
            ColorLog.info(fileUtil.uploadFile(multipartFile));
        }
        catch(Exception e){
            ColorLog.error(e.getMessage());
        }
    }
}
