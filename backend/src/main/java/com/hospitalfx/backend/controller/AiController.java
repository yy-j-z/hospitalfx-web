package com.hospitalfx.backend.controller;

import com.hospitalfx.backend.dto.AiResponse;
import com.hospitalfx.backend.dto.AgentChatRequest;
import com.hospitalfx.backend.dto.AgentChatResponse;
import com.hospitalfx.backend.dto.DoctorMedicationAiRequest;
import com.hospitalfx.backend.dto.PatientAiRequest;
import com.hospitalfx.backend.dto.RegistrationAiRequest;
import com.hospitalfx.backend.model.UserAccount;
import com.hospitalfx.backend.repository.DoctorRepository;
import com.hospitalfx.backend.service.AiService;
import com.hospitalfx.backend.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/ai")
public class AiController {

    private final AiService aiService;
    private final DoctorRepository doctorRepository;
    private final AuthService authService;

    public AiController(AiService aiService, DoctorRepository doctorRepository, AuthService authService) {
        this.aiService = aiService;
        this.doctorRepository = doctorRepository;
        this.authService = authService;
    }

    @PostMapping("/registration-advice")
    public AiResponse registrationAdvice(
        @RequestHeader(value = "X-Auth-Token", required = false) String token,
        @Valid @RequestBody RegistrationAiRequest request
    ) {
        requireRolesWhenLoggedIn(token, "ADMIN", "PATIENT");
        return aiService.registrationAdvice(
            request.patientName(),
            request.gender(),
            request.age(),
            request.symptomSummary(),
            doctorRepository.findAll()
        );
    }

    @PostMapping("/patient-advice")
    public AiResponse patientAdvice(
        @RequestHeader(value = "X-Auth-Token", required = false) String token,
        @Valid @RequestBody PatientAiRequest request
    ) {
        requireRolesWhenLoggedIn(token, "ADMIN", "PATIENT");
        return aiService.patientAdvice(
            request.patientName(),
            request.gender(),
            request.age(),
            request.symptomSummary()
        );
    }

    @PostMapping("/doctor-medication-advice")
    public AiResponse doctorMedicationAdvice(
        @RequestHeader(value = "X-Auth-Token", required = false) String token,
        @Valid @RequestBody DoctorMedicationAiRequest request
    ) {
        requireRolesWhenLoggedIn(token, "ADMIN", "DOCTOR", "PHARMACIST");
        return aiService.doctorMedicationAdvice(
            request.patientName(),
            request.gender(),
            request.age(),
            request.currentDiagnosis(),
            request.symptomSummary()
        );
    }

    @PostMapping("/agent-chat")
    public AgentChatResponse agentChat(
        @RequestHeader(value = "X-Auth-Token", required = false) String token,
        @RequestBody AgentChatRequest request
    ) {
        requireRolesWhenLoggedIn(token, "ADMIN", "DOCTOR", "PHARMACIST", "PATIENT");
        return aiService.agentChat(request);
    }

    private void requireRolesWhenLoggedIn(String token, String... roleCodes) {
        if (token == null || token.isBlank()) {
            return;
        }
        UserAccount currentUser = authService.requireUser(token);
        authService.requireAnyRole(currentUser, roleCodes);
    }
}
