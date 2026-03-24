package com.hospitalfx.backend.repository;

import com.hospitalfx.backend.model.RegistrationRecord;
import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Repository;

@Repository
public class RegistrationRepository {

    private static final RowMapper<RegistrationRecord> ROW_MAPPER = (rs, rowNum) -> {
        RegistrationRecord record = new RegistrationRecord();
        record.setId(rs.getInt("id"));
        record.setPatientUserId((Integer) rs.getObject("patient_user_id"));
        record.setRealname(rs.getString("realname"));
        record.setGender(rs.getString("gender"));
        record.setCardNumber(rs.getString("card_number"));
        record.setBirthdate(rs.getString("birthdate"));
        record.setAge(rs.getInt("age"));
        record.setHomeAddress(rs.getString("home_address"));
        record.setDeptName(rs.getString("dept_name"));
        record.setDoctorName(rs.getString("doctor_name"));
        record.setDoctorId(rs.getString("doctor_id"));
        record.setRegisteredByUserId((Integer) rs.getObject("registered_by_user_id"));
        record.setRegisteredByCode(rs.getString("registered_by_code"));
        record.setRegisteredByName(rs.getString("registered_by_name"));
        record.setRegistLevel(rs.getString("regist_level"));
        record.setIsBook(rs.getString("is_book"));
        record.setRegistfee(rs.getBigDecimal("registfee"));
        record.setRegistDate(rs.getString("regist_date"));
        record.setDiagiosis(rs.getString("diagiosis"));
        record.setPrescription(rs.getString("prescrption"));
        record.setDrugPrice(rs.getBigDecimal("drug_price"));
        record.setVisitState(rs.getInt("visit_state"));
        record.setPurchaseType(rs.getInt("purchase_type"));
        record.setDispensedByUserId((Integer) rs.getObject("dispensed_by_user_id"));
        record.setDispensedByCode(rs.getString("dispensed_by_code"));
        record.setDispensedByName(rs.getString("dispensed_by_name"));
        record.setDispensedAt(rs.getString("dispensed_at"));
        return record;
    };

    private final JdbcTemplate jdbcTemplate;

    public RegistrationRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public List<RegistrationRecord> findAll() {
        return jdbcTemplate.query("SELECT * FROM tb_registinfo ORDER BY id", ROW_MAPPER);
    }

    public Optional<RegistrationRecord> findById(Integer id) {
        return jdbcTemplate.query("SELECT * FROM tb_registinfo WHERE id = ?", ROW_MAPPER, id).stream().findFirst();
    }

    public int nextId() {
        Integer next = jdbcTemplate.queryForObject("SELECT COALESCE(MAX(id), 0) + 1 FROM tb_registinfo", Integer.class);
        return next == null ? 1 : next;
    }

    public void create(RegistrationRecord record) {
        jdbcTemplate.update("""
            INSERT INTO tb_registinfo(
                id, patient_user_id, realname, gender, card_number, birthdate, age, home_address,
                dept_name, doctor_name, doctor_id, registered_by_user_id, registered_by_code, registered_by_name,
                regist_level, is_book, registfee, regist_date, diagiosis, prescrption, drug_price,
                visit_state, purchase_type, dispensed_by_user_id, dispensed_by_code, dispensed_by_name, dispensed_at
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            record.getId(), record.getPatientUserId(), record.getRealname(), record.getGender(), record.getCardNumber(),
            record.getBirthdate(), record.getAge(), record.getHomeAddress(), record.getDeptName(), record.getDoctorName(),
            record.getDoctorId(), record.getRegisteredByUserId(), record.getRegisteredByCode(), record.getRegisteredByName(),
            record.getRegistLevel(), record.getIsBook(), record.getRegistfee(), record.getRegistDate(),
            record.getDiagiosis(), record.getPrescription(), record.getDrugPrice(), record.getVisitState(), record.getPurchaseType(),
            record.getDispensedByUserId(), record.getDispensedByCode(), record.getDispensedByName(), record.getDispensedAt()
        );
    }

    public void delete(Integer id) {
        jdbcTemplate.update("DELETE FROM tb_registinfo WHERE id = ?", id);
    }

    public void saveDiagnosis(Integer id, String diagiosis, String prescription, BigDecimal drugPrice, Integer purchaseType) {
        jdbcTemplate.update("""
            UPDATE tb_registinfo
            SET diagiosis = ?, prescrption = ?, drug_price = ?, purchase_type = ?, visit_state = 2
            WHERE id = ?
            """, diagiosis, prescription, drugPrice, purchaseType, id);
    }

    public void markDispensed(Integer id, Integer dispensedByUserId, String dispensedByCode, String dispensedByName) {
        jdbcTemplate.update("""
            UPDATE tb_registinfo
            SET visit_state = 3,
                dispensed_by_user_id = ?,
                dispensed_by_code = ?,
                dispensed_by_name = ?,
                dispensed_at = NOW()
            WHERE id = ?
            """, dispensedByUserId, dispensedByCode, dispensedByName, id);
    }
}
