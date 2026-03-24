package com.hospitalfx.backend.repository;

import com.hospitalfx.backend.model.DoctorProfile;
import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Repository;

@Repository
public class DoctorRepository {

    private static final RowMapper<DoctorProfile> ROW_MAPPER = (rs, rowNum) -> {
        DoctorProfile doctor = new DoctorProfile();
        doctor.setDoctorId(rs.getString("doctor_id"));
        doctor.setUserId(rs.getInt("user_id"));
        doctor.setUsername(rs.getString("username"));
        doctor.setRealName(rs.getString("realname"));
        doctor.setDeptName(rs.getString("dept_name"));
        doctor.setRegistLevel(rs.getString("regist_level"));
        doctor.setRegistFee(rs.getBigDecimal("registfee"));
        doctor.setEnabled(rs.getObject("enabled") == null ? Boolean.FALSE : rs.getBoolean("enabled"));
        return doctor;
    };

    private final JdbcTemplate jdbcTemplate;

    public DoctorRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public List<DoctorProfile> findAll() {
        return jdbcTemplate.query("""
            SELECT d.id AS doctor_id, u.id AS user_id, u.username, d.realname, d.dept_name, d.regist_level, d.registfee, COALESCE(u.enabled, 0) AS enabled
            FROM tb_doctor d
            LEFT JOIN tb_user u ON u.doctor_id = d.id
            ORDER BY d.id
            """, ROW_MAPPER);
    }

    public Optional<DoctorProfile> findByDoctorId(String doctorId) {
        return jdbcTemplate.query("""
            SELECT d.id AS doctor_id, u.id AS user_id, u.username, d.realname, d.dept_name, d.regist_level, d.registfee, COALESCE(u.enabled, 0) AS enabled
            FROM tb_doctor d
            LEFT JOIN tb_user u ON u.doctor_id = d.id
            WHERE d.id = ?
            """, ROW_MAPPER, doctorId).stream().findFirst();
    }

    public void upsertDoctor(String doctorId, String realName, String deptName, String registLevel) {
        BigDecimal fee = "专家号".equals(registLevel) ? new BigDecimal("35.00") : new BigDecimal("15.00");
        jdbcTemplate.update("""
            INSERT INTO tb_doctor(id, realname, password, dept_name, regist_level, registfee)
            VALUES (?, ?, '123456', ?, ?, ?)
            ON DUPLICATE KEY UPDATE realname = VALUES(realname), dept_name = VALUES(dept_name), regist_level = VALUES(regist_level), registfee = VALUES(registfee)
            """, doctorId, realName, deptName, registLevel, fee);
    }

    public String nextDoctorId() {
        Integer next = jdbcTemplate.queryForObject(
            "SELECT COALESCE(MAX(CAST(SUBSTRING(id, 2) AS UNSIGNED)), 0) + 1 FROM tb_doctor WHERE id LIKE 'K%'",
            Integer.class
        );
        int value = next == null ? 1 : next;
        return "K%03d".formatted(value);
    }

    public void deleteByDoctorId(String doctorId) {
        jdbcTemplate.update("DELETE FROM tb_doctor WHERE id = ?", doctorId);
    }
}
