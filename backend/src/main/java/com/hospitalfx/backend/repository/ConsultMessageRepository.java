package com.hospitalfx.backend.repository;

import com.hospitalfx.backend.model.ConsultMessage;
import java.util.List;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Repository;

@Repository
public class ConsultMessageRepository {

    private static final RowMapper<ConsultMessage> ROW_MAPPER = (rs, rowNum) -> {
        ConsultMessage message = new ConsultMessage();
        message.setId(rs.getInt("id"));
        message.setPatientUserId(rs.getInt("patient_user_id"));
        message.setPatientName(rs.getString("patient_name"));
        message.setDoctorUserId(rs.getInt("doctor_user_id"));
        message.setDoctorName(rs.getString("doctor_name"));
        message.setSymptomSummary(rs.getString("symptom_summary"));
        message.setPatientMessage(rs.getString("patient_message"));
        message.setDoctorReply(rs.getString("doctor_reply"));
        message.setStatus(rs.getString("status"));
        message.setCreatedAt(rs.getString("created_at"));
        message.setRepliedAt(rs.getString("replied_at"));
        return message;
    };

    private final JdbcTemplate jdbcTemplate;

    public ConsultMessageRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public List<ConsultMessage> findAll() {
        return jdbcTemplate.query("SELECT * FROM tb_consult_message ORDER BY id", ROW_MAPPER);
    }

    public ConsultMessage findById(Integer id) {
        return jdbcTemplate.query("SELECT * FROM tb_consult_message WHERE id = ?", ROW_MAPPER, id)
            .stream()
            .findFirst()
            .orElse(null);
    }

    public void create(ConsultMessage message) {
        jdbcTemplate.update("""
            INSERT INTO tb_consult_message(patient_user_id, patient_name, doctor_user_id, doctor_name, symptom_summary, patient_message, doctor_reply, status)
            VALUES (?, ?, ?, ?, ?, ?, '', 'PENDING')
            """,
            message.getPatientUserId(), message.getPatientName(), message.getDoctorUserId(), message.getDoctorName(),
            message.getSymptomSummary(), message.getPatientMessage()
        );
    }

    public void reply(Integer id, String doctorReply) {
        jdbcTemplate.update("""
            UPDATE tb_consult_message
            SET doctor_reply = ?, status = 'REPLIED', replied_at = NOW()
            WHERE id = ?
            """, doctorReply, id);
    }
}
