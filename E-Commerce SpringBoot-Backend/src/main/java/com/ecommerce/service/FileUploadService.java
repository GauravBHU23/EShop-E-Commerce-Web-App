package com.ecommerce.service;

import com.ecommerce.exception.FileUploadException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.*;
import java.util.Arrays;
import java.util.List;
import java.util.UUID;

@Service
@Slf4j
public class FileUploadService {

    @Value("${app.file.upload-dir}")
    private String uploadDir;

    private static final List<String> ALLOWED_TYPES =
        Arrays.asList("image/jpeg", "image/jpg", "image/png", "image/webp");
    private static final long MAX_SIZE = 10 * 1024 * 1024; // 10MB

    public String uploadImage(MultipartFile file, String folder) {
        validateFile(file);

        try {
            Path uploadPath = Paths.get(uploadDir, folder);
            if (!Files.exists(uploadPath)) {
                Files.createDirectories(uploadPath);
            }

            String originalFilename = StringUtils.cleanPath(
                file.getOriginalFilename() != null ? file.getOriginalFilename() : "image");
            String extension = getExtension(originalFilename);
            String newFilename = UUID.randomUUID() + "." + extension;

            Path filePath = uploadPath.resolve(newFilename);
            Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);

            String fileUrl = "/uploads/" + folder + "/" + newFilename;
            log.info("File uploaded successfully: {}", fileUrl);
            return fileUrl;

        } catch (IOException ex) {
            throw new FileUploadException("Failed to store file: " + ex.getMessage(), ex);
        }
    }

    public void deleteFile(String fileUrl) {
        if (fileUrl == null || fileUrl.isEmpty()) return;
        try {
            // /uploads/products/uuid.jpg -> uploads/products/uuid.jpg
            String relativePath = fileUrl.startsWith("/") ? fileUrl.substring(1) : fileUrl;
            Path filePath = Paths.get(relativePath);
            Files.deleteIfExists(filePath);
            log.info("File deleted: {}", fileUrl);
        } catch (IOException ex) {
            log.warn("Could not delete file: {}", fileUrl);
        }
    }

    private void validateFile(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new FileUploadException("File is empty or null");
        }
        if (file.getSize() > MAX_SIZE) {
            throw new FileUploadException("File size exceeds maximum allowed size of 10MB");
        }
        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_TYPES.contains(contentType.toLowerCase())) {
            throw new FileUploadException("Invalid file type. Allowed: JPEG, PNG, WEBP");
        }
    }

    private String getExtension(String filename) {
        int lastDot = filename.lastIndexOf('.');
        return lastDot > 0 ? filename.substring(lastDot + 1).toLowerCase() : "jpg";
    }
}
