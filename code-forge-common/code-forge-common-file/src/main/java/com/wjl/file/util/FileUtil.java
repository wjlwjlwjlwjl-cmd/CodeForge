package com.wjl.file.util;

import com.aliyun.oss.OSS;
import com.wjl.core.utils.ColorLog;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.net.URL;
import java.util.Date;
import java.util.UUID;

//封装oss服务
@Component
public class FileUtil {
    @Autowired
    private OSS ossClient;
    @Value("${aliyun.oss.bucket-name}")
    private String bucketName;

    /**
     * 上传文件
     *
     * @param file 待上传文件
     * @return 文件名称
     */
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

    /**
     * 删除文件
     *
     * @param fileName 需要删除的文件名
     */
    public void deleteFile(String fileName) {
        ossClient.deleteObject(bucketName, fileName);
    }

    /**
     * 更新文件
     *
     * @param fileName 文件名
     * @param file 需要更新文件内容
     */
    public void updateFile(String fileName, MultipartFile file) {
        try{
            ossClient.putObject(bucketName, fileName, file.getInputStream());
        }
        catch(IOException e){
            ColorLog.info("OSS Service Exception: {}", e.getMessage());
        }
    }

    public void getPresignedUrl(String objectName){
        Date expiration = new Date(System.currentTimeMillis() +  * 1000L);
        URL url = ossClient.generatePresignedUrl(bucketName, objectName, )
    }
}