package com.hospitalfx.backend.service;

import com.hospitalfx.backend.dto.AppStateResponse;
import com.hospitalfx.backend.dto.UserSummary;
import com.hospitalfx.backend.model.ConsultMessage;
import com.hospitalfx.backend.model.DoctorProfile;
import com.hospitalfx.backend.model.MedicationCheckIn;
import com.hospitalfx.backend.model.MedicationConflict;
import com.hospitalfx.backend.model.MedicationInventory;
import com.hospitalfx.backend.model.MedicationPlan;
import com.hospitalfx.backend.model.PatientProfile;
import com.hospitalfx.backend.model.RegistrationRecord;
import com.hospitalfx.backend.model.UserAccount;
import com.hospitalfx.backend.repository.ConsultMessageRepository;
import com.hospitalfx.backend.repository.DoctorRepository;
import com.hospitalfx.backend.repository.MedicationCheckInRepository;
import com.hospitalfx.backend.repository.MedicationConflictRepository;
import com.hospitalfx.backend.repository.MedicationInventoryRepository;
import com.hospitalfx.backend.repository.MedicationPlanRepository;
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
    private final MedicationInventoryRepository medicationInventoryRepository;
    private final MedicationConflictRepository medicationConflictRepository;
    private final MedicationPlanRepository medicationPlanRepository;
    private final MedicationCheckInRepository medicationCheckInRepository;

    public AppStateService(
        UserRepository userRepository,
        DoctorRepository doctorRepository,
        PatientProfileRepository patientProfileRepository,
        RegistrationRepository registrationRepository,
        ConsultMessageRepository consultMessageRepository,
        MedicationInventoryRepository medicationInventoryRepository,
        MedicationConflictRepository medicationConflictRepository,
        MedicationPlanRepository medicationPlanRepository,
        MedicationCheckInRepository medicationCheckInRepository
    ) {
        this.userRepository = userRepository;
        this.doctorRepository = doctorRepository;
        this.patientProfileRepository = patientProfileRepository;
        this.registrationRepository = registrationRepository;
        this.consultMessageRepository = consultMessageRepository;
        this.medicationInventoryRepository = medicationInventoryRepository;
        this.medicationConflictRepository = medicationConflictRepository;
        this.medicationPlanRepository = medicationPlanRepository;
        this.medicationCheckInRepository = medicationCheckInRepository;
    }

    public AppStateResponse loadState() {
        List<UserSummary> users = userRepository.findAll().stream().map(this::toSummary).toList();
        List<DoctorProfile> doctors = doctorRepository.findAll();
        List<PatientProfile> patientProfiles = patientProfileRepository.findAll();
        List<RegistrationRecord> registrations = registrationRepository.findAll();
        List<ConsultMessage> consultMessages = consultMessageRepository.findAll();
        List<MedicationInventory> medicationInventories = medicationInventoryRepository.findAll();
        List<MedicationConflict> medicationConflicts = medicationConflictRepository.findAll();
        List<MedicationPlan> medicationPlans = medicationPlanRepository.findAll();
        List<MedicationCheckIn> medicationCheckIns = medicationCheckInRepository.findAll();
        return new AppStateResponse(
            users,
            doctors,
            patientProfiles,
            registrations,
            consultMessages,
            medicationInventories,
            medicationConflicts,
            medicationPlans,
            medicationCheckIns
        );
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
        List<MedicationInventory> allMedicationInventories = medicationInventoryRepository.findAll();
        List<MedicationConflict> allMedicationConflicts = medicationConflictRepository.findAll();
        List<MedicationPlan> allMedicationPlans = medicationPlanRepository.findAll();
        List<MedicationCheckIn> allMedicationCheckIns = medicationCheckInRepository.findAll();

        List<DoctorProfile> doctors = switch (currentUser.getRoleCode()) {
            case "ADMIN" -> allDoctors;
            case "PATIENT" -> allDoctors.stream().filter(doctor -> Boolean.TRUE.equals(doctor.getEnabled())).toList();
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
            case "ADMIN" -> allRegistrations;
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

        List<MedicationInventory> medicationInventories = switch (currentUser.getRoleCode()) {
            case "ADMIN", "DOCTOR", "PHARMACIST", "PATIENT" -> allMedicationInventories;
            default -> List.of();
        };

        List<MedicationConflict> medicationConflicts = switch (currentUser.getRoleCode()) {
            case "ADMIN", "DOCTOR", "PHARMACIST", "PATIENT" -> allMedicationConflicts;
            default -> List.of();
        };

        List<MedicationPlan> medicationPlans = switch (currentUser.getRoleCode()) {
            case "ADMIN" -> allMedicationPlans;
            case "DOCTOR" -> allMedicationPlans.stream()
                .filter(plan -> registrations.stream().anyMatch(registration -> registration.getId().equals(plan.getRegistrationId())))
                .toList();
            case "PHARMACIST" -> allMedicationPlans.stream()
                .filter(plan -> registrations.stream().anyMatch(registration -> registration.getId().equals(plan.getRegistrationId())))
                .toList();
            case "PATIENT" -> allMedicationPlans.stream()
                .filter(plan -> currentUser.getId().equals(plan.getPatientUserId()))
                .toList();
            default -> List.of();
        };

        List<MedicationCheckIn> medicationCheckIns = switch (currentUser.getRoleCode()) {
            case "ADMIN" -> allMedicationCheckIns;
            case "DOCTOR", "PHARMACIST" -> allMedicationCheckIns.stream()
                .filter(checkIn -> medicationPlans.stream().anyMatch(plan -> plan.getId().equals(checkIn.getPlanId())))
                .toList();
            case "PATIENT" -> allMedicationCheckIns.stream()
                .filter(checkIn -> currentUser.getId().equals(checkIn.getPatientUserId()))
                .toList();
            default -> List.of();
        };

        return new AppStateResponse(
            users,
            doctors,
            patientProfiles,
            registrations,
            consultMessages,
            medicationInventories,
            medicationConflicts,
            medicationPlans,
            medicationCheckIns
        );
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
