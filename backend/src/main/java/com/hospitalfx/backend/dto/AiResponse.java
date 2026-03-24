package com.hospitalfx.backend.dto;

public record AiResponse(
    String rawContent,
    String primary,
    String secondary,
    String tertiary,
    String risk
) {
}
