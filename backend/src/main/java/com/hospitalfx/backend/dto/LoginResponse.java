package com.hospitalfx.backend.dto;

public record LoginResponse(
    String token,
    UserSummary user
) {
}
