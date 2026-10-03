package com.wjl.file.util;

import com.aliyun.oss.OSS;
import com.wjl.core.utils.ColorLog;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;

import java.util.UUID;

//封装oss服务
@Component
public class FileUtil {
    @Autowired
    private OSS ossClient;
    @Value("${aliyun.oss.bucket-name}")
    private String bucketName;

    public String uploadFile(MultipartFile file) {
        ColorLog.info(bucketName);
        if(file == null) return null;
        String originalFilename = file.getOriginalFilename();

        if(originalFilename == null) return null;
        if(originalFilename.contains(".")) {
            String suffix = originalFilename.substring(originalFilename.lastIndexOf("."));
            String fileName = UUID.randomUUID() + suffix; //UUID + suffix
            try{
                ossClient.putObject(bucketName, fileName, file.getInputStream());
            }
            catch(Exception e){
                ColorLog.info("OSS Service Exception: {}", e.getMessage());
            }
            return fileName;
        }
        return null;
    }
}
