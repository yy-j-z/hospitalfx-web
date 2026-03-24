package com.hospitalfx.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;

public record PatientRegisterRequest(
    @NotBlank
    @Pattern(regexp = "^1\\d{10}$", message = "手机号格式不正确")
    String phoneNumber,
    @NotBlank String password,
    @NotBlank String realName,
    @NotBlank String gender,
    @NotBlank String birthdate,
    @NotNull Integer age,
    @NotBlank String cardNumber,
    @NotBlank String homeAddress
) {
}
