package com.hospitalfx.backend.repository;

import com.hospitalfx.backend.model.MedicationConflict;
import java.util.List;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Repository;

@Repository
public class MedicationConflictRepository {

    private static final RowMapper<MedicationConflict> ROW_MAPPER = (rs, rowNum) -> {
        MedicationConflict conflict = new MedicationConflict();
        conflict.setId(rs.getInt("id"));
        conflict.setLeftMedicationName(rs.getString("left_medication_name"));
        conflict.setRightMedicationName(rs.getString("right_medication_name"));
        conflict.setSeverity(rs.getString("severity"));
        conflict.setGuidance(rs.getString("guidance"));
        return conflict;
    };

    private final JdbcTemplate jdbcTemplate;

    public MedicationConflictRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public List<MedicationConflict> findAll() {
        return jdbcTemplate.query("SELECT * FROM tb_medication_conflict ORDER BY id", ROW_MAPPER);
    }
}
