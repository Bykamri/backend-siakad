-- ==========================================
-- 1. INSERT DATA FAKULTAS (3 Fakultas)
-- ==========================================
INSERT INTO `fakultas` (`kode_fakultas`, `nama_fakultas`, `created_at`) VALUES
('1', 'Fakultas Teknik', CURRENT_TIMESTAMP(3)),
('2', 'Fakultas Ekonomi dan Bisnis', CURRENT_TIMESTAMP(3)),
('3', 'Fakultas Ilmu Budaya', CURRENT_TIMESTAMP(3));

-- ==========================================
-- 2. INSERT DATA PRODI (8 Prodi)
-- ==========================================
INSERT INTO `prodi` (`kode_prodi`, `nama_prodi`, `kode_fakultas`, `created_at`) VALUES
('11', 'Teknik Informatika', '1', CURRENT_TIMESTAMP(3)),
('12', 'Teknik Sipil', '1', CURRENT_TIMESTAMP(3)),
('13', 'Teknik Arsitektur', '1', CURRENT_TIMESTAMP(3)),
('21', 'Manajemen', '2', CURRENT_TIMESTAMP(3)),
('22', 'Akuntansi', '2', CURRENT_TIMESTAMP(3)),
('23', 'Ekonomi Pembangunan', '2', CURRENT_TIMESTAMP(3)),
('31', 'Sastra Inggris', '3', CURRENT_TIMESTAMP(3)),
('32', 'Sastra Jepang', '3', CURRENT_TIMESTAMP(3));

