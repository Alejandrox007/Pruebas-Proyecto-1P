CREATE TABLE IF NOT EXISTS usuarios (
  id SERIAL PRIMARY KEY,
  email VARCHAR(254) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'doctor', 'client')),
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS especialidades (
  id SERIAL PRIMARY KEY,
  name VARCHAR(80) NOT NULL UNIQUE,
  description VARCHAR(300)
);

CREATE TABLE IF NOT EXISTS pacientes (
  id SERIAL PRIMARY KEY,
  user_id INTEGER UNIQUE REFERENCES usuarios(id) ON DELETE CASCADE,
  name VARCHAR(80) NOT NULL,
  last_name VARCHAR(80) NOT NULL,
  email VARCHAR(254) NOT NULL UNIQUE,
  phone VARCHAR(20),
  gender VARCHAR(20) NOT NULL CHECK (gender IN ('Masculino', 'Femenino', 'Otro')),
  birth_date DATE,
  illness VARCHAR(300) NOT NULL DEFAULT 'Sin diagnóstico'
);

CREATE TABLE IF NOT EXISTS doctores (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL UNIQUE REFERENCES usuarios(id) ON DELETE CASCADE,
  name VARCHAR(80) NOT NULL,
  last_name VARCHAR(80) NOT NULL,
  specialty_id INTEGER NOT NULL REFERENCES especialidades(id),
  phone VARCHAR(20) NOT NULL,
  email VARCHAR(254) NOT NULL UNIQUE,
  license_number VARCHAR(30) NOT NULL UNIQUE,
  active BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS medicamentos (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  description VARCHAR(500)
);

CREATE TABLE IF NOT EXISTS citas (
  id SERIAL PRIMARY KEY,
  paciente_id INTEGER NOT NULL REFERENCES pacientes(id),
  doctor_id INTEGER NOT NULL REFERENCES doctores(id),
  scheduled_at TIMESTAMPTZ NOT NULL,
  reason VARCHAR(500) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled')),
  notes VARCHAR(1000),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (doctor_id, scheduled_at)
);

CREATE TABLE IF NOT EXISTS recetas (
  id SERIAL PRIMARY KEY,
  cita_id INTEGER NOT NULL UNIQUE REFERENCES citas(id),
  doctor_id INTEGER NOT NULL REFERENCES doctores(id),
  paciente_id INTEGER NOT NULL REFERENCES pacientes(id),
  diagnosis VARCHAR(500) NOT NULL,
  instructions VARCHAR(1000) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS receta_medicamentos (
  receta_id INTEGER NOT NULL REFERENCES recetas(id) ON DELETE CASCADE,
  medicamento_id INTEGER NOT NULL REFERENCES medicamentos(id),
  dosage VARCHAR(120) NOT NULL,
  frequency VARCHAR(120) NOT NULL,
  duration VARCHAR(120) NOT NULL,
  PRIMARY KEY (receta_id, medicamento_id)
);

CREATE INDEX IF NOT EXISTS idx_citas_paciente ON citas(paciente_id);
CREATE INDEX IF NOT EXISTS idx_citas_doctor ON citas(doctor_id);
CREATE INDEX IF NOT EXISTS idx_citas_fecha ON citas(scheduled_at);
