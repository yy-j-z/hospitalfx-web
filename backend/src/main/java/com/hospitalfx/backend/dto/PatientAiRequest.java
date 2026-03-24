package com.hospitalfx.backend.dto;

import jakarta.validation.constraints.NotBlank;

public record PatientAiRequest(
    String patientName,
    String gender,
    String age,
    @NotBlank String symptomSummary
) {
}
