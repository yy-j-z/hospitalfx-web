package com.hospitalfx.backend.controller;

import com.hospitalfx.backend.dto.AppStateResponse;
import com.hospitalfx.backend.dto.UserUpdateRequest;
import com.hospitalfx.backend.model.UserAccount;
import com.hospitalfx.backend.repository.DoctorRepository;
import com.hospitalfx.backend.repository.UserRepository;
import com.hospitalfx.backend.service.AppStateService;
import com.hospitalfx.backend.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserRepository userRepository;
    private final DoctorRepository doctorRepository;
    private final AppStateService appStateService;
    private final AuthService authService;

    public UserController(UserRepository userRepository, DoctorRepository doctorRepository, AppStateService appStateService, AuthService authService) {
        this.userRepository = userRepository;
        this.doctorRepository = doctorRepository;
        this.appStateService = appStateService;
        this.authService = authService;
    }

    @PutMapping("/{id}")
    public AppStateResponse update(
        @RequestHeader(value = "X-Auth-Token", required = false) String token,
        @PathVariable Integer id,
        @Valid @RequestBody UserUpdateRequest request
    ) {
        UserAccount currentUser = authService.requireUser(token);
        authService.requireAnyRole(currentUser, "ADMIN");
        UserAccount user = userRepository.findById(id)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "用户不存在"));
        if ("admin".equalsIgnoreCase(user.getUsername()) && !"ADMIN".equals(request.roleCode())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "固定管理员账号不允许降级");
        }

        String doctorId = user.getDoctorId();
        String loginCode = user.getLoginCode();
        if ("DOCTOR".equals(request.roleCode())) {
            if (request.deptName() == null || request.deptName().isBlank() || request.registLevel() == null || request.registLevel().isBlank()) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "医生角色需要配置科室和号别");
            }
            if (doctorId == null || doctorId.isBlank()) {
                doctorId = doctorRepository.nextDoctorId();
            }
            loginCode = doctorId;
            doctorRepository.upsertDoctor(doctorId, user.getRealName(), request.deptName(), request.registLevel());
        } else {
            if (doctorId != null && !doctorId.isBlank()) {
                doctorRepository.deleteByDoctorId(doctorId);
                doctorId = null;
            }
            loginCode = switch (request.roleCode()) {
                case "ADMIN" -> loginCode != null && loginCode.startsWith("A") ? loginCode : userRepository.nextLoginCode("A");
                case "CLERK" -> loginCode != null && loginCode.startsWith("G") ? loginCode : userRepository.nextLoginCode("G");
                case "PHARMACIST" -> loginCode != null && loginCode.startsWith("Y") ? loginCode : userRepository.nextLoginCode("Y");
                case "PATIENT" -> null;
                default -> loginCode;
            };
        }

        userRepository.updateRole(id, loginCode, request.roleCode(), request.enabled(), doctorId);
        return appStateService.loadStateFor(currentUser);
    }
}