-- ==========================================
-- 3. INSERT DATA DOSEN (35 Dosen)
-- ==========================================
INSERT INTO `dosen` (`kodedsn`, `nama_dosen`, `tgl_lahir`, `kode_prodi`, `jenis_kelamin`, `status_aktif`, `updated_at`) VALUES
('D001', 'Dr. Andi Budianto, M.T.', '1975-01-15', '11', 'L', 1, CURRENT_TIMESTAMP(3)),
('D002', 'Siti Aminah, M.Kom.', '1980-05-20', '11', 'P', 1, CURRENT_TIMESTAMP(3)),
('D003', 'Rudi Haryanto, S.T., M.Kom.', '1985-08-10', '11', 'L', 1, CURRENT_TIMESTAMP(3)),
('D004', 'Dina Mariana, M.T.', '1978-11-22', '11', 'P', 1, CURRENT_TIMESTAMP(3)),
('D005', 'Eko Prasetyo, Ph.D.', '1970-12-05', '11', 'L', 1, CURRENT_TIMESTAMP(3)),
('D006', 'Ir. Budi Santoso, M.T.', '1965-03-30', '12', 'L', 1, CURRENT_TIMESTAMP(3)),
('D007', 'Rina Wulandari, S.T., M.Eng.', '1982-07-12', '12', 'P', 1, CURRENT_TIMESTAMP(3)),
('D008', 'Hendra Gunawan, M.T.', '1979-09-25', '12', 'L', 1, CURRENT_TIMESTAMP(3)),
('D009', 'Maya Sari, Ph.D.', '1981-02-14', '12', 'P', 1, CURRENT_TIMESTAMP(3)),
('D010', 'Agus Setiawan, S.T., M.T.', '1986-06-18', '13', 'L', 1, CURRENT_TIMESTAMP(3)),
('D011', 'Dewi Lestari, M.Ars.', '1984-04-09', '13', 'P', 1, CURRENT_TIMESTAMP(3)),
('D012', 'Iwan Fals, S.T., M.T.', '1972-10-10', '13', 'L', 1, CURRENT_TIMESTAMP(3)),
('D013', 'Ratna Sari, M.Ars.', '1983-01-25', '13', 'P', 1, CURRENT_TIMESTAMP(3)),
('D014', 'Dr. Yudi Hartono, S.E., M.M.', '1970-05-11', '21', 'L', 1, CURRENT_TIMESTAMP(3)),
('D015', 'Sri Rahayu, M.M.', '1975-08-19', '21', 'P', 1, CURRENT_TIMESTAMP(3)),
('D016', 'Bima Sakti, S.E., M.M.', '1980-12-01', '21', 'L', 1, CURRENT_TIMESTAMP(3)),
('D017', 'Ayu Permatasari, M.M.', '1985-03-15', '21', 'P', 1, CURRENT_TIMESTAMP(3)),
('D018', 'Reza Pratama, Ph.D.', '1976-06-20', '21', 'L', 1, CURRENT_TIMESTAMP(3)),
('D019', 'Prof. Dedi Suherman, M.Si.', '1960-11-11', '22', 'L', 1, CURRENT_TIMESTAMP(3)),
('D020', 'Nurul Hidayah, M.Ak.', '1982-09-09', '22', 'P', 1, CURRENT_TIMESTAMP(3)),
('D021', 'Arif Rahman, S.E., M.Ak.', '1984-02-28', '22', 'L', 1, CURRENT_TIMESTAMP(3)),
('D022', 'Rina Melati, M.Ak.', '1988-07-07', '22', 'P', 1, CURRENT_TIMESTAMP(3)),
('D023', 'Surya Saputra, S.E., M.Si.', '1974-10-31', '23', 'L', 1, CURRENT_TIMESTAMP(3)),
('D024', 'Fitriani, M.Ec.Dev.', '1986-12-12', '23', 'P', 1, CURRENT_TIMESTAMP(3)),
('D025', 'Dian Pratiwi, Ph.D.', '1981-05-05', '23', 'P', 1, CURRENT_TIMESTAMP(3)),
('D026', 'Fajar Alfian, S.E., M.E.', '1989-08-08', '23', 'L', 1, CURRENT_TIMESTAMP(3)),
('D027', 'Dr. Apriyani Rahayu, M.Hum.', '1973-04-14', '31', 'P', 1, CURRENT_TIMESTAMP(3)),
('D028', 'Kevin Sanjaya, S.S., M.A.', '1985-01-01', '31', 'L', 1, CURRENT_TIMESTAMP(3)),
('D029', 'Greysia Polii, M.A.', '1980-03-03', '31', 'P', 1, CURRENT_TIMESTAMP(3)),
('D030', 'Marcus Gideon, M.Hum.', '1983-06-06', '31', 'L', 1, CURRENT_TIMESTAMP(3)),
('D031', 'Jonatan Christie, M.A.', '1987-09-17', '31', 'L', 1, CURRENT_TIMESTAMP(3)),
('D032', 'Anthony Ginting, M.Hum.', '1986-11-21', '32', 'L', 1, CURRENT_TIMESTAMP(3)),
('D033', 'Hendra Setiawan, S.S., M.A.', '1978-02-02', '32', 'L', 1, CURRENT_TIMESTAMP(3)),
('D034', 'Nitya Krishinda, M.A.', '1984-12-25', '32', 'P', 1, CURRENT_TIMESTAMP(3)),
('D035', 'Moh Ahsan, Ph.D.', '1982-04-20', '32', 'L', 1, CURRENT_TIMESTAMP(3));

-- ==========================================
-- 4. INSERT DATA MAHASISWA (35 Mahasiswa)
-- Sesuai format backend: 1 + kode_prodi(2) + angkatan(2) + urut(3)
-- ==========================================
INSERT INTO `mahasiswa` (`nim`, `nama`, `tgl_lahir`, `jenis_kelamin`, `status_mhs`, `kode_prodi`, `angkatan`, `kodedsn_wali`, `updated_at`) VALUES
('11124001', 'Ahmad Ridwan', '2005-01-10', 'L', 'aktif', '11', 2024, 'D001', CURRENT_TIMESTAMP(3)),
('11124002', 'Bella Safira', '2005-02-15', 'P', 'aktif', '11', 2024, 'D002', CURRENT_TIMESTAMP(3)),
('11124003', 'Cahya Kamila', '2006-03-20', 'P', 'aktif', '11', 2024, 'D003', CURRENT_TIMESTAMP(3)),
('11124004', 'Deni Saputra', '2004-04-25', 'L', 'aktif', '11', 2024, 'D004', CURRENT_TIMESTAMP(3)),
('11124005', 'Eka Putri', '2005-05-30', 'P', 'aktif', '11', 2024, 'D005', CURRENT_TIMESTAMP(3)),

