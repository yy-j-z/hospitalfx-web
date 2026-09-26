package com.hospitalfx.backend.controller;

import com.hospitalfx.backend.dto.AppStateResponse;
import com.hospitalfx.backend.model.MedicationCheckIn;
import com.hospitalfx.backend.model.MedicationPlan;
import com.hospitalfx.backend.model.UserAccount;
import com.hospitalfx.backend.repository.MedicationCheckInRepository;
import com.hospitalfx.backend.repository.MedicationPlanRepository;
import com.hospitalfx.backend.service.AppStateService;
import com.hospitalfx.backend.service.AuthService;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/medication-plans")
public class MedicationPlanController {

    private static final DateTimeFormatter DATE_TIME_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ss");

    private final MedicationPlanRepository medicationPlanRepository;
    private final MedicationCheckInRepository medicationCheckInRepository;
    private final AppStateService appStateService;
    private final AuthService authService;

    public MedicationPlanController(
        MedicationPlanRepository medicationPlanRepository,
        MedicationCheckInRepository medicationCheckInRepository,
        AppStateService appStateService,
        AuthService authService
    ) {
        this.medicationPlanRepository = medicationPlanRepository;
        this.medicationCheckInRepository = medicationCheckInRepository;
        this.appStateService = appStateService;
        this.authService = authService;
    }

    @PutMapping("/{id}/check-in")
    public AppStateResponse checkIn(
        @RequestHeader(value = "X-Auth-Token", required = false) String token,
        @PathVariable Integer id
    ) {
        UserAccount currentUser = authService.requireUser(token);
        authService.requireAnyRole(currentUser, "ADMIN", "PATIENT");

        MedicationPlan plan = medicationPlanRepository.findById(id)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "服药计划不存在"));

        if ("PATIENT".equals(currentUser.getRoleCode()) && !currentUser.getId().equals(plan.getPatientUserId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "只能打卡自己的服药计划");
        }
        if ("PENDING_PICKUP".equals(plan.getStatus())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "请先完成取药，再进行服药打卡");
        }

        String checkedInAt = LocalDateTime.now().format(DATE_TIME_FORMATTER);
        String nextReminderAt = LocalDateTime.now().plusHours(resolveReminderHours(plan.getFrequencyCode())).format(DATE_TIME_FORMATTER);

        MedicationCheckIn checkIn = new MedicationCheckIn();
        checkIn.setPlanId(plan.getId());
        checkIn.setPatientUserId(plan.getPatientUserId());
        checkIn.setMedicationName(plan.getMedicationName());
        checkIn.setStatus("TAKEN");
        checkIn.setNote("患者已完成本次服药打卡");
        checkIn.setCheckedInAt(checkedInAt);
        medicationCheckInRepository.create(checkIn);

        medicationPlanRepository.markCheckedIn(plan.getId(), checkedInAt, nextReminderAt);
        return appStateService.loadStateFor(currentUser);
    }

    private long resolveReminderHours(String frequencyCode) {
        return switch (frequencyCode) {
            case "TID" -> 8L;
            case "BID" -> 12L;
            case "HS" -> 24L;
            default -> 24L;
        };
    }
}
