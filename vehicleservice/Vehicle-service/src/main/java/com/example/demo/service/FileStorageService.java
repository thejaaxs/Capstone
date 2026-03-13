package com.example.demo.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.UUID;
import org.springframework.util.StringUtils;

@Service
@Slf4j
public class FileStorageService {

    @Value("${file.upload-dir}")
    private String uploadDir;

    // ============================
    // SAVE FILE
    // ============================
    public String saveFile(MultipartFile file) {
        try {
            String originalName = StringUtils.cleanPath(file.getOriginalFilename() == null ? "file" : file.getOriginalFilename());
            String fileName = UUID.randomUUID() + "_" + originalName;
            Path uploadPath = Paths.get(uploadDir).toAbsolutePath().normalize();

            if (!Files.exists(uploadPath)) {
                Files.createDirectories(uploadPath);
            }

            Path path = uploadPath.resolve(fileName).normalize();
            Files.copy(file.getInputStream(), path, StandardCopyOption.REPLACE_EXISTING);

            return fileName;
        } catch (IOException e) {
            throw new RuntimeException("Failed to store file", e);
        }
    }

    // ============================
    // DELETE FILE
    // ============================
    public void deleteFile(String fileName) {
        if (fileName == null) return;

        String normalizedName = fileName.startsWith("/uploads/") ? fileName.substring("/uploads/".length()) : fileName;
        Path path = Paths.get(uploadDir).toAbsolutePath().normalize().resolve(normalizedName).normalize();
        try {
            Files.deleteIfExists(path);
        } catch (IOException ex) {
            log.warn("Could not delete file {}", fileName, ex);
        }
    }

    // ============================
    // BUILD PUBLIC URL
    // ============================
    public String getFileUrl(String fileName) {
        if (fileName == null) return null;
        if (fileName.startsWith("/uploads/")) return fileName;
        return "/uploads/" + fileName;
    }
}
