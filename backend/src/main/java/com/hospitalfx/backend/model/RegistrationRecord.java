package com.hospitalfx.backend.model;

import java.math.BigDecimal;

public class RegistrationRecord {
    private Integer id;
    private Integer patientUserId;
    private String realname;
    private String gender;
    private String cardNumber;
    private String birthdate;
    private Integer age;
    private String homeAddress;
    private String deptName;
    private String doctorName;
    private String doctorId;
    private Integer registeredByUserId;
    private String registeredByCode;
    private String registeredByName;
    private String registLevel;
    private String isBook;
    private BigDecimal registfee;
    private String registDate;
    private String diagiosis;
    private String prescription;
    private BigDecimal drugPrice;
    private Integer visitState;
    private Integer purchaseType;
    private Integer dispensedByUserId;
    private String dispensedByCode;
    private String dispensedByName;
    private String dispensedAt;

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

    public String getRealname() {
        return realname;
    }

    public void setRealname(String realname) {
        this.realname = realname;
    }

    public String getGender() {
        return gender;
    }

    public void setGender(String gender) {
        this.gender = gender;
    }

    public String getCardNumber() {
        return cardNumber;
    }

    public void setCardNumber(String cardNumber) {
        this.cardNumber = cardNumber;
    }

    public String getBirthdate() {
        return birthdate;
    }

    public void setBirthdate(String birthdate) {
        this.birthdate = birthdate;
    }

    public Integer getAge() {
        return age;
    }

    public void setAge(Integer age) {
        this.age = age;
    }

    public String getHomeAddress() {
        return homeAddress;
    }

    public void setHomeAddress(String homeAddress) {
        this.homeAddress = homeAddress;
    }

    public String getDeptName() {
        return deptName;
    }

    public void setDeptName(String deptName) {
        this.deptName = deptName;
    }

    public String getDoctorName() {
        return doctorName;
    }

    public void setDoctorName(String doctorName) {
        this.doctorName = doctorName;
    }

    public String getDoctorId() {
        return doctorId;
    }

    public void setDoctorId(String doctorId) {
        this.doctorId = doctorId;
    }

    public Integer getRegisteredByUserId() {
        return registeredByUserId;
    }

    public void setRegisteredByUserId(Integer registeredByUserId) {
        this.registeredByUserId = registeredByUserId;
    }

    public String getRegisteredByCode() {
        return registeredByCode;
    }

    public void setRegisteredByCode(String registeredByCode) {
        this.registeredByCode = registeredByCode;
    }

    public String getRegisteredByName() {
        return registeredByName;
    }

    public void setRegisteredByName(String registeredByName) {
        this.registeredByName = registeredByName;
    }

    public String getRegistLevel() {
        return registLevel;
    }

    public void setRegistLevel(String registLevel) {
        this.registLevel = registLevel;
    }

    public String getIsBook() {
        return isBook;
    }

    public void setIsBook(String isBook) {
        this.isBook = isBook;
    }

    public BigDecimal getRegistfee() {
        return registfee;
    }

    public void setRegistfee(BigDecimal registfee) {
        this.registfee = registfee;
    }

    public String getRegistDate() {
        return registDate;
    }

    public void setRegistDate(String registDate) {
        this.registDate = registDate;
    }

    public String getDiagiosis() {
        return diagiosis;
    }

    public void setDiagiosis(String diagiosis) {
        this.diagiosis = diagiosis;
    }

    public String getPrescription() {
        return prescription;
    }

    public void setPrescription(String prescription) {
        this.prescription = prescription;
    }

    public BigDecimal getDrugPrice() {
        return drugPrice;
    }

    public void setDrugPrice(BigDecimal drugPrice) {
        this.drugPrice = drugPrice;
    }

    public Integer getVisitState() {
        return visitState;
    }

    public void setVisitState(Integer visitState) {
        this.visitState = visitState;
    }

    public Integer getPurchaseType() {
        return purchaseType;
    }

    public void setPurchaseType(Integer purchaseType) {
        this.purchaseType = purchaseType;
    }

    public Integer getDispensedByUserId() {
        return dispensedByUserId;
    }

    public void setDispensedByUserId(Integer dispensedByUserId) {
        this.dispensedByUserId = dispensedByUserId;
    }

    public String getDispensedByCode() {
        return dispensedByCode;
    }

    public void setDispensedByCode(String dispensedByCode) {
        this.dispensedByCode = dispensedByCode;
    }

    public String getDispensedByName() {
        return dispensedByName;
    }

    public void setDispensedByName(String dispensedByName) {
        this.dispensedByName = dispensedByName;
    }

    public String getDispensedAt() {
        return dispensedAt;
    }

    public void setDispensedAt(String dispensedAt) {
        this.dispensedAt = dispensedAt;
    }
}