('11224001', 'Faisal Akbar', '2004-06-05', 'L', 'aktif', '12', 2024, 'D006', CURRENT_TIMESTAMP(3)),
('11224002', 'Gita Gutawa', '2005-07-10', 'P', 'aktif', '12', 2024, 'D007', CURRENT_TIMESTAMP(3)),
('11224003', 'Hadi Sucipto', '2006-08-15', 'L', 'aktif', '12', 2024, 'D008', CURRENT_TIMESTAMP(3)),
('11224004', 'Intan Nuraini', '2005-09-20', 'P', 'aktif', '12', 2024, 'D009', CURRENT_TIMESTAMP(3)),

('11324001', 'Joko Susilo', '2004-10-25', 'L', 'aktif', '13', 2024, 'D010', CURRENT_TIMESTAMP(3)),
('11324002', 'Kartika Sari', '2005-11-30', 'P', 'aktif', '13', 2024, 'D011', CURRENT_TIMESTAMP(3)),
('11324003', 'Lukman Hakim', '2006-12-05', 'L', 'aktif', '13', 2024, 'D012', CURRENT_TIMESTAMP(3)),
('11324004', 'Mila Karmila', '2005-01-10', 'P', 'aktif', '13', 2024, 'D013', CURRENT_TIMESTAMP(3)),

('12124001', 'Nanda Riski', '2004-02-15', 'L', 'aktif', '21', 2024, 'D014', CURRENT_TIMESTAMP(3)),
('12124002', 'Olivia Lavenia', '2005-03-20', 'P', 'aktif', '21', 2024, 'D015', CURRENT_TIMESTAMP(3)),
('12124003', 'Putra Pratama', '2006-04-25', 'L', 'aktif', '21', 2024, 'D016', CURRENT_TIMESTAMP(3)),
('12124004', 'Qori Aisyah', '2005-05-30', 'P', 'aktif', '21', 2024, 'D017', CURRENT_TIMESTAMP(3)),
('12124005', 'Rizky Billar', '2004-06-05', 'L', 'aktif', '21', 2024, 'D018', CURRENT_TIMESTAMP(3)),

('12224001', 'Siska Amelia', '2005-07-10', 'P', 'aktif', '22', 2024, 'D019', CURRENT_TIMESTAMP(3)),
('12224002', 'Tegar Septian', '2006-08-15', 'L', 'aktif', '22', 2024, 'D020', CURRENT_TIMESTAMP(3)),
('12224003', 'Umar Kayam', '2005-09-20', 'L', 'aktif', '22', 2024, 'D021', CURRENT_TIMESTAMP(3)),
('12224004', 'Vina Panduwinata', '2004-10-25', 'P', 'aktif', '22', 2024, 'D022', CURRENT_TIMESTAMP(3)),

('12324001', 'Wira Satria', '2005-11-30', 'L', 'aktif', '23', 2024, 'D023', CURRENT_TIMESTAMP(3)),
('12324002', 'Xena Aprilia', '2006-12-05', 'P', 'aktif', '23', 2024, 'D024', CURRENT_TIMESTAMP(3)),
('12324003', 'Yusuf Mansur', '2005-01-10', 'L', 'aktif', '23', 2024, 'D025', CURRENT_TIMESTAMP(3)),
('12324004', 'Zahra Anisa', '2004-02-15', 'P', 'aktif', '23', 2024, 'D026', CURRENT_TIMESTAMP(3)),

