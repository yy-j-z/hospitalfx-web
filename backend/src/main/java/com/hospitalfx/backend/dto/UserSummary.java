package com.hospitalfx.backend.dto;

public record UserSummary(
    Integer id,
    String username,
    String loginCode,
    String realName,
    String roleCode,
    Boolean enabled,
    String phoneNumber,
    String doctorId
) {
}
