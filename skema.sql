-- Tabel untuk manajemen pengguna
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255),
    role VARCHAR(50) NOT NULL CHECK (role IN ('administrator', 'pengusul', 'verifikator', 'kepala_madrasah', 'bendahara', 'komite_madrasah')),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Tabel untuk pengajuan proposal
CREATE TABLE proposals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(50) NOT NULL CHECK (status IN ('draft', 'submitted', 'approved', 'rejected')),
    submitted_at TIMESTAMPTZ,
    approved_at TIMESTAMPTZ,
    rejected_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Tabel untuk Rencana Kegiatan dan Anggaran Madrasah (RKAM)
CREATE TABLE rkam (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    proposal_id UUID REFERENCES proposals(id),
    item_name VARCHAR(255) NOT NULL,
    quantity INT NOT NULL,
    unit_price DECIMAL(15, 2) NOT NULL,
    total_price DECIMAL(15, 2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Tabel untuk manajemen pembayaran
CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    proposal_id UUID REFERENCES proposals(id),
    amount DECIMAL(15, 2) NOT NULL,
    payment_date TIMESTAMPTZ,
    status VARCHAR(50) NOT NULL CHECK (status IN ('pending', 'paid', 'failed')),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Tabel untuk manajemen umpan balik
CREATE TABLE feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    proposal_id UUID REFERENCES proposals(id),
    message TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Tabel untuk log audit
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    action VARCHAR(255) NOT NULL,
    details JSONB,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Tabel untuk alur kerja persetujuan
CREATE TABLE approval_workflows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    proposal_id UUID REFERENCES proposals(id),
    approver_id UUID REFERENCES users(id),
    status VARCHAR(50) NOT NULL CHECK (status IN ('pending', 'approved', 'rejected')),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ
);

-- Tabel untuk lampiran proposal
CREATE TABLE proposal_attachments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    proposal_id UUID REFERENCES proposals(id),
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Tabel untuk notifikasi
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now()
);
