package com.hospitalfx.backend.repository;

import com.hospitalfx.backend.model.MedicationInventory;
import java.util.List;
import java.util.Optional;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Repository;

@Repository
public class MedicationInventoryRepository {

    private static final RowMapper<MedicationInventory> ROW_MAPPER = (rs, rowNum) -> {
        MedicationInventory inventory = new MedicationInventory();
        inventory.setId(rs.getInt("id"));
        inventory.setMedicationCode(rs.getString("medication_code"));
        inventory.setMedicationName(rs.getString("medication_name"));
        inventory.setSpecification(rs.getString("specification"));
        inventory.setUnit(rs.getString("unit"));
        inventory.setUnitPrice(rs.getBigDecimal("unit_price"));
        inventory.setStockQuantity(rs.getInt("stock_quantity"));
        inventory.setSafeStock(rs.getInt("safe_stock"));
        inventory.setUsageNotes(rs.getString("usage_notes"));
        return inventory;
    };

    private final JdbcTemplate jdbcTemplate;

    public MedicationInventoryRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public List<MedicationInventory> findAll() {
        return jdbcTemplate.query("SELECT * FROM tb_medication_inventory ORDER BY id", ROW_MAPPER);
    }

    public Optional<MedicationInventory> findById(Integer id) {
        return jdbcTemplate.query("SELECT * FROM tb_medication_inventory WHERE id = ?", ROW_MAPPER, id).stream().findFirst();
    }

    public void decreaseStock(Integer id, Integer quantity) {
        jdbcTemplate.update(
            """
            UPDATE tb_medication_inventory
            SET stock_quantity = GREATEST(stock_quantity - ?, 0)
            WHERE id = ?
            """,
            quantity,
            id
        );
    }
}
