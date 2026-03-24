package com.hospitalfx.backend.dto;

import com.hospitalfx.backend.model.ConsultMessage;
import com.hospitalfx.backend.model.DoctorProfile;
import com.hospitalfx.backend.model.PatientProfile;
import com.hospitalfx.backend.model.RegistrationRecord;
import java.util.List;

public record AppStateResponse(
    List<UserSummary> users,
    List<DoctorProfile> doctors,
    List<PatientProfile> patientProfiles,
    List<RegistrationRecord> registrations,
    List<ConsultMessage> consultMessages
) {
}
