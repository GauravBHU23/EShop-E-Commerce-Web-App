package com.ecommerce.dto.request;
import jakarta.validation.constraints.*;
import lombok.*;
@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class CategoryRequest {
    @NotBlank private String name;
    private String description;
    private Long parentId;
}