('13124001', 'Andika Kangen', '2005-03-20', 'L', 'aktif', '31', 2024, 'D027', CURRENT_TIMESTAMP(3)),
('13124002', 'Bunga Citra', '2006-04-25', 'P', 'aktif', '31', 2024, 'D028', CURRENT_TIMESTAMP(3)),
('13124003', 'Chandra Liow', '2005-05-30', 'L', 'aktif', '31', 2024, 'D029', CURRENT_TIMESTAMP(3)),
('13124004', 'Dara Rizki', '2004-06-05', 'P', 'aktif', '31', 2024, 'D030', CURRENT_TIMESTAMP(3)),
('13124005', 'Erwin Gutawa', '2005-07-10', 'L', 'aktif', '31', 2024, 'D031', CURRENT_TIMESTAMP(3)),

('13224001', 'Farah Quinn', '2006-08-15', 'P', 'aktif', '32', 2024, 'D032', CURRENT_TIMESTAMP(3)),
('13224002', 'Gilang Dirga', '2005-09-20', 'L', 'aktif', '32', 2024, 'D033', CURRENT_TIMESTAMP(3)),
('13224003', 'Hesti Purwadinata', '2004-10-25', 'P', 'aktif', '32', 2024, 'D034', CURRENT_TIMESTAMP(3)),
('13224004', 'Irfan Hakim', '2005-11-30', 'L', 'aktif', '32', 2024, 'D035', CURRENT_TIMESTAMP(3));

-- ==========================================
-- 5. INSERT DATA USERS (71 Users termasuk Admin)
-- Password di-hash menggunakan bcrypt dari string 'untag455'
-- Hash ini siap pakai sehingga Anda bisa langsung POST /auth/login
-- ==========================================
INSERT INTO `users` (`username`, `password`, `role`, `nim`, `kodedsn`, `is_active`, `updated_at`) VALUES
-- AKUN ADMIN (Username: admin, Password: untag455)
('admin', '$2a$10$wE96I0p9m2kPq9X7Jq4h7uX.H3sL3wB6/fR0m8aE5u9/O2QxR0/M2', 'admin', NULL, NULL, 1, CURRENT_TIMESTAMP(3)),

