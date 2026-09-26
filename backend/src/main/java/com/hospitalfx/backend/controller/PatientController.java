package com.hospitalfx.backend.controller;

import com.hospitalfx.backend.dto.AppStateResponse;
import com.hospitalfx.backend.dto.PatientRegisterRequest;
import com.hospitalfx.backend.model.PatientProfile;
import com.hospitalfx.backend.model.UserAccount;
import com.hospitalfx.backend.repository.PatientProfileRepository;
import com.hospitalfx.backend.repository.UserRepository;
import com.hospitalfx.backend.service.AppStateService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/patients")
public class PatientController {

    private final UserRepository userRepository;
    private final PatientProfileRepository patientProfileRepository;
    private final AppStateService appStateService;

    public PatientController(
        UserRepository userRepository,
        PatientProfileRepository patientProfileRepository,
        AppStateService appStateService
    ) {
        this.userRepository = userRepository;
        this.patientProfileRepository = patientProfileRepository;
        this.appStateService = appStateService;
    }

    @PostMapping("/register")
    public AppStateResponse register(@Valid @RequestBody PatientRegisterRequest request) {
        if (userRepository.findByPhoneNumber(request.phoneNumber()).isPresent()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "手机号已注册");
        }
        UserAccount user = new UserAccount();
        user.setUsername("patient_" + request.phoneNumber());
        user.setPassword(request.password());
        user.setRealName(request.realName());
        user.setPhoneNumber(request.phoneNumber());
        int userId = userRepository.createPatient(user);

        PatientProfile profile = new PatientProfile();
        profile.setUserId(userId);
        profile.setPatientName(request.realName());
        profile.setGender(request.gender());
        profile.setPhoneNumber(request.phoneNumber());
        profile.setCardNumber(request.cardNumber().toUpperCase());
        profile.setBirthdate(request.birthdate());
        profile.setAge(request.age());
        profile.setHomeAddress(request.homeAddress());
        patientProfileRepository.save(profile);

        return appStateService.loadStateFor(userRepository.findById(userId).orElseThrow());
    }
}
