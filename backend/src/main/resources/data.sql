INSERT INTO tb_doctor (id, realname, password, dept_name, regist_level, registfee) VALUES
('K001', '张华', '123456', '内科', '普通号', 15.00),
('K002', '李敏', '123456', '外科', '专家号', 35.00),
('K003', '王强', '123456', '儿科', '普通号', 20.00),
('K004', '赵凯', '123456', '骨科', '专家号', 40.00),
('K005', '刘洋', '123456', '皮肤科', '普通号', 18.00),
('K006', '陈晨', '123456', '耳鼻喉科', '专家号', 30.00)
ON DUPLICATE KEY UPDATE
realname = VALUES(realname),
password = VALUES(password),
dept_name = VALUES(dept_name),
regist_level = VALUES(regist_level),
registfee = VALUES(registfee);

INSERT INTO tb_user (id, username, login_code, password, real_name, role_code, enabled, phone_number, doctor_id) VALUES
(1, 'admin', 'A001', '123456', '系统管理员', 'ADMIN', 1, NULL, NULL),
(2, 'clerk_chen', 'G001', '123456', '陈小梅', 'CLERK', 1, NULL, NULL),
(3, 'clerk_li', 'G002', '123456', '李晓宁', 'CLERK', 1, NULL, NULL),
(4, 'pharmacy_zhou', 'Y001', '123456', '周建国', 'PHARMACIST', 1, NULL, NULL),
(5, 'pharmacy_sun', 'Y002', '123456', '孙玉兰', 'PHARMACIST', 1, NULL, NULL),
(6, 'doctor_zhang', 'K001', '123456', '张华', 'DOCTOR', 1, NULL, 'K001'),
(7, 'doctor_li', 'K002', '123456', '李敏', 'DOCTOR', 1, NULL, 'K002'),
(8, 'doctor_wang', 'K003', '123456', '王强', 'DOCTOR', 1, NULL, 'K003'),
(9, 'doctor_zhao', 'K004', '123456', '赵凯', 'DOCTOR', 1, NULL, 'K004'),
(10, 'doctor_liu', 'K005', '123456', '刘洋', 'DOCTOR', 1, NULL, 'K005'),
(11, 'doctor_chen', 'K006', '123456', '陈晨', 'DOCTOR', 1, NULL, 'K006'),
(12, 'patient_liu', NULL, '123456', '刘海燕', 'PATIENT', 1, '13800000012', NULL),
(13, 'patient_wang', NULL, '123456', '王晓彤', 'PATIENT', 1, '13800000013', NULL),
(14, 'patient_zhao', NULL, '123456', '赵晨曦', 'PATIENT', 1, '13800000014', NULL),
(15, 'patient_sun', NULL, '123456', '孙浩然', 'PATIENT', 1, '13800000015', NULL)
ON DUPLICATE KEY UPDATE
username = VALUES(username),
login_code = VALUES(login_code),
password = VALUES(password),
real_name = VALUES(real_name),
role_code = VALUES(role_code),
enabled = VALUES(enabled),
phone_number = VALUES(phone_number),
doctor_id = VALUES(doctor_id);

INSERT INTO tb_patient_profile (user_id, patient_name, gender, card_number, birthdate, age, home_address) VALUES
(12, '刘海燕', '女', '110101199001010011', '1990-01-01', 36, '北京市海淀区西二旗'),
(13, '王晓彤', '女', '110101199202023322', '1992-02-02', 34, '北京市朝阳区望京'),
(14, '赵晨曦', '男', '110101198803038899', '1988-03-03', 38, '北京市丰台区科技园'),
(15, '孙浩然', '男', '110101199511115678', '1995-11-11', 30, '北京市通州区梨园')
ON DUPLICATE KEY UPDATE
patient_name = VALUES(patient_name),
gender = VALUES(gender),
card_number = VALUES(card_number),
birthdate = VALUES(birthdate),
age = VALUES(age),
home_address = VALUES(home_address);

