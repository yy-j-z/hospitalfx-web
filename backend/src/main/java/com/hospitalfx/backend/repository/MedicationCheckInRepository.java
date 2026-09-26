package com.hospitalfx.backend.repository;

import com.hospitalfx.backend.model.MedicationCheckIn;
import java.util.List;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Repository;

@Repository
public class MedicationCheckInRepository {

    private static final RowMapper<MedicationCheckIn> ROW_MAPPER = (rs, rowNum) -> {
        MedicationCheckIn checkIn = new MedicationCheckIn();
        checkIn.setId(rs.getInt("id"));
        checkIn.setPlanId(rs.getInt("plan_id"));
        checkIn.setPatientUserId(rs.getInt("patient_user_id"));
        checkIn.setMedicationName(rs.getString("medication_name"));
        checkIn.setStatus(rs.getString("status"));
        checkIn.setNote(rs.getString("note"));
        checkIn.setCheckedInAt(rs.getString("checked_in_at"));
        return checkIn;
    };

    private final JdbcTemplate jdbcTemplate;

    public MedicationCheckInRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public List<MedicationCheckIn> findAll() {
        return jdbcTemplate.query("SELECT * FROM tb_medication_checkin ORDER BY checked_in_at DESC, id DESC", ROW_MAPPER);
    }

    public void create(MedicationCheckIn checkIn) {
        jdbcTemplate.update(
            """
            INSERT INTO tb_medication_checkin(plan_id, patient_user_id, medication_name, status, note, checked_in_at)
            VALUES (?, ?, ?, ?, ?, ?)
            """,
            checkIn.getPlanId(),
            checkIn.getPatientUserId(),
            checkIn.getMedicationName(),
            checkIn.getStatus(),
            checkIn.getNote(),
            checkIn.getCheckedInAt()
        );
    }
}
