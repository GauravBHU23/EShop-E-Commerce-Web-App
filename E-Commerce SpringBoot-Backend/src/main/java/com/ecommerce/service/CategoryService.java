package com.ecommerce.service;

import com.ecommerce.dto.request.CategoryRequest;
import com.ecommerce.dto.response.CategoryResponse;
import com.ecommerce.entity.Category;
import com.ecommerce.exception.*;
import com.ecommerce.repository.CategoryRepository;
import com.ecommerce.util.SlugUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class CategoryService {

    private final CategoryRepository categoryRepository;
    private final FileUploadService fileUploadService;

    @Cacheable("categories")
    @Transactional(readOnly = true)
    public List<CategoryResponse> getAllRootCategories() {
        return categoryRepository.findByParentIsNullAndIsActiveTrue().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<CategoryResponse> getSubCategories(Long parentId) {
        return categoryRepository.findByParentIdAndIsActiveTrue(parentId).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public CategoryResponse getCategoryById(Long id) {
        return mapToResponse(findById(id));
    }

    @Transactional
    @CacheEvict(value = "categories", allEntries = true)
    public CategoryResponse createCategory(CategoryRequest request, MultipartFile image) {
        if (categoryRepository.existsByName(request.getName())) {
            throw new DuplicateResourceException("Category already exists: " + request.getName());
        }

        Category category = new Category();
        category.setName(request.getName());
        category.setSlug(SlugUtil.toSlug(request.getName()));
        category.setDescription(request.getDescription());
        category.setActive(true);

        if (request.getParentId() != null) {
            Category parent = findById(request.getParentId());
            category.setParent(parent);
        }

        if (image != null && !image.isEmpty()) {
            category.setImage(fileUploadService.uploadImage(image, "categories"));
        }

        return mapToResponse(categoryRepository.save(category));
    }

    @Transactional
    @CacheEvict(value = "categories", allEntries = true)
    public CategoryResponse updateCategory(Long id, CategoryRequest request, MultipartFile image) {
        Category category = findById(id);
        category.setName(request.getName());
        category.setDescription(request.getDescription());

        if (request.getParentId() != null) {
            if (request.getParentId().equals(id)) {
                throw new BadRequestException("Category cannot be its own parent");
            }
            category.setParent(findById(request.getParentId()));
        } else {
            category.setParent(null);
        }

        if (image != null && !image.isEmpty()) {
            if (category.getImage() != null) fileUploadService.deleteFile(category.getImage());
            category.setImage(fileUploadService.uploadImage(image, "categories"));
        }

        return mapToResponse(categoryRepository.save(category));
    }

    @Transactional
    @CacheEvict(value = "categories", allEntries = true)
    public void deleteCategory(Long id) {
        Category category = findById(id);
        category.setActive(false); // soft delete
        categoryRepository.save(category);
        log.info("Category soft-deleted: {}", id);
    }

    private Category findById(Long id) {
        return categoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Category", "id", id));
    }

    public CategoryResponse mapToResponse(Category c) {
        List<CategoryResponse> subs = c.getSubCategories() == null ? List.of() :
                c.getSubCategories().stream()
                        .filter(Category::isActive)
                        .map(this::mapToResponse)
                        .collect(Collectors.toList());

        return CategoryResponse.builder()
                .id(c.getId())
                .name(c.getName())
                .slug(c.getSlug())
                .description(c.getDescription())
                .image(c.getImage())
                .parentId(c.getParent() != null ? c.getParent().getId() : null)
                .subCategories(subs)
                .build();
    }
}
