package com.hospitalfx.backend.dto;

import jakarta.validation.constraints.NotBlank;

public record ReplyRequest(
    @NotBlank String doctorReply
) {
}
