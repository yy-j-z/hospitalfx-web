package com.hospitalfx.backend.controller;

import com.hospitalfx.backend.dto.AppStateResponse;
import com.hospitalfx.backend.dto.DiagnosisSaveRequest;
import com.hospitalfx.backend.dto.RegistrationCreateRequest;
import com.hospitalfx.backend.model.DoctorProfile;
import com.hospitalfx.backend.model.RegistrationRecord;
import com.hospitalfx.backend.model.UserAccount;
import com.hospitalfx.backend.repository.DoctorRepository;
import com.hospitalfx.backend.repository.RegistrationRepository;
import com.hospitalfx.backend.service.AppStateService;
import com.hospitalfx.backend.service.AuthService;
import jakarta.validation.Valid;
import java.math.BigDecimal;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/registrations")
public class RegistrationController {

    private final RegistrationRepository registrationRepository;
    private final DoctorRepository doctorRepository;
    private final AppStateService appStateService;
    private final AuthService authService;

    public RegistrationController(
        RegistrationRepository registrationRepository,
        DoctorRepository doctorRepository,
        AppStateService appStateService,
        AuthService authService
    ) {
        this.registrationRepository = registrationRepository;
        this.doctorRepository = doctorRepository;
        this.appStateService = appStateService;
        this.authService = authService;
    }

    @PostMapping
    public AppStateResponse create(
        @RequestHeader(value = "X-Auth-Token", required = false) String token,
        @Valid @RequestBody RegistrationCreateRequest request
    ) {
        UserAccount currentUser = authService.requireUser(token);
        authService.requireAnyRole(currentUser, "ADMIN", "CLERK");
        DoctorProfile doctor = doctorRepository.findByDoctorId(request.doctorId())
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "医生不存在"));
        RegistrationRecord record = new RegistrationRecord();
        record.setId(registrationRepository.nextId());
        record.setPatientUserId(request.patientUserId());
        record.setRealname(request.realname());
        record.setGender(request.gender());
        record.setBirthdate(request.birthdate());
        record.setAge(request.age());
        record.setCardNumber(request.cardNumber().toUpperCase());
        record.setHomeAddress(request.homeAddress());
        record.setDeptName(request.deptName());
        record.setDoctorName(doctor.getRealName());
        record.setDoctorId(doctor.getDoctorId());
        record.setRegisteredByUserId(currentUser.getId());
        record.setRegisteredByCode(currentUser.getLoginCode());
        record.setRegisteredByName(currentUser.getRealName());
        record.setRegistLevel(request.registLevel());
        record.setIsBook(request.isBook());
        record.setRegistfee(doctor.getRegistFee().add("是".equals(request.isBook()) ? new BigDecimal("1.00") : BigDecimal.ZERO));
        record.setRegistDate(request.registDate());
        record.setDiagiosis("");
        record.setPrescription("");
        record.setDrugPrice(BigDecimal.ZERO);
        record.setVisitState(1);
        record.setPurchaseType(0);
        registrationRepository.create(record);
        return appStateService.loadStateFor(currentUser);
    }

    @DeleteMapping("/{id}")
    public AppStateResponse cancel(
        @RequestHeader(value = "X-Auth-Token", required = false) String token,
        @PathVariable Integer id
    ) {
        UserAccount currentUser = authService.requireUser(token);
        authService.requireAnyRole(currentUser, "ADMIN", "CLERK");
        RegistrationRecord record = registrationRepository.findById(id)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "挂号记录不存在"));
        if (record.getVisitState() != 1) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "只有待就诊记录允许退号");
        }
        registrationRepository.delete(id);
        return appStateService.loadStateFor(currentUser);
    }

    @PutMapping("/{id}/diagnosis")
    public AppStateResponse saveDiagnosis(
        @RequestHeader(value = "X-Auth-Token", required = false) String token,
        @PathVariable Integer id,
        @Valid @RequestBody DiagnosisSaveRequest request
    ) {
        UserAccount currentUser = authService.requireUser(token);
        authService.requireAnyRole(currentUser, "ADMIN", "DOCTOR");
        RegistrationRecord record = registrationRepository.findById(id)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "挂号记录不存在"));
        if ("DOCTOR".equals(currentUser.getRoleCode()) && !currentUser.getDoctorId().equals(record.getDoctorId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "只能处理自己的接诊记录");
        }
        registrationRepository.saveDiagnosis(id, request.diagiosis(), request.prescription(), request.drugPrice(), request.purchaseType());
        return appStateService.loadStateFor(currentUser);
    }

    @PutMapping("/{id}/dispense")
    public AppStateResponse markDispensed(
        @RequestHeader(value = "X-Auth-Token", required = false) String token,
        @PathVariable Integer id
    ) {
        UserAccount currentUser = authService.requireUser(token);
        authService.requireAnyRole(currentUser, "ADMIN", "PHARMACIST");
        registrationRepository.findById(id)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "挂号记录不存在"));
        registrationRepository.markDispensed(id, currentUser.getId(), currentUser.getLoginCode(), currentUser.getRealName());
        return appStateService.loadStateFor(currentUser);
    }
}
