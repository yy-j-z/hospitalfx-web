package com.hospitalfx.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record UserUpdateRequest(
    @NotBlank String roleCode,
    @NotNull Boolean enabled,
    String deptName,
    String registLevel
) {
}
