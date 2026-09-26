package com.hospitalfx.backend.model;

public class MedicationCheckIn {
    private Integer id;
    private Integer planId;
    private Integer patientUserId;
    private String medicationName;
    private String status;
    private String note;
    private String checkedInAt;

    public Integer getId() {
        return id;
    }

    public void setId(Integer id) {
        this.id = id;
    }

    public Integer getPlanId() {
        return planId;
    }

    public void setPlanId(Integer planId) {
        this.planId = planId;
    }

    public Integer getPatientUserId() {
        return patientUserId;
    }

    public void setPatientUserId(Integer patientUserId) {
        this.patientUserId = patientUserId;
    }

    public String getMedicationName() {
        return medicationName;
    }

    public void setMedicationName(String medicationName) {
        this.medicationName = medicationName;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getNote() {
        return note;
    }

    public void setNote(String note) {
        this.note = note;
    }

    public String getCheckedInAt() {
        return checkedInAt;
    }

    public void setCheckedInAt(String checkedInAt) {
        this.checkedInAt = checkedInAt;
    }
}
