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
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
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
  is_book VARCHAR(10) NOT NULL DEFAULT '否',
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
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  replied_at DATETIME DEFAULT NULL,
  PRIMARY KEY (id),
  KEY idx_consult_patient (patient_user_id),
  KEY idx_consult_doctor (doctor_user_id),
  CONSTRAINT fk_consult_patient_user FOREIGN KEY (patient_user_id) REFERENCES tb_user(id) ON DELETE CASCADE,
  CONSTRAINT fk_consult_doctor_user FOREIGN KEY (doctor_user_id) REFERENCES tb_user(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
