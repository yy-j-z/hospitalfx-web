package com.hospitalfx.backend.model;

import java.math.BigDecimal;

public class DoctorProfile {
    private String doctorId;
    private Integer userId;
    private String username;
    private String realName;
    private String deptName;
    private String registLevel;
    private BigDecimal registFee;
    private Boolean enabled;

    public String getDoctorId() {
        return doctorId;
    }

    public void setDoctorId(String doctorId) {
        this.doctorId = doctorId;
    }

    public Integer getUserId() {
        return userId;
    }

    public void setUserId(Integer userId) {
        this.userId = userId;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getRealName() {
        return realName;
    }

    public void setRealName(String realName) {
        this.realName = realName;
    }

    public String getDeptName() {
        return deptName;
    }

    public void setDeptName(String deptName) {
        this.deptName = deptName;
    }

    public String getRegistLevel() {
        return registLevel;
    }

    public void setRegistLevel(String registLevel) {
        this.registLevel = registLevel;
    }

    public BigDecimal getRegistFee() {
        return registFee;
    }

    public void setRegistFee(BigDecimal registFee) {
        this.registFee = registFee;
    }

    public Boolean getEnabled() {
        return enabled;
    }

    public void setEnabled(Boolean enabled) {
        this.enabled = enabled;
    }
}
