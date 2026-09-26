package com.hospitalfx.backend.model;

public class MedicationPlan {
    private Integer id;
    private Integer patientUserId;
    private Integer registrationId;
    private Integer medicationInventoryId;
    private String medicationName;
    private String dosage;
    private Integer quantity;
    private String frequencyCode;
    private String frequencyLabel;
    private Integer frequencyPerDay;
    private String unit;
    private String instructions;
    private String status;
    private String nextReminderAt;
    private String lastCheckedInAt;
    private String createdAt;
    private String updatedAt;

    public Integer getId() {
        return id;
    }

    public void setId(Integer id) {
        this.id = id;
    }

    public Integer getPatientUserId() {
        return patientUserId;
    }

    public void setPatientUserId(Integer patientUserId) {
        this.patientUserId = patientUserId;
    }

    public Integer getRegistrationId() {
        return registrationId;
    }

    public void setRegistrationId(Integer registrationId) {
        this.registrationId = registrationId;
    }

    public Integer getMedicationInventoryId() {
        return medicationInventoryId;
    }

    public void setMedicationInventoryId(Integer medicationInventoryId) {
        this.medicationInventoryId = medicationInventoryId;
    }

    public String getMedicationName() {
        return medicationName;
    }

    public void setMedicationName(String medicationName) {
        this.medicationName = medicationName;
    }

    public String getDosage() {
        return dosage;
    }

    public void setDosage(String dosage) {
        this.dosage = dosage;
    }

    public Integer getQuantity() {
        return quantity;
    }

    public void setQuantity(Integer quantity) {
        this.quantity = quantity;
    }

    public String getFrequencyCode() {
        return frequencyCode;
    }

    public void setFrequencyCode(String frequencyCode) {
        this.frequencyCode = frequencyCode;
    }

    public String getFrequencyLabel() {
        return frequencyLabel;
    }

    public void setFrequencyLabel(String frequencyLabel) {
        this.frequencyLabel = frequencyLabel;
    }

    public Integer getFrequencyPerDay() {
        return frequencyPerDay;
    }

    public void setFrequencyPerDay(Integer frequencyPerDay) {
        this.frequencyPerDay = frequencyPerDay;
    }

    public String getUnit() {
        return unit;
    }

    public void setUnit(String unit) {
        this.unit = unit;
    }

    public String getInstructions() {
        return instructions;
    }

    public void setInstructions(String instructions) {
        this.instructions = instructions;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getNextReminderAt() {
        return nextReminderAt;
    }

    public void setNextReminderAt(String nextReminderAt) {
        this.nextReminderAt = nextReminderAt;
    }

    public String getLastCheckedInAt() {
        return lastCheckedInAt;
    }

    public void setLastCheckedInAt(String lastCheckedInAt) {
        this.lastCheckedInAt = lastCheckedInAt;
    }

    public String getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(String createdAt) {
        this.createdAt = createdAt;
    }

    public String getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(String updatedAt) {
        this.updatedAt = updatedAt;
    }
}
