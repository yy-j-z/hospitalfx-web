CREATE TABLE IF NOT EXISTS tb_doctor (
  id VARCHAR(20) NOT NULL,
  realname VARCHAR(50) NOT NULL,
  password VARCHAR(100) NOT NULL,
  dept_name VARCHAR(50) NOT NULL,
  regist_level VARCHAR(20) NOT NULL,
  registfee DECIMAL(10,2) NOT NULL DEFAULT 0,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS tb_user (
  id INT NOT NULL AUTO_INCREMENT,
  username VARCHAR(50) NOT NULL,
  login_code VARCHAR(20) DEFAULT NULL,
  password VARCHAR(100) NOT NULL,
  real_name VARCHAR(50) NOT NULL,
  role_code VARCHAR(20) NOT NULL DEFAULT 'PATIENT',
  enabled TINYINT(1) NOT NULL DEFAULT 1,
  phone_number VARCHAR(20) DEFAULT NULL,
  doctor_id VARCHAR(20) DEFAULT NULL,
  registered_by_user_id INT DEFAULT NULL,
  registered_by_code VARCHAR(20) DEFAULT NULL,
  registered_by_name VARCHAR(50) DEFAULT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_user_username (username),
  UNIQUE KEY uk_user_login_code (login_code),
  UNIQUE KEY uk_user_phone_number (phone_number),
  UNIQUE KEY uk_user_doctor_id (doctor_id),
  KEY idx_user_role (role_code),
  CONSTRAINT fk_user_doctor FOREIGN KEY (doctor_id) REFERENCES tb_doctor(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS tb_patient_profile (
  user_id INT NOT NULL,
  patient_name VARCHAR(50) NOT NULL,
  gender VARCHAR(10) NOT NULL,
  phone_number VARCHAR(20) DEFAULT NULL,
  card_number VARCHAR(30) NOT NULL,
  birthdate VARCHAR(20) DEFAULT NULL,
  age INT NOT NULL DEFAULT 0,
  home_address VARCHAR(200) DEFAULT NULL,
  PRIMARY KEY (user_id),
  UNIQUE KEY uk_patient_card (card_number),
  CONSTRAINT fk_patient_user FOREIGN KEY (user_id) REFERENCES tb_user(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS tb_registinfo (
  id INT NOT NULL,
  patient_user_id INT DEFAULT NULL,
  realname VARCHAR(50) NOT NULL,
  gender VARCHAR(10) NOT NULL,
  card_number VARCHAR(30) NOT NULL,
  birthdate VARCHAR(20) DEFAULT NULL,
  age INT NOT NULL,
  home_address VARCHAR(200) DEFAULT NULL,
  dept_name VARCHAR(50) NOT NULL,
  doctor_name VARCHAR(50) NOT NULL,
  doctor_id VARCHAR(20) DEFAULT NULL,
  registered_by_user_id INT DEFAULT NULL,
  registered_by_code VARCHAR(20) DEFAULT NULL,
  registered_by_name VARCHAR(50) DEFAULT NULL,
  regist_level VARCHAR(20) NOT NULL,
  is_book VARCHAR(10) NOT NULL DEFAULT 'No',
  registfee DECIMAL(10,2) NOT NULL DEFAULT 0,
  regist_date VARCHAR(20) NOT NULL,
  diagiosis VARCHAR(500) DEFAULT NULL,
  prescrption VARCHAR(1000) DEFAULT NULL,
  drug_price DECIMAL(10,2) NOT NULL DEFAULT 0,
  visit_state INT NOT NULL DEFAULT 1,
  purchase_type INT NOT NULL DEFAULT 0,
  dispensed_by_user_id INT DEFAULT NULL,
  dispensed_by_code VARCHAR(20) DEFAULT NULL,
  dispensed_by_name VARCHAR(50) DEFAULT NULL,
  dispensed_at DATETIME DEFAULT NULL,
  PRIMARY KEY (id),
  KEY idx_regist_card_date (card_number, regist_date),
  KEY idx_regist_state (visit_state),
  KEY idx_regist_doctor (doctor_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS tb_consult_message (
  id INT NOT NULL AUTO_INCREMENT,
  patient_user_id INT NOT NULL,
  patient_name VARCHAR(50) NOT NULL,
  doctor_user_id INT NOT NULL,
  doctor_name VARCHAR(50) NOT NULL,
  symptom_summary VARCHAR(500) NOT NULL,
  patient_message TEXT NOT NULL,
  doctor_reply TEXT DEFAULT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  replied_at DATETIME DEFAULT NULL,
  PRIMARY KEY (id),
  KEY idx_consult_patient (patient_user_id),
  KEY idx_consult_doctor (doctor_user_id),
  CONSTRAINT fk_consult_patient_user FOREIGN KEY (patient_user_id) REFERENCES tb_user(id) ON DELETE CASCADE,
  CONSTRAINT fk_consult_doctor_user FOREIGN KEY (doctor_user_id) REFERENCES tb_user(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS tb_medication_inventory (
  id INT NOT NULL AUTO_INCREMENT,
  medication_code VARCHAR(32) NOT NULL,
  medication_name VARCHAR(80) NOT NULL,
  specification VARCHAR(80) DEFAULT NULL,
  unit VARCHAR(20) NOT NULL DEFAULT 'box',
  unit_price DECIMAL(10,2) NOT NULL DEFAULT 0,
  stock_quantity INT NOT NULL DEFAULT 0,
  safe_stock INT NOT NULL DEFAULT 0,
  usage_notes VARCHAR(255) DEFAULT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uk_medication_code (medication_code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS tb_medication_conflict (
  id INT NOT NULL AUTO_INCREMENT,
  left_medication_name VARCHAR(80) NOT NULL,
  right_medication_name VARCHAR(80) NOT NULL,
  severity VARCHAR(20) NOT NULL DEFAULT 'MEDIUM',
  guidance VARCHAR(255) DEFAULT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uk_medication_conflict_pair (left_medication_name, right_medication_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS tb_medication_plan (
  id INT NOT NULL AUTO_INCREMENT,
  patient_user_id INT NOT NULL,
  registration_id INT NOT NULL,
  medication_inventory_id INT NOT NULL,
  medication_name VARCHAR(80) NOT NULL,
  dosage VARCHAR(50) NOT NULL,
  quantity INT NOT NULL DEFAULT 1,
  frequency_code VARCHAR(20) NOT NULL,
  frequency_label VARCHAR(40) NOT NULL,
  frequency_per_day INT NOT NULL DEFAULT 1,
  unit VARCHAR(20) NOT NULL DEFAULT 'box',
  instructions VARCHAR(255) DEFAULT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
  next_reminder_at DATETIME DEFAULT NULL,
  last_checked_in_at DATETIME DEFAULT NULL,
  created_at DATETIME DEFAULT NULL,
  updated_at DATETIME DEFAULT NULL,
  PRIMARY KEY (id),
  KEY idx_medication_plan_patient (patient_user_id),
  KEY idx_medication_plan_registration (registration_id),
  CONSTRAINT fk_medication_plan_patient FOREIGN KEY (patient_user_id) REFERENCES tb_user(id) ON DELETE CASCADE,
  CONSTRAINT fk_medication_plan_registration FOREIGN KEY (registration_id) REFERENCES tb_registinfo(id) ON DELETE CASCADE,
  CONSTRAINT fk_medication_plan_inventory FOREIGN KEY (medication_inventory_id) REFERENCES tb_medication_inventory(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS tb_medication_checkin (
  id INT NOT NULL AUTO_INCREMENT,
  plan_id INT NOT NULL,
  patient_user_id INT NOT NULL,
  medication_name VARCHAR(80) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'TAKEN',
  note VARCHAR(255) DEFAULT NULL,
  checked_in_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_medication_checkin_plan (plan_id),
  KEY idx_medication_checkin_patient (patient_user_id),
  CONSTRAINT fk_medication_checkin_plan FOREIGN KEY (plan_id) REFERENCES tb_medication_plan(id) ON DELETE CASCADE,
  CONSTRAINT fk_medication_checkin_patient FOREIGN KEY (patient_user_id) REFERENCES tb_user(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
