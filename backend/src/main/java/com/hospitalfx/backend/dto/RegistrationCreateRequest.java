package com.hospitalfx.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record RegistrationCreateRequest(
    Integer patientUserId,
    @NotBlank String realname,
    @NotBlank String gender,
    @NotBlank String birthdate,
    @NotNull Integer age,
    @NotBlank String cardNumber,
    @NotBlank String homeAddress,
    @NotBlank String deptName,
    @NotBlank String doctorId,
    @NotBlank String registLevel,
    @NotBlank String isBook,
    @NotBlank String registDate
) {
}
