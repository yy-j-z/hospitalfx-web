package com.hospitalfx.backend.model;

public class MedicationConflict {
    private Integer id;
    private String leftMedicationName;
    private String rightMedicationName;
    private String severity;
    private String guidance;

    public Integer getId() {
        return id;
    }

    public void setId(Integer id) {
        this.id = id;
    }

    public String getLeftMedicationName() {
        return leftMedicationName;
    }

    public void setLeftMedicationName(String leftMedicationName) {
        this.leftMedicationName = leftMedicationName;
    }

    public String getRightMedicationName() {
        return rightMedicationName;
    }

    public void setRightMedicationName(String rightMedicationName) {
        this.rightMedicationName = rightMedicationName;
    }

    public String getSeverity() {
        return severity;
    }

    public void setSeverity(String severity) {
        this.severity = severity;
    }

    public String getGuidance() {
        return guidance;
    }

    public void setGuidance(String guidance) {
        this.guidance = guidance;
    }
}
