package com.ecommerce.controller;

import com.ecommerce.dto.request.CategoryRequest;
import com.ecommerce.dto.response.*;
import com.ecommerce.service.CategoryService;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.ConstraintViolation;
import jakarta.validation.ConstraintViolationException;
import jakarta.validation.Valid;
import jakarta.validation.Validator;
import lombok.RequiredArgsConstructor;
import org.springframework.http.*;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import java.util.List;

@RestController
@RequestMapping("/api/categories")
@RequiredArgsConstructor
@Tag(name = "Category", description = "Category Management")
public class CategoryController {

    private final CategoryService categoryService;
    private final ObjectMapper objectMapper;
    private final Validator validator;

    @GetMapping
    public ResponseEntity<ApiResponse<List<CategoryResponse>>> getAllCategories() {
        return ResponseEntity.ok(ApiResponse.success("Categories fetched",
                categoryService.getAllRootCategories()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<CategoryResponse>> getCategoryById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success("Category fetched",
                categoryService.getCategoryById(id)));
    }

    @GetMapping("/{id}/subcategories")
    public ResponseEntity<ApiResponse<List<CategoryResponse>>> getSubCategories(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success("Subcategories fetched",
                categoryService.getSubCategories(id)));
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<CategoryResponse>> createCategory(
            @RequestPart("category") String categoryJson,
            @RequestPart(value = "image", required = false) MultipartFile image) {
        CategoryRequest request = parseCategoryRequest(categoryJson);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Category created",
                        categoryService.createCategory(request, image)));
    }

    @PutMapping(value = "/{id}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<CategoryResponse>> updateCategory(
            @PathVariable Long id,
            @RequestPart("category") String categoryJson,
            @RequestPart(value = "image", required = false) MultipartFile image) {
        CategoryRequest request = parseCategoryRequest(categoryJson);
        return ResponseEntity.ok(ApiResponse.success("Category updated",
                categoryService.updateCategory(id, request, image)));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> deleteCategory(@PathVariable Long id) {
        categoryService.deleteCategory(id);
        return ResponseEntity.ok(ApiResponse.success("Category deleted"));
    }

    private CategoryRequest parseCategoryRequest(String categoryJson) {
        try {
            CategoryRequest request = objectMapper.readValue(categoryJson, CategoryRequest.class);
            validate(request);
            return request;
        } catch (JsonProcessingException ex) {
            throw new IllegalArgumentException("Invalid category payload", ex);
        }
    }

    private void validate(CategoryRequest request) {
        List<ConstraintViolation<CategoryRequest>> violations = validator.validate(request).stream().toList();
        if (!violations.isEmpty()) {
            throw new ConstraintViolationException(violations.stream()
                    .map(v -> (ConstraintViolation<?>) v)
                    .collect(java.util.stream.Collectors.toSet()));
        }
    }
}
