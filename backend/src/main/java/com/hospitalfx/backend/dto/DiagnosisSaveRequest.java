package com.hospitalfx.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;

public record DiagnosisSaveRequest(
    @NotBlank String diagiosis,
    @NotBlank String prescription,
    @NotNull BigDecimal drugPrice,
    @NotNull Integer purchaseType
) {
}
