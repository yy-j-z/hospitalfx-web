package com.hospitalfx.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record ConsultCreateRequest(
    @NotNull Integer patientUserId,
    @NotNull Integer doctorUserId,
    @NotBlank String symptomSummary,
    @NotBlank String patientMessage
) {
}
