package com.hospitalfx.backend.dto;

import java.util.List;

public record AgentChatRequest(
    String agentName,
    String roleLabel,
    String pageLabel,
    String pageSummary,
    String scope,
    String prompt,
    List<AgentChatMessage> history
) {
}
