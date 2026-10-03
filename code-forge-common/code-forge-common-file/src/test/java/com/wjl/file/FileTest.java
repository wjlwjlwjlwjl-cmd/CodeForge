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
        File file = new File("./test.png");
        try{
            MultipartFile multipartFile = ToMultipartFile.toMultipartFile(file);
            ColorLog.info(fileUtil.uploadFile(multipartFile));
        }
        catch(Exception e){
            ColorLog.error(e.getMessage());
        }
    }

    @Test
    public void testDeleteFile(){
        String fileName = "9e49a544-3c30-4947-9356-ebfb981e89d2.png";
        fileUtil.deleteFile(fileName);
    }

    @Test
    public void testUpdateFile(){
        String fileName = "3e33fd48-04d3-4b09-b1bd-7e08654b7d81.png";
        File file = new File("./test2.png");
        try{
            MultipartFile multipartFile = ToMultipartFile.toMultipartFile(file);
            fileUtil.updateFile(fileName, multipartFile);
        }
        catch(Exception e){
            ColorLog.error(e.getMessage());
        }
    }

    @Test
    public void testGetPresignedUrl(){
        String fileName = "3e33fd48-04d3-4b09-b1bd-7e08654b7d81.png";
        ColorLog.info(fileUtil.getPresignedUrl(fileName));
    }
}
