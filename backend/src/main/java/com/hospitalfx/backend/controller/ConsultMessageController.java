package com.hospitalfx.backend.controller;

import com.hospitalfx.backend.dto.AppStateResponse;
import com.hospitalfx.backend.dto.ConsultCreateRequest;
import com.hospitalfx.backend.dto.ReplyRequest;
import com.hospitalfx.backend.model.ConsultMessage;
import com.hospitalfx.backend.model.DoctorProfile;
import com.hospitalfx.backend.model.UserAccount;
import com.hospitalfx.backend.repository.ConsultMessageRepository;
import com.hospitalfx.backend.repository.DoctorRepository;
import com.hospitalfx.backend.repository.UserRepository;
import com.hospitalfx.backend.service.AppStateService;
import com.hospitalfx.backend.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/consult-messages")
public class ConsultMessageController {

    private final ConsultMessageRepository consultMessageRepository;
    private final UserRepository userRepository;
    private final DoctorRepository doctorRepository;
    private final AppStateService appStateService;
    private final AuthService authService;

    public ConsultMessageController(
        ConsultMessageRepository consultMessageRepository,
        UserRepository userRepository,
        DoctorRepository doctorRepository,
        AppStateService appStateService,
        AuthService authService
    ) {
        this.consultMessageRepository = consultMessageRepository;
        this.userRepository = userRepository;
        this.doctorRepository = doctorRepository;
        this.appStateService = appStateService;
        this.authService = authService;
    }

    @PostMapping
    public AppStateResponse create(
        @RequestHeader(value = "X-Auth-Token", required = false) String token,
        @Valid @RequestBody ConsultCreateRequest request
    ) {
        UserAccount currentUser = authService.requireUser(token);
        authService.requireAnyRole(currentUser, "ADMIN", "PATIENT");
        if ("PATIENT".equals(currentUser.getRoleCode()) && !currentUser.getId().equals(request.patientUserId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "只能提交自己的留言");
        }
        UserAccount patient = userRepository.findById(request.patientUserId())
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "患者不存在"));
        UserAccount doctorUser = userRepository.findById(request.doctorUserId())
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "医生账号不存在"));
        DoctorProfile doctor = doctorRepository.findByDoctorId(doctorUser.getDoctorId())
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "医生档案不存在"));

        ConsultMessage message = new ConsultMessage();
        message.setPatientUserId(patient.getId());
        message.setPatientName(patient.getRealName());
        message.setDoctorUserId(doctorUser.getId());
        message.setDoctorName(doctor.getRealName());
        message.setSymptomSummary(request.symptomSummary());
        message.setPatientMessage(request.patientMessage());
        consultMessageRepository.create(message);
        return appStateService.loadStateFor(currentUser);
    }

    @PutMapping("/{id}/reply")
    public AppStateResponse reply(
        @RequestHeader(value = "X-Auth-Token", required = false) String token,
        @PathVariable Integer id,
        @Valid @RequestBody ReplyRequest request
    ) {
        UserAccount currentUser = authService.requireUser(token);
        authService.requireAnyRole(currentUser, "ADMIN", "DOCTOR");
        ConsultMessage message = consultMessageRepository.findById(id);
        if (message == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "留言不存在");
        }
        if ("DOCTOR".equals(currentUser.getRoleCode()) && !currentUser.getId().equals(message.getDoctorUserId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "只能回复分配给自己的留言");
        }
        consultMessageRepository.reply(id, request.doctorReply());
        return appStateService.loadStateFor(currentUser);
    }
}
