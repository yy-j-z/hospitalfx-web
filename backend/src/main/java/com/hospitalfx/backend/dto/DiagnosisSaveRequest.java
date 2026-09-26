package com.hospitalfx.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.util.List;

public record DiagnosisSaveRequest(
    @NotBlank String diagiosis,
    String prescription,
    @NotNull BigDecimal drugPrice,
    @NotNull Integer purchaseType,
    List<MedicationItemRequest> medicationItems
) {
}
