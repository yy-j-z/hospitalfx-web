package com.hospitalfx.backend.repository;

import com.hospitalfx.backend.model.UserAccount;
import java.sql.PreparedStatement;
import java.sql.Statement;
import java.util.List;
import java.util.Optional;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.jdbc.support.KeyHolder;
import org.springframework.stereotype.Repository;

@Repository
public class UserRepository {

    private static final RowMapper<UserAccount> USER_ROW_MAPPER = (rs, rowNum) -> {
        UserAccount user = new UserAccount();
        user.setId(rs.getInt("id"));
        user.setUsername(rs.getString("username"));
        user.setLoginCode(rs.getString("login_code"));
        user.setPassword(rs.getString("password"));
        user.setRealName(rs.getString("real_name"));
        user.setRoleCode(rs.getString("role_code"));
        user.setEnabled(rs.getBoolean("enabled"));
        user.setPhoneNumber(rs.getString("phone_number"));
        user.setDoctorId(rs.getString("doctor_id"));
        return user;
    };

    private final JdbcTemplate jdbcTemplate;

    public UserRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public List<UserAccount> findAll() {
        return jdbcTemplate.query("SELECT * FROM tb_user ORDER BY id", USER_ROW_MAPPER);
    }

    public Optional<UserAccount> findById(Integer id) {
        return jdbcTemplate.query("SELECT * FROM tb_user WHERE id = ?", USER_ROW_MAPPER, id).stream().findFirst();
    }

    public Optional<UserAccount> findByPhoneNumber(String phoneNumber) {
        return jdbcTemplate.query("SELECT * FROM tb_user WHERE phone_number = ?", USER_ROW_MAPPER, phoneNumber).stream().findFirst();
    }

    public Optional<UserAccount> findByLoginId(String loginId) {
        return jdbcTemplate.query(
            "SELECT * FROM tb_user WHERE login_code = ? OR phone_number = ? ORDER BY id",
            USER_ROW_MAPPER,
            loginId,
            loginId
        ).stream().findFirst();
    }

    public int createPatient(UserAccount user) {
        KeyHolder keyHolder = new GeneratedKeyHolder();
        jdbcTemplate.update(connection -> {
            PreparedStatement ps = connection.prepareStatement(
                "INSERT INTO tb_user(username, login_code, password, real_name, role_code, enabled, phone_number, doctor_id) VALUES (?, NULL, ?, ?, 'PATIENT', 1, ?, NULL)",
                Statement.RETURN_GENERATED_KEYS
            );
            ps.setString(1, user.getUsername());
            ps.setString(2, user.getPassword());
            ps.setString(3, user.getRealName());
            ps.setString(4, user.getPhoneNumber());
            return ps;
        }, keyHolder);
        return keyHolder.getKey().intValue();
    }

    public String nextLoginCode(String prefix) {
        String sql = """
            SELECT COALESCE(MAX(CAST(SUBSTRING(login_code, 2) AS UNSIGNED)), 0) + 1
            FROM tb_user
            WHERE login_code LIKE ?
            """;
        Integer next = jdbcTemplate.queryForObject(sql, Integer.class, prefix + "%");
        int value = next == null ? 1 : next;
        return "%s%03d".formatted(prefix, value);
    }

    public void updateRole(Integer userId, String loginCode, String roleCode, Boolean enabled, String doctorId) {
        jdbcTemplate.update(
            "UPDATE tb_user SET login_code = ?, role_code = ?, enabled = ?, doctor_id = ? WHERE id = ?",
            loginCode, roleCode, enabled, doctorId, userId
        );
    }
}
