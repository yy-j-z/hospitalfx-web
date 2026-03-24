package com.hospitalfx.backend.dto;

import jakarta.validation.constraints.NotBlank;

public record DoctorMedicationAiRequest(
    String patientName,
    String gender,
    String age,
    String currentDiagnosis,
    @NotBlank String symptomSummary
) {
}
