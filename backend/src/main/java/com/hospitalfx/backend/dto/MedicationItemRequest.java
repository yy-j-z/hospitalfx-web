package com.hospitalfx.backend.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record MedicationItemRequest(
    @NotNull Integer medicationInventoryId,
    @NotBlank String medicationName,
    @NotBlank String dosage,
    @NotNull @Min(1) Integer quantity,
    @NotBlank String frequencyCode,
    @NotBlank String frequencyLabel,
    @NotNull @Min(1) Integer frequencyPerDay,
    String instructions
) {
}