INSERT INTO tb_registinfo (
  id, patient_user_id, realname, gender, card_number, birthdate, age, home_address,
  dept_name, doctor_name, doctor_id, regist_level, is_book, registfee, regist_date,
  diagiosis, prescrption, drug_price, visit_state, purchase_type
) VALUES
(1, 12, '刘海燕', '女', '110101199001010011', '1990-01-01', 36, '北京市海淀区西二旗', '内科', '张华', 'K001', '普通号', '否', 15.00, '2026-03-24', NULL, NULL, 0.00, 1, 0),
(2, 13, '王晓彤', '女', '110101199202023322', '1992-02-02', 34, '北京市朝阳区望京', '外科', '李敏', 'K002', '专家号', '是', 36.00, '2026-03-24', '上呼吸道感染', '阿莫西林胶囊', 48.50, 2, 0),
(3, 14, '赵晨曦', '男', '110101198803038899', '1988-03-03', 38, '北京市丰台区科技园', '儿科', '王强', 'K003', '普通号', '否', 20.00, '2026-03-24', '轻度胃炎', '奥美拉唑', 32.00, 3, 1),
(4, 15, '孙浩然', '男', '110101199511115678', '1995-11-11', 30, '北京市通州区梨园', '骨科', '赵凯', 'K004', '专家号', '否', 40.00, '2026-03-24', NULL, NULL, 0.00, 1, 0),
(5, NULL, '陈丽娜', '女', '110101199408087654', '1994-08-08', 31, '北京市昌平区回龙观', '皮肤科', '刘洋', 'K005', '普通号', '否', 18.00, '2026-03-24', '过敏性皮疹', '氯雷他定片', 26.00, 2, 0),
(6, NULL, '周子轩', '男', '110101199709096543', '1997-09-09', 28, '北京市石景山区', '耳鼻喉科', '陈晨', 'K006', '专家号', '是', 31.00, '2026-03-24', '急性咽炎', '蒲地蓝消炎片', 35.00, 3, 0)
ON DUPLICATE KEY UPDATE
patient_user_id = VALUES(patient_user_id),
realname = VALUES(realname),
gender = VALUES(gender),
card_number = VALUES(card_number),
birthdate = VALUES(birthdate),
age = VALUES(age),
home_address = VALUES(home_address),
dept_name = VALUES(dept_name),
doctor_name = VALUES(doctor_name),
doctor_id = VALUES(doctor_id),
regist_level = VALUES(regist_level),
is_book = VALUES(is_book),
registfee = VALUES(registfee),
regist_date = VALUES(regist_date),
diagiosis = VALUES(diagiosis),
prescrption = VALUES(prescrption),
drug_price = VALUES(drug_price),
visit_state = VALUES(visit_state),
purchase_type = VALUES(purchase_type);

INSERT INTO tb_consult_message (
  id, patient_user_id, patient_name, doctor_user_id, doctor_name, symptom_summary,
  patient_message, doctor_reply, status, created_at, replied_at
) VALUES
(1, 12, '刘海燕', 6, '张华', '咳嗽、低热 2 天', '医生您好，我最近低热伴咳嗽，需要尽快来院检查吗？', '建议尽快来院就诊，如出现呼吸困难或持续高热请直接前往急诊。', 'REPLIED', '2026-03-24 08:30:00', '2026-03-24 09:10:00'),
(2, 13, '王晓彤', 7, '李敏', '右侧肩膀疼痛 1 周', '最近抬手时肩膀疼痛，是否需要先拍片再来门诊？', '建议先来门诊检查，必要时再安排影像检查，这两天内就诊更合适。', 'REPLIED', '2026-03-24 10:15:00', '2026-03-24 11:00:00'),
(3, 14, '赵晨曦', 8, '王强', '胃胀、反酸 3 天', '饭后反酸比较明显，需要挂消化内科还是先吃药观察？', NULL, 'PENDING', '2026-03-24 11:35:00', NULL),
(4, 15, '孙浩然', 9, '赵凯', '膝盖扭伤后疼痛', '昨天运动后膝盖疼，走路有点困难，是否需要马上来医院？', NULL, 'PENDING', '2026-03-24 12:20:00', NULL)
ON DUPLICATE KEY UPDATE
patient_name = VALUES(patient_name),
doctor_name = VALUES(doctor_name),
symptom_summary = VALUES(symptom_summary),
patient_message = VALUES(patient_message),
doctor_reply = VALUES(doctor_reply),
status = VALUES(status),
created_at = VALUES(created_at),
replied_at = VALUES(replied_at);

UPDATE tb_registinfo
SET registered_by_user_id = 2,
    registered_by_code = 'G001',
    registered_by_name = '陈小梅'
WHERE id IN (1, 2, 5);

UPDATE tb_registinfo
SET registered_by_user_id = 3,
    registered_by_code = 'G002',
    registered_by_name = '李晓宁'
WHERE id IN (3, 4, 6);

UPDATE tb_registinfo
SET dispensed_by_user_id = 4,
    dispensed_by_code = 'Y001',
    dispensed_by_name = '周建国',
    dispensed_at = '2026-03-24 11:30:00'
WHERE id = 2;

UPDATE tb_registinfo
SET dispensed_by_user_id = 5,
    dispensed_by_code = 'Y002',
    dispensed_by_name = '孙玉兰',
    dispensed_at = '2026-03-24 12:40:00'
WHERE id = 6;
