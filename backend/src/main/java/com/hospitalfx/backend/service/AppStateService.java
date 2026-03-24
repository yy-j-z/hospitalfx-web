package com.hospitalfx.backend.service;

import com.hospitalfx.backend.dto.AppStateResponse;
import com.hospitalfx.backend.dto.UserSummary;
import com.hospitalfx.backend.model.ConsultMessage;
import com.hospitalfx.backend.model.DoctorProfile;
import com.hospitalfx.backend.model.PatientProfile;
import com.hospitalfx.backend.model.RegistrationRecord;
import com.hospitalfx.backend.model.UserAccount;
import com.hospitalfx.backend.repository.ConsultMessageRepository;
import com.hospitalfx.backend.repository.DoctorRepository;
import com.hospitalfx.backend.repository.PatientProfileRepository;
import com.hospitalfx.backend.repository.RegistrationRepository;
import com.hospitalfx.backend.repository.UserRepository;
import java.util.List;
import org.springframework.stereotype.Service;

@Service
public class AppStateService {

    private final UserRepository userRepository;
    private final DoctorRepository doctorRepository;
    private final PatientProfileRepository patientProfileRepository;
    private final RegistrationRepository registrationRepository;
    private final ConsultMessageRepository consultMessageRepository;

    public AppStateService(
        UserRepository userRepository,
        DoctorRepository doctorRepository,
        PatientProfileRepository patientProfileRepository,
        RegistrationRepository registrationRepository,
        ConsultMessageRepository consultMessageRepository
    ) {
        this.userRepository = userRepository;
        this.doctorRepository = doctorRepository;
        this.patientProfileRepository = patientProfileRepository;
        this.registrationRepository = registrationRepository;
        this.consultMessageRepository = consultMessageRepository;
    }

    public AppStateResponse loadState() {
        List<UserSummary> users = userRepository.findAll().stream().map(this::toSummary).toList();
        List<DoctorProfile> doctors = doctorRepository.findAll();
        List<PatientProfile> patientProfiles = patientProfileRepository.findAll();
        List<RegistrationRecord> registrations = registrationRepository.findAll();
        List<ConsultMessage> consultMessages = consultMessageRepository.findAll();
        return new AppStateResponse(users, doctors, patientProfiles, registrations, consultMessages);
    }

    public AppStateResponse loadStateFor(UserAccount currentUser) {
        List<UserSummary> users = switch (currentUser.getRoleCode()) {
            case "ADMIN" -> userRepository.findAll().stream().map(this::toSummary).toList();
            default -> List.of(toSummary(currentUser));
        };

        List<DoctorProfile> allDoctors = doctorRepository.findAll();
        List<PatientProfile> allPatientProfiles = patientProfileRepository.findAll();
        List<RegistrationRecord> allRegistrations = registrationRepository.findAll();
        List<ConsultMessage> allConsultMessages = consultMessageRepository.findAll();

        List<DoctorProfile> doctors = switch (currentUser.getRoleCode()) {
            case "ADMIN", "CLERK" -> allDoctors;
            case "PATIENT" -> allDoctors.stream()
                .filter(doctor -> Boolean.TRUE.equals(doctor.getEnabled()))
                .toList();
            case "DOCTOR" -> allDoctors.stream()
                .filter(doctor -> doctor.getDoctorId().equals(currentUser.getDoctorId()))
                .toList();
            default -> List.of();
        };

        List<PatientProfile> patientProfiles = switch (currentUser.getRoleCode()) {
            case "ADMIN" -> allPatientProfiles;
            case "PATIENT" -> allPatientProfiles.stream()
                .filter(profile -> profile.getUserId().equals(currentUser.getId()))
                .toList();
            default -> List.of();
        };

        List<RegistrationRecord> registrations = switch (currentUser.getRoleCode()) {
            case "ADMIN", "CLERK" -> allRegistrations;
            case "DOCTOR" -> allRegistrations.stream()
                .filter(record -> currentUser.getDoctorId() != null && currentUser.getDoctorId().equals(record.getDoctorId()))
                .toList();
            case "PHARMACIST" -> allRegistrations.stream()
                .filter(record -> record.getVisitState() >= 2)
                .toList();
            case "PATIENT" -> allRegistrations.stream()
                .filter(record -> currentUser.getId().equals(record.getPatientUserId()))
                .toList();
            default -> List.of();
        };

        List<ConsultMessage> consultMessages = switch (currentUser.getRoleCode()) {
            case "ADMIN" -> allConsultMessages;
            case "DOCTOR" -> allConsultMessages.stream()
                .filter(message -> currentUser.getId().equals(message.getDoctorUserId()))
                .toList();
            case "PATIENT" -> allConsultMessages.stream()
                .filter(message -> currentUser.getId().equals(message.getPatientUserId()))
                .toList();
            default -> List.of();
        };

        return new AppStateResponse(users, doctors, patientProfiles, registrations, consultMessages);
    }

    public UserSummary toSummary(UserAccount user) {
        return new UserSummary(
            user.getId(),
            user.getUsername(),
            user.getLoginCode(),
            user.getRealName(),
            user.getRoleCode(),
            user.getEnabled(),
            user.getPhoneNumber(),
            user.getDoctorId()
        );
    }
}