-- AKUN DOSEN (Username = kodedsn, Password: untag455)
('D001', '$2a$10$wE96I0p9m2kPq9X7Jq4h7uX.H3sL3wB6/fR0m8aE5u9/O2QxR0/M2', 'dosen', NULL, 'D001', 1, CURRENT_TIMESTAMP(3)),
('D002', '$2a$10$wE96I0p9m2kPq9X7Jq4h7uX.H3sL3wB6/fR0m8aE5u9/O2QxR0/M2', 'dosen', NULL, 'D002', 1, CURRENT_TIMESTAMP(3)),
('D003', '$2a$10$wE96I0p9m2kPq9X7Jq4h7uX.H3sL3wB6/fR0m8aE5u9/O2QxR0/M2', 'dosen', NULL, 'D003', 1, CURRENT_TIMESTAMP(3)),
('D004', '$2a$10$wE96I0p9m2kPq9X7Jq4h7uX.H3sL3wB6/fR0m8aE5u9/O2QxR0/M2', 'dosen', NULL, 'D004', 1, CURRENT_TIMESTAMP(3)),
('D005', '$2a$10$wE96I0p9m2kPq9X7Jq4h7uX.H3sL3wB6/fR0m8aE5u9/O2QxR0/M2', 'dosen', NULL, 'D005', 1, CURRENT_TIMESTAMP(3)),
('D006', '$2a$10$wE96I0p9m2kPq9X7Jq4h7uX.H3sL3wB6/fR0m8aE5u9/O2QxR0/M2', 'dosen', NULL, 'D006', 1, CURRENT_TIMESTAMP(3)),
('D007', '$2a$10$wE96I0p9m2kPq9X7Jq4h7uX.H3sL3wB6/fR0m8aE5u9/O2QxR0/M2', 'dosen', NULL, 'D007', 1, CURRENT_TIMESTAMP(3)),
('D008', '$2a$10$wE96I0p9m2kPq9X7Jq4h7uX.H3sL3wB6/fR0m8aE5u9/O2QxR0/M2', 'dosen', NULL, 'D008', 1, CURRENT_TIMESTAMP(3)),
('D009', '$2a$10$wE96I0p9m2kPq9X7Jq4h7uX.H3sL3wB6/fR0m8aE5u9/O2QxR0/M2', 'dosen', NULL, 'D009', 1, CURRENT_TIMESTAMP(3)),
('D010', '$2a$10$wE96I0p9m2kPq9X7Jq4h7uX.H3sL3wB6/fR0m8aE5u9/O2QxR0/M2', 'dosen', NULL, 'D010', 1, CURRENT_TIMESTAMP(3)),
('D011', '$2a$10$wE96I0p9m2kPq9X7Jq4h7uX.H3sL3wB6/fR0m8aE5u9/O2QxR0/M2', 'dosen', NULL, 'D011', 1, CURRENT_TIMESTAMP(3)),
('D012', '$2a$10$wE96I0p9m2kPq9X7Jq4h7uX.H3sL3wB6/fR0m8aE5u9/O2QxR0/M2', 'dosen', NULL, 'D012', 1, CURRENT_TIMESTAMP(3)),
('D013', '$2a$10$wE96I0p9m2kPq9X7Jq4h7uX.H3sL3wB6/fR0m8aE5u9/O2QxR0/M2', 'dosen', NULL, 'D013', 1, CURRENT_TIMESTAMP(3)),
('D014', '$2a$10$wE96I0p9m2kPq9X7Jq4h7uX.H3sL3wB6/fR0m8aE5u9/O2QxR0/M2', 'dosen', NULL, 'D014', 1, CURRENT_TIMESTAMP(3)),
('D015', '$2a$10$wE96I0p9m2kPq9X7Jq4h7uX.H3sL3wB6/fR0m8aE5u9/O2QxR0/M2', 'dosen', NULL, 'D015', 1, CURRENT_TIMESTAMP(3)),
('D016', '$2a$10$wE96I0p9m2kPq9X7Jq4h7uX.H3sL3wB6/fR0m8aE5u9/O2QxR0/M2', 'dosen', NULL, 'D016', 1, CURRENT_TIMESTAMP(3)),
('D017', '$2a$10$wE96I0p9m2kPq9X7Jq4h7uX.H3sL3wB6/fR0m8aE5u9/O2QxR0/M2', 'dosen', NULL, 'D017', 1, CURRENT_TIMESTAMP(3)),
('D018', '$2a$10$wE96I0p9m2kPq9X7Jq4h7uX.H3sL3wB6/fR0m8aE5u9/O2QxR0/M2', 'dosen', NULL, 'D018', 1, CURRENT_TIMESTAMP(3)),
('D019', '$2a$10$wE96I0p9m2kPq9X7Jq4h7uX.H3sL3wB6/fR0m8aE5u9/O2QxR0/M2', 'dosen', NULL, 'D019', 1, CURRENT_TIMESTAMP(3)),
('D020', '$2a$10$wE96I0p9m2kPq9X7Jq4h7uX.H3sL3wB6/fR0m8aE5u9/O2QxR0/M2', 'dosen', NULL, 'D020', 1, CURRENT_TIMESTAMP(3)),
('D021', '$2a$10$wE96I0p9m2kPq9X7Jq4h7uX.H3sL3wB6/fR0m8aE5u9/O2QxR0/M2', 'dosen', NULL, 'D021', 1, CURRENT_TIMESTAMP(3)),
('D022', '$2a$10$wE96I0p9m2kPq9X7Jq4h7uX.H3sL3wB6/fR0m8aE5u9/O2QxR0/M2', 'dosen', NULL, 'D022', 1, CURRENT_TIMESTAMP(3)),
('D023', '$2a$10$wE96I0p9m2kPq9X7Jq4h7uX.H3sL3wB6/fR0m8aE5u9/O2QxR0/M2', 'dosen', NULL, 'D023', 1, CURRENT_TIMESTAMP(3)),
('D024', '$2a$10$wE96I0p9m2kPq9X7Jq4h7uX.H3sL3wB6/fR0m8aE5u9/O2QxR0/M2', 'dosen', NULL, 'D024', 1, CURRENT_TIMESTAMP(3)),
('D025', '$2a$10$wE96I0p9m2kPq9X7Jq4h7uX.H3sL3wB6/fR0m8aE5u9/O2QxR0/M2', 'dosen', NULL, 'D025', 1, CURRENT_TIMESTAMP(3)),
('D026', '$2a$10$wE96I0p9m2kPq9X7Jq4h7uX.H3sL3wB6/fR0m8aE5u9/O2QxR0/M2', 'dosen', NULL, 'D026', 1, CURRENT_TIMESTAMP(3)),
('D027', '$2a$10$wE96I0p9m2kPq9X7Jq4h7uX.H3sL3wB6/fR0m8aE5u9/O2QxR0/M2', 'dosen', NULL, 'D027', 1, CURRENT_TIMESTAMP(3)),
('D028', '$2a$10$wE96I0p9m2kPq9X7Jq4h7uX.H3sL3wB6/fR0m8aE5u9/O2QxR0/M2', 'dosen', NULL, 'D028', 1, CURRENT_TIMESTAMP(3)),
('D029', '$2a$10$wE96I0p9m2kPq9X7Jq4h7uX.H3sL3wB6/fR0m8aE5u9/O2QxR0/M2', 'dosen', NULL, 'D029', 1, CURRENT_TIMESTAMP(3)),
('D030', '$2a$10$wE96I0p9m2kPq9X7Jq4h7uX.H3sL3wB6/fR0m8aE5u9/O2QxR0/M2', 'dosen', NULL, 'D030', 1, CURRENT_TIMESTAMP(3)),
('D031', '$2a$10$wE96I0p9m2kPq9X7Jq4h7uX.H3sL3wB6/fR0m8aE5u9/O2QxR0/M2', 'dosen', NULL, 'D031', 1, CURRENT_TIMESTAMP(3)),
('D032', '$2a$10$wE96I0p9m2kPq9X7Jq4h7uX.H3sL3wB6/fR0m8aE5u9/O2QxR0/M2', 'dosen', NULL, 'D032', 1, CURRENT_TIMESTAMP(3)),
('D033', '$2a$10$wE96I0p9m2kPq9X7Jq4h7uX.H3sL3wB6/fR0m8aE5u9/O2QxR0/M2', 'dosen', NULL, 'D033', 1, CURRENT_TIMESTAMP(3)),
('D034', '$2a$10$wE96I0p9m2kPq9X7Jq4h7uX.H3sL3wB6/fR0m8aE5u9/O2QxR0/M2', 'dosen', NULL, 'D034', 1, CURRENT_TIMESTAMP(3)),
('D035', '$2a$10$wE96I0p9m2kPq9X7Jq4h7uX.H3sL3wB6/fR0m8aE5u9/O2QxR0/M2', 'dosen', NULL, 'D035', 1, CURRENT_TIMESTAMP(3)),

