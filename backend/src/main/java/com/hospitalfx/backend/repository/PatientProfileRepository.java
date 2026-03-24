package com.hospitalfx.backend.repository;

import com.hospitalfx.backend.model.PatientProfile;
import java.util.List;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Repository;

@Repository
public class PatientProfileRepository {

    private static final RowMapper<PatientProfile> ROW_MAPPER = (rs, rowNum) -> {
        PatientProfile profile = new PatientProfile();
        profile.setUserId(rs.getInt("user_id"));
        profile.setPatientName(rs.getString("patient_name"));
        profile.setGender(rs.getString("gender"));
        profile.setCardNumber(rs.getString("card_number"));
        profile.setBirthdate(rs.getString("birthdate"));
        profile.setAge(rs.getInt("age"));
        profile.setHomeAddress(rs.getString("home_address"));
        return profile;
    };

    private final JdbcTemplate jdbcTemplate;

    public PatientProfileRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public List<PatientProfile> findAll() {
        return jdbcTemplate.query("SELECT * FROM tb_patient_profile ORDER BY user_id", ROW_MAPPER);
    }

    public void save(PatientProfile profile) {
        jdbcTemplate.update("""
            INSERT INTO tb_patient_profile(user_id, patient_name, gender, card_number, birthdate, age, home_address)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            """, profile.getUserId(), profile.getPatientName(), profile.getGender(), profile.getCardNumber(), profile.getBirthdate(), profile.getAge(), profile.getHomeAddress());
    }
}