-- AKUN MAHASISWA (Username = NIM, Password: untag455)
('11124001', '$2a$10$wE96I0p9m2kPq9X7Jq4h7uX.H3sL3wB6/fR0m8aE5u9/O2QxR0/M2', 'mahasiswa', '11124001', NULL, 1, CURRENT_TIMESTAMP(3)),
('11124002', '$2a$10$wE96I0p9m2kPq9X7Jq4h7uX.H3sL3wB6/fR0m8aE5u9/O2QxR0/M2', 'mahasiswa', '11124002', NULL, 1, CURRENT_TIMESTAMP(3)),
('11124003', '$2a$10$wE96I0p9m2kPq9X7Jq4h7uX.H3sL3wB6/fR0m8aE5u9/O2QxR0/M2', 'mahasiswa', '11124003', NULL, 1, CURRENT_TIMESTAMP(3)),
('11124004', '$2a$10$wE96I0p9m2kPq9X7Jq4h7uX.H3sL3wB6/fR0m8aE5u9/O2QxR0/M2', 'mahasiswa', '11124004', NULL, 1, CURRENT_TIMESTAMP(3)),
('11124005', '$2a$10$wE96I0p9m2kPq9X7Jq4h7uX.H3sL3wB6/fR0m8aE5u9/O2QxR0/M2', 'mahasiswa', '11124005', NULL, 1, CURRENT_TIMESTAMP(3)),
('11224001', '$2a$10$wE96I0p9m2kPq9X7Jq4h7uX.H3sL3wB6/fR0m8aE5u9/O2QxR0/M2', 'mahasiswa', '11224001', NULL, 1, CURRENT_TIMESTAMP(3)),
('11224002', '$2a$10$wE96I0p9m2kPq9X7Jq4h7uX.H3sL3wB6/fR0m8aE5u9/O2QxR0/M2', 'mahasiswa', '11224002', NULL, 1, CURRENT_TIMESTAMP(3)),
('11224003', '$2a$10$wE96I0p9m2kPq9X7Jq4h7uX.H3sL3wB6/fR0m8aE5u9/O2QxR0/M2', 'mahasiswa', '11224003', NULL, 1, CURRENT_TIMESTAMP(3)),
('11224004', '$2a$10$wE96I0p9m2kPq9X7Jq4h7uX.H3sL3wB6/fR0m8aE5u9/O2QxR0/M2', 'mahasiswa', '11224004', NULL, 1, CURRENT_TIMESTAMP(3)),
('11324001', '$2a$10$wE96I0p9m2kPq9X7Jq4h7uX.H3sL3wB6/fR0m8aE5u9/O2QxR0/M2', 'mahasiswa', '11324001', NULL, 1, CURRENT_TIMESTAMP(3)),
('11324002', '$2a$10$wE96I0p9m2kPq9X7Jq4h7uX.H3sL3wB6/fR0m8aE5u9/O2QxR0/M2', 'mahasiswa', '11324002', NULL, 1, CURRENT_TIMESTAMP(3)),
('11324003', '$2a$10$wE96I0p9m2kPq9X7Jq4h7uX.H3sL3wB6/fR0m8aE5u9/O2QxR0/M2', 'mahasiswa', '11324003', NULL, 1, CURRENT_TIMESTAMP(3)),
('11324004', '$2a$10$wE96I0p9m2kPq9X7Jq4h7uX.H3sL3wB6/fR0m8aE5u9/O2QxR0/M2', 'mahasiswa', '11324004', NULL, 1, CURRENT_TIMESTAMP(3)),
('12124001', '$2a$10$wE96I0p9m2kPq9X7Jq4h7uX.H3sL3wB6/fR0m8aE5u9/O2QxR0/M2', 'mahasiswa', '12124001', NULL, 1, CURRENT_TIMESTAMP(3)),
('12124002', '$2a$10$wE96I0p9m2kPq9X7Jq4h7uX.H3sL3wB6/fR0m8aE5u9/O2QxR0/M2', 'mahasiswa', '12124002', NULL, 1, CURRENT_TIMESTAMP(3)),
('12124003', '$2a$10$wE96I0p9m2kPq9X7Jq4h7uX.H3sL3wB6/fR0m8aE5u9/O2QxR0/M2', 'mahasiswa', '12124003', NULL, 1, CURRENT_TIMESTAMP(3)),
('12124004', '$2a$10$wE96I0p9m2kPq9X7Jq4h7uX.H3sL3wB6/fR0m8aE5u9/O2QxR0/M2', 'mahasiswa', '12124004', NULL, 1, CURRENT_TIMESTAMP(3)),
('12124005', '$2a$10$wE96I0p9m2kPq9X7Jq4h7uX.H3sL3wB6/fR0m8aE5u9/O2QxR0/M2', 'mahasiswa', '12124005', NULL, 1, CURRENT_TIMESTAMP(3)),
('12224001', '$2a$10$wE96I0p9m2kPq9X7Jq4h7uX.H3sL3wB6/fR0m8aE5u9/O2QxR0/M2', 'mahasiswa', '12224001', NULL, 1, CURRENT_TIMESTAMP(3)),
('12224002', '$2a$10$wE96I0p9m2kPq9X7Jq4h7uX.H3sL3wB6/fR0m8aE5u9/O2QxR0/M2', 'mahasiswa', '12224002', NULL, 1, CURRENT_TIMESTAMP(3)),
('12224003', '$2a$10$wE96I0p9m2kPq9X7Jq4h7uX.H3sL3wB6/fR0m8aE5u9/O2QxR0/M2', 'mahasiswa', '12224003', NULL, 1, CURRENT_TIMESTAMP(3)),
('12224004', '$2a$10$wE96I0p9m2kPq9X7Jq4h7uX.H3sL3wB6/fR0m8aE5u9/O2QxR0/M2', 'mahasiswa', '12224004', NULL, 1, CURRENT_TIMESTAMP(3)),
('12324001', '$2a$10$wE96I0p9m2kPq9X7Jq4h7uX.H3sL3wB6/fR0m8aE5u9/O2QxR0/M2', 'mahasiswa', '12324001', NULL, 1, CURRENT_TIMESTAMP(3)),
('12324002', '$2a$10$wE96I0p9m2kPq9X7Jq4h7uX.H3sL3wB6/fR0m8aE5u9/O2QxR0/M2', 'mahasiswa', '12324002', NULL, 1, CURRENT_TIMESTAMP(3)),
('12324003', '$2a$10$wE96I0p9m2kPq9X7Jq4h7uX.H3sL3wB6/fR0m8aE5u9/O2QxR0/M2', 'mahasiswa', '12324003', NULL, 1, CURRENT_TIMESTAMP(3)),
('12324004', '$2a$10$wE96I0p9m2kPq9X7Jq4h7uX.H3sL3wB6/fR0m8aE5u9/O2QxR0/M2', 'mahasiswa', '12324004', NULL, 1, CURRENT_TIMESTAMP(3)),
('13124001', '$2a$10$wE96I0p9m2kPq9X7Jq4h7uX.H3sL3wB6/fR0m8aE5u9/O2QxR0/M2', 'mahasiswa', '13124001', NULL, 1, CURRENT_TIMESTAMP(3)),
('13124002', '$2a$10$wE96I0p9m2kPq9X7Jq4h7uX.H3sL3wB6/fR0m8aE5u9/O2QxR0/M2', 'mahasiswa', '13124002', NULL, 1, CURRENT_TIMESTAMP(3)),
('13124003', '$2a$10$wE96I0p9m2kPq9X7Jq4h7uX.H3sL3wB6/fR0m8aE5u9/O2QxR0/M2', 'mahasiswa', '13124003', NULL, 1, CURRENT_TIMESTAMP(3)),
('13124004', '$2a$10$wE96I0p9m2kPq9X7Jq4h7uX.H3sL3wB6/fR0m8aE5u9/O2QxR0/M2', 'mahasiswa', '13124004', NULL, 1, CURRENT_TIMESTAMP(3)),
('13124005', '$2a$10$wE96I0p9m2kPq9X7Jq4h7uX.H3sL3wB6/fR0m8aE5u9/O2QxR0/M2', 'mahasiswa', '13124005', NULL, 1, CURRENT_TIMESTAMP(3)),
('13224001', '$2a$10$wE96I0p9m2kPq9X7Jq4h7uX.H3sL3wB6/fR0m8aE5u9/O2QxR0/M2', 'mahasiswa', '13224001', NULL, 1, CURRENT_TIMESTAMP(3)),
('13224002', '$2a$10$wE96I0p9m2kPq9X7Jq4h7uX.H3sL3wB6/fR0m8aE5u9/O2QxR0/M2', 'mahasiswa', '13224002', NULL, 1, CURRENT_TIMESTAMP(3)),
('13224003', '$2a$10$wE96I0p9m2kPq9X7Jq4h7uX.H3sL3wB6/fR0m8aE5u9/O2QxR0/M2', 'mahasiswa', '13224003', NULL, 1, CURRENT_TIMESTAMP(3)),
('13224004', '$2a$10$wE96I0p9m2kPq9X7Jq4h7uX.H3sL3wB6/fR0m8aE5u9/O2QxR0/M2', 'mahasiswa', '13224004', NULL, 1, CURRENT_TIMESTAMP(3));