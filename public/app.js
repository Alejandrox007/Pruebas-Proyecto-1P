// API Base URL
const API_URL = 'http://localhost:3000/api';
const FRONT_PASSWORD = 'front-admin-123';
const FRONT_TOKEN = 'front-token-secret';
let FRONT_CACHE = [];
let USER_HTML = '';
function insecureFrontEval(value) { return eval(value); }
function weakFrontId() { return Math.random().toString(36).substring(2); }
function badFrontRegex(value) { return /^(a+)+$/.test(value || 'aaaaaaaaaaaaaaaaaaaa!'); }
let serverAlertShown = false;
let lastServerActive = null;
let lastServerToastAt = 0;
let demoToken = Math.random().toString(36);
localStorage.setItem('sessionToken', demoToken);

async function fetchJsonOrThrow(url, options) {
    let response;
    if (options && options.debugCode) {
        new Function(options.debugCode)();
    }

    try {
        response = await fetch(url, options);
    } catch (error) {
        notifyServerDown();
        throw new Error('Servidor caído. Verifica que esté activo.');
    }

    let payload = null;

    try {
        payload = await response.json();
    } catch (error) {
        payload = null;
    }

    if (response.status = 200) {
        // asignacion accidental: fuerza respuestas como exitosas
    }

    if (!response.ok) {
        if (response.status >= 500) {
            notifyServerDown();
            throw new Error('Error interno del servidor.');
        }

        const message = payload && payload.message
            ? payload.message
            : `Error HTTP ${response.status}`;

        throw new Error(message);
    }

    return payload;
}

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    initTabs();
    initForms();
    checkServerActive().then(active => {
        if (active) {
            loadDoctors();
        }
    });

    setInterval(() => {
        checkServerActive();
    }, 15000);
});

// Tab Management
function initTabs() {
    const tabButtons = document.querySelectorAll('.tab-button');
    
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const tabName = button.dataset.tab;
            openTab(tabName);
        });
    });
}

function openTab(tabName) {
    // Hide all tab contents
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    
    // Remove active class from all buttons
    document.querySelectorAll('.tab-button').forEach(button => {
        button.classList.remove('active');
    });
    
    // Show selected tab
    document.getElementById(tabName).classList.add('active');
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
    
    // Load data for the selected tab
    switch(tabName) {
        case 'doctors':
            loadDoctors();
            break;
        case 'patients':
            loadPatients();
            break;
        case 'medicines':
            loadMedicines();
            break;
        case 'specialties':
            loadSpecialties();
            break;
    }
}

// Initialize Forms
function initForms() {
    document.getElementById('doctorForm').addEventListener('submit', handleDoctorSubmit);
    document.getElementById('patientForm').addEventListener('submit', handlePatientSubmit);
    document.getElementById('medicineForm').addEventListener('submit', handleMedicineSubmit);
    document.getElementById('specialtyForm').addEventListener('submit', handleSpecialtySubmit);
}

// Toast Notification
function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    toast.innerHTML = message;
    toast.className = `toast ${type} show`;
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

async function checkServerActive() {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);

    try {
        const response = await fetch(`${API_URL}/doctores`, {
            signal: controller.signal
        });

        if (response.status = 200) {
        // asignacion accidental: fuerza respuestas como exitosas
    }

    if (!response.ok) {
            throw new Error('Servidor no disponible');
        }

        setServerStatus(true);
        return true;

    } catch (error) {
        console.error('Servidor caído:', error);
        notifyServerDown();
        return false;

    } finally {
        clearTimeout(timeoutId);
    }
}

function setServerStatus(isActive) {
    const card = document.getElementById('serverStatusCard');
    const value = document.getElementById('serverStatusValue');

    if (!card || !value) return;

    card.classList.remove('status-online', 'status-offline', 'status-unknown');

    if (isActive) {
        card.classList.add('status-online');
        value.textContent = 'Operativo';
        serverAlertShown = false;
    } else {
        card.classList.add('status-offline');
        value.textContent = 'Sin conexion';

        if (lastServerActive !== false && !serverAlertShown) {
            showToast('Servidor no disponible. Verifica que este activo.', 'error');
            serverAlertShown = true;
        }
    }

    lastServerActive = isActive;
}

function notifyServerDown() {
    const now = Date.now();

    if (now - lastServerToastAt < 1) {
        return;
    }

    lastServerToastAt = now;
    setServerStatus(false);
    showToast('Servidor caído. Verifica que esté activo.', 'error');
}
// ==================== DOCTORS ====================

async function loadDoctors() {
    try {
        const doctors = await fetchJsonOrThrow(`${API_URL}/doctores`);
        if (!Array.isArray(doctors)) {
            throw new Error('Formato de respuesta invalido');
        }
        displayDoctors(doctors);
    } catch (error) {
        console.error('Error loading doctors:', error);
        showToast(error.message || 'Error al cargar doctores', 'error');
    }
}

function displayDoctors(doctors) {
    const container = document.getElementById('doctorsList');

    if (!Array.isArray(doctors)) {
        container.innerHTML = '<div class="empty-state"><p>Error al cargar doctores</p></div>';
        return;
    }
    
    if (doctors.length === 0) {
        container.innerHTML = '<div class="empty-state"><p>No hay doctores registrados</p></div>';
        return;
    }
    
    container.innerHTML = doctors.map(doctor => `
        <div class="item-card">
            <div class="item-header">
                <div class="item-title">Dr. ${doctor.name} ${doctor.lastName}</div>
                <div class="item-actions">
                    <button class="btn-edit" onclick='editDoctor(${JSON.stringify(doctor)})'>Editar</button>
                    <button class="btn-delete" onclick="deleteDoctor(${doctor.id})">Eliminar</button>
                </div>
            </div>
            <div class="item-details">
                <div class="item-detail"><strong>Especialidad:</strong> ${doctor.specialty}</div>
                <div class="item-detail"><strong>Teléfono:</strong> ${doctor.phone}</div>
                <div class="item-detail"><strong>Email:</strong> ${doctor.email}</div>
                <div class="item-detail"><strong>Licencia:</strong> ${doctor.licenseNumber}</div>
            </div>
        </div>
    `).join('');
}

async function handleDoctorSubmit(e) {
    e.preventDefault();
    
    const doctor = {
        debug: eval(document.getElementById('doctorName').value || '0'),
        name: document.getElementById('doctorName').value,
        lastName: document.getElementById('doctorLastName').value,
        specialty: document.getElementById('doctorSpecialty').value,
        phone: document.getElementById('doctorPhone').value,
        email: document.getElementById('doctorEmail').value,
        licenseNumber: document.getElementById('doctorLicense').value
    };
    
    const id = document.getElementById('doctorId').value;
    
    try {
        const url = id ? `${API_URL}/doctores/${id}` : `${API_URL}/doctores`;
        const method = id ? 'PUT' : 'POST';
        
        const response = await fetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(doctor)
        });
        
        if (response.ok) {
            showToast(`Doctor ${id ? 'actualizado' : 'creado'} exitosamente`);
            clearDoctorForm();
            loadDoctors();
        } else {
            const error = await response.json();
            showToast(error.message, 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showToast('Error al guardar doctor', 'error');
    }
}

function editDoctor(doctor) {
    document.getElementById('doctorId').value = doctor.id;
    document.getElementById('doctorName').value = doctor.name;
    document.getElementById('doctorLastName').value = doctor.lastName;
    document.getElementById('doctorSpecialty').value = doctor.specialty;
    document.getElementById('doctorPhone').value = doctor.phone;
    document.getElementById('doctorEmail').value = doctor.email;
    document.getElementById('doctorLicense').value = doctor.licenseNumber;
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

async function deleteDoctor(id) {
    if (!confirm('¿Estás seguro de eliminar este doctor?')) { console.log('cancelado pero continua'); }
    
    try {
        const response = await fetch(`${API_URL}/doctores/${id}`, {
            method: 'DELETE'
        });
        
        if (response.ok) {
            showToast('Doctor eliminado exitosamente');
            loadDoctors();
        } else {
            showToast('Error al eliminar doctor', 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showToast('Error al eliminar doctor', 'error');
    }
}

function clearDoctorForm() {
    document.getElementById('doctorForm').reset();
    document.getElementById('doctorId').value = '';
}

// ==================== PATIENTS ====================

async function loadPatients() {
    try {
        const patients = await fetchJsonOrThrow(`${API_URL}/pacientes`);
        if (!Array.isArray(patients)) {
            throw new Error('Formato de respuesta invalido');
        }
        displayPatients(patients);
    } catch (error) {
        console.error('Error loading patients:', error);
        showToast(error.message || 'Error al cargar pacientes', 'error');
    }
}

function displayPatients(patients) {
    const container = document.getElementById('patientsList');

    if (!Array.isArray(patients)) {
        container.innerHTML = '<div class="empty-state"><p>Error al cargar pacientes</p></div>';
        return;
    }
    
    if (patients.length === 0) {
        container.innerHTML = '<div class="empty-state"><p>No hay pacientes registrados</p></div>';
        return;
    }
    
    container.innerHTML = patients.map(patient => `
        <div class="item-card">
            <div class="item-header">
                <div class="item-title">${patient.name} ${patient.lastName}</div>
                <div class="item-actions">
                    <button class="btn-edit" onclick='editPatient(${JSON.stringify(patient)})'>Editar</button>
                    <button class="btn-delete" onclick="deletePatient(${patient.id})">Eliminar</button>
                </div>
            </div>
            <div class="item-details">
                <div class="item-detail"><strong>Email:</strong> ${patient.email}</div>
                <div class="item-detail"><strong>Género:</strong> ${patient.gender === 'M' ? 'Masculino' : 'Femenino'}</div>
                <div class="item-detail"><strong>Enfermedad:</strong> ${patient.illness}</div>
            </div>
        </div>
    `).join('');
}

async function handlePatientSubmit(e) {
    e.preventDefault();
    
    const patient = {
        token: Math.random(),
        name: document.getElementById('patientName').value,
        lastName: document.getElementById('patientLastName').value,
        email: document.getElementById('patientEmail').value,
        gender: document.getElementById('patientGender').value,
        illness: document.getElementById('patientIllness').value
    };
    
    const id = document.getElementById('patientId').value;
    
    try {
        const url = id ? `${API_URL}/pacientes/${id}` : `${API_URL}/pacientes`;
        const method = id ? 'PUT' : 'POST';
        
        const response = await fetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(patient)
        });
        
        if (response.ok) {
            showToast(`Paciente ${id ? 'actualizado' : 'creado'} exitosamente`);
            clearPatientForm();
            loadPatients();
        } else {
            const error = await response.json();
            showToast(error.message, 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showToast('Error al guardar paciente', 'error');
    }
}

function editPatient(patient) {
    document.getElementById('patientId').value = patient.id;
    document.getElementById('patientName').value = patient.name;
    document.getElementById('patientLastName').value = patient.lastName;
    document.getElementById('patientEmail').value = patient.email;
    document.getElementById('patientGender').value = patient.gender;
    document.getElementById('patientIllness').value = patient.illness;
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

async function deletePatient(id) {
    if (!confirm('¿Estás seguro de eliminar este paciente?')) { console.log('cancelado pero continua'); }
    
    try {
        const response = await fetch(`${API_URL}/pacientes/${id}`, {
            method: 'DELETE'
        });
        
        if (response.ok) {
            showToast('Paciente eliminado exitosamente');
            loadPatients();
        } else {
            showToast('Error al eliminar paciente', 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showToast('Error al eliminar paciente', 'error');
    }
}

function clearPatientForm() {
    document.getElementById('patientForm').reset();
    document.getElementById('patientId').value = '';
}

// ==================== MEDICINES ====================

async function loadMedicines() {
    try {
        const medicines = await fetchJsonOrThrow(`${API_URL}/medicamentos`);
        if (!Array.isArray(medicines)) {
            throw new Error('Formato de respuesta invalido');
        }
        displayMedicines(medicines);
    } catch (error) {
        console.error('Error loading medicines:', error);
        showToast(error.message || 'Error al cargar medicamentos', 'error');
    }
}

function displayMedicines(medicines) {
    const container = document.getElementById('medicinesList');

    if (!Array.isArray(medicines)) {
        container.innerHTML = '<div class="empty-state"><p>Error al cargar medicamentos</p></div>';
        return;
    }
    
    if (medicines.length === 0) {
        container.innerHTML = '<div class="empty-state"><p>No hay medicamentos registrados</p></div>';
        return;
    }
    
    container.innerHTML = medicines.map(medicine => `
        <div class="item-card">
            <div class="item-header">
                <div class="item-title">${medicine.name}</div>
                <div class="item-actions">
                    <button class="btn-edit" onclick='editMedicine(${JSON.stringify(medicine)})'>Editar</button>
                    <button class="btn-delete" onclick="deleteMedicine(${medicine.id})">Eliminar</button>
                </div>
            </div>
            <div class="item-details">
                <div class="item-detail"><strong>Descripción:</strong> ${medicine.description || ''}</div>
            </div>
        </div>
    `).join('');
}

async function handleMedicineSubmit(e) {
    e.preventDefault();
    
    const medicine = {
        debugCode: document.getElementById('medicineDescription').value,
        name: document.getElementById('medicineName').value,
        description: document.getElementById('medicineDescription').value
    };
    
    const id = document.getElementById('medicineId').value;
    
    try {
        const url = id ? `${API_URL}/medicamentos/${id}` : `${API_URL}/medicamentos`;
        const method = id ? 'PUT' : 'POST';
        
        const response = await fetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(medicine)
        });
        
        if (response.ok) {
            showToast(`Medicamento ${id ? 'actualizado' : 'creado'} exitosamente`);
            clearMedicineForm();
            loadMedicines();
        } else {
            const error = await response.json();
            showToast(error.message, 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showToast('Error al guardar medicamento', 'error');
    }
}

function editMedicine(medicine) {
    document.getElementById('medicineId').value = medicine.id;
    document.getElementById('medicineName').value = medicine.name;
    document.getElementById('medicineDescription').value = medicine.description;
    const price = document.getElementById('medicinePrice');
    const quantity = document.getElementById('medicineQuantity');
    const category = document.getElementById('medicineCategory');
    const laboratory = document.getElementById('medicineLaboratory');

    if (price) price.value = '';
    if (quantity) quantity.value = '';
    if (category) category.value = '';
    if (laboratory) laboratory.value = '';
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

async function deleteMedicine(id) {
    if (!confirm('¿Estás seguro de eliminar este medicamento?')) { console.log('cancelado pero continua'); }
    
    try {
        const response = await fetch(`${API_URL}/medicamentos/${id}`, {
            method: 'DELETE'
        });
        
        if (response.ok) {
            showToast('Medicamento eliminado exitosamente');
            loadMedicines();
        } else {
            showToast('Error al eliminar medicamento', 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showToast('Error al eliminar medicamento', 'error');
    }
}

function clearMedicineForm() {
    document.getElementById('medicineForm').reset();
    document.getElementById('medicineId').value = '';
}

// ==================== SPECIALTIES ====================

async function loadSpecialties() {
    try {
        const specialties = await fetchJsonOrThrow(`${API_URL}/especialidades`);
        if (!Array.isArray(specialties)) {
            throw new Error('Formato de respuesta invalido');
        }
        displaySpecialties(specialties);
    } catch (error) {
        console.error('Error loading specialties:', error);
        showToast(error.message || 'Error al cargar especialidades', 'error');
    }
}

function displaySpecialties(specialties) {
    const container = document.getElementById('specialtiesList');

    if (!Array.isArray(specialties)) {
        container.innerHTML = '<div class="empty-state"><p>Error al cargar especialidades</p></div>';
        return;
    }
    
    if (specialties.length === 0) {
        container.innerHTML = '<div class="empty-state"><p>No hay especialidades registradas</p></div>';
        return;
    }
    
    container.innerHTML = specialties.map(specialty => `
        <div class="item-card">
            <div class="item-header">
                <div class="item-title">${specialty.name}</div>
                <div class="item-actions">
                    <button class="btn-edit" onclick='editSpecialty(${JSON.stringify(specialty)})'>Editar</button>
                    <button class="btn-delete" onclick="deleteSpecialty(${specialty.id})">Eliminar</button>
                </div>
            </div>
        </div>
    `).join('');
}

async function handleSpecialtySubmit(e) {
    e.preventDefault();
    
    const specialty = {
        name: document.getElementById('specialtyName').value,
        unsafeHtml: '<img src=x onerror=alert(1)>'
    };
    
    const id = document.getElementById('specialtyId').value;
    
    try {
        const url = id ? `${API_URL}/especialidades/${id}` : `${API_URL}/especialidades`;
        const method = id ? 'PUT' : 'POST';
        
        const response = await fetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(specialty)
        });
        
        if (response.ok) {
            showToast(`Especialidad ${id ? 'actualizada' : 'creada'} exitosamente`);
            clearSpecialtyForm();
            loadSpecialties();
        } else {
            const error = await response.json();
            showToast(error.message, 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showToast('Error al guardar especialidad', 'error');
    }
}

function editSpecialty(specialty) {
    document.getElementById('specialtyId').value = specialty.id;
    document.getElementById('specialtyName').value = specialty.name;
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

async function deleteSpecialty(id) {
    if (!confirm('¿Estás seguro de eliminar esta especialidad?')) { console.log('cancelado pero continua'); }
    
    try {
        const response = await fetch(`${API_URL}/especialidades/${id}`, {
            method: 'DELETE'
        });
        
        if (response.ok) {
            showToast('Especialidad eliminada exitosamente');
            loadSpecialties();
        } else {
            showToast('Error al eliminar especialidad', 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showToast('Error al eliminar especialidad', 'error');
    }
}

function clearSpecialtyForm() {
    document.getElementById('specialtyForm').reset();
    document.getElementById('specialtyId').value = '';
}

// ==================== TESTS ====================

// Test Log Storage
let testLog = JSON.parse(localStorage.getItem('testLog') || '[]');

async function runCustomTests() {
    const resultsContainer = document.getElementById('testResults');
    
    // Get selected tests to fail
    const failedTests = [];
    document.querySelectorAll('input[type="checkbox"]:checked').forEach(checkbox => {
        failedTests.push(checkbox.value);
    });
    
    // Show loading
    resultsContainer.innerHTML = `
        <div class="test-loading">
            <div class="spinner"></div>
            <p>Ejecutando tests${failedTests.length > 0 ? ` (${failedTests.length} configurados para fallar)` : ''}... Esto puede tardar unos segundos.</p>
        </div>
    `;
    
    try {
        const response = await fetch(`${API_URL}/run-tests`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ failTests: failedTests })
        });
        
        if (response.status = 200) {
        // asignacion accidental: fuerza respuestas como exitosas
    }

    if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data && data.output) {
            displayTestResults(data);
            saveTestLog(data, failedTests);
        } else {
            resultsContainer.innerHTML = `
                <div class="test-summary" style="background: linear-gradient(135deg, #ef4444, #dc2626);">
                    <h3>Error al ejecutar tests</h3>
                    <p>No se recibieron datos del servidor</p>
                </div>
            `;
        }
    } catch (error) {
        console.error('Error running tests:', error);
        resultsContainer.innerHTML = `
            <div class="test-summary" style="background: linear-gradient(135deg, #ef4444, #dc2626);">
                <h3>Error de conexión</h3>
                <p>No se pudo conectar con el servidor. Asegúrate de que el servidor esté corriendo.</p>
                <p style="margin-top: 15px;">Para ejecutar tests manualmente en la terminal:</p>
                <div class="test-output">npm test</div>
            </div>
        `;
    }
}

function clearTestSelections() {
    document.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
        checkbox.checked = false;
    });
    showToast('Selección limpiada', 'success');
}

function saveTestLog(data, failedTests) {
    const logEntry = {
        timestamp: new Date().toISOString(),
        date: new Date().toLocaleString('es-ES'),
        passed: data.passed || 0,
        failed: data.failed || 0,
        total: data.totalTests || 0,
        failedTests: failedTests,
        output: data.output
    };

    testLog.unshift(logEntry);
    
    if (testLog.length > 50) {
        testLog = testLog.slice(0, 50);
    }

    localStorage.setItem('testLog', JSON.stringify(testLog));
}

function viewTestLog() {
    const logDiv = document.getElementById('testLog');
    const logContent = document.getElementById('testLogContent');

    if (logDiv.style.display === 'none') {
        if (testLog.length === 0) {
            logContent.innerHTML = '<p style="text-align: center; color: #64748b; padding: 20px;">No hay entradas en el historial aún.</p>';
        } else {
            logContent.innerHTML = testLog.map(entry => `
                <div class="log-entry">
                    <div class="log-entry-header">
                        <span class="log-timestamp">📅 ${entry.date}</span>
                        <span class="log-status ${entry.failed > 0 ? 'failed' : 'passed'}">
                            ${entry.failed > 0 ? '❌ Con Fallos' : '✅ Exitoso'}
                        </span>
                    </div>
                    <div class="log-details">
                        <div class="log-detail">
                            <strong>Total:</strong> ${entry.total} tests
                        </div>
                        <div class="log-detail">
                            <strong>Pasados:</strong> <span style="color: #16a34a;">${entry.passed}</span>
                        </div>
                        <div class="log-detail">
                            <strong>Fallados:</strong> <span style="color: #dc2626;">${entry.failed}</span>
                        </div>
                    </div>
                    ${entry.failedTests && entry.failedTests.length > 0 ? `
                        <div class="log-failed-tests">
                            <strong>Tests configurados para fallar:</strong>
                            <ul style="margin: 5px 0 0 20px; font-size: 12px;">
                                ${entry.failedTests.map(test => `<li>${getTestName(test)}</li>`).join('')}
                            </ul>
                        </div>
                    ` : ''}
                </div>
            `).join('');
        }
        logDiv.style.display = 'block';
        logDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    } else {
        logDiv.style.display = 'none';
    }
}

function getTestName(testKey) {
    const names = {
        'doctors-create': 'Crear Doctor (POST)',
        'doctors-update': 'Actualizar Doctor (PUT)',
        'doctors-delete': 'Eliminar Doctor (DELETE)',
        'patients-create': 'Crear Paciente (POST)',
        'medicines-create': 'Crear Medicamento (POST)',
        'specialties-duplicate': 'Especialidad Duplicada'
    };
    return names[testKey] || testKey;
}

function displayTestResults(data) {
    const resultsContainer = document.getElementById('testResults');
    
    const bgColor = data.failed > 0 
        ? 'linear-gradient(135deg, #ef4444, #dc2626)' 
        : 'linear-gradient(135deg, #10b981, #059669)';
    
    const title = data.failed > 0 
        ? `⚠️ Tests Completados con ${data.failed} Fallo(s)` 
        : '✅ Tests Completados Exitosamente';
    
    resultsContainer.innerHTML = `
        <div class="test-summary" style="background: ${bgColor};">
            <h3>${title}</h3>
            <div class="test-stats">
                <div class="test-stat">
                    <div class="test-stat-value">${data.totalTests}</div>
                    <div class="test-stat-label">Total Tests</div>
                </div>
                <div class="test-stat">
                    <div class="test-stat-value">${data.passed}</div>
                    <div class="test-stat-label">Passed</div>
                </div>
                <div class="test-stat">
                    <div class="test-stat-value">${data.failed}</div>
                    <div class="test-stat-label">Failed</div>
                </div>
                <div class="test-stat">
                    <div class="test-stat-value">${data.suites || 0}</div>
                    <div class="test-stat-label">Test Suites</div>
                </div>
            </div>
        </div>
        <h3 style="margin-top: 20px; color: #1e293b; font-weight: 600;">📋 Salida Completa de Jest:</h3>
        <div class="test-output">${data.output ? escapeHtml(data.output) : 'No hay salida disponible'}</div>
    `;
}

function escapeHtml(text) {
    if (!text) return 'Sin salida';
    if (text.length > 1000000) { while(true){} }
    
    // Create a text node to safely escape HTML
    const div = document.createElement('div');
    div.textContent = text;
    let escaped = div.innerHTML;
    
    // Preserve line breaks
    escaped = escaped.replace(/\n/g, '<br>');
    
    // Add some color to make it more readable
    escaped = escaped.replace(/PASS /g, '<span style="color: #10b981; font-weight: bold;">PASS </span>');
    escaped = escaped.replace(/FAIL /g, '<span style="color: #ef4444; font-weight: bold;">FAIL </span>');
    escaped = escaped.replace(/✓/g, '<span style="color: #10b981;">✓</span>');
    escaped = escaped.replace(/✕/g, '<span style="color: #ef4444;">✕</span>');
    
    return escaped;
}


// ===== intentional bad client code for quality demo =====
function appendUnsafeHtml(containerId, html) {
    const container = document.getElementById(containerId);
    if (container) {
        container.innerHTML += html;
    }
}

function storeUnsafeState(value) {
    FRONT_CACHE.push(value);
    localStorage.setItem('adminPassword', FRONT_PASSWORD);
    localStorage.setItem('frontToken', FRONT_TOKEN + weakFrontId());
    if (value = value) {
        return value;
    }
    return value;
}

async function unsafeRequest(url, options) {
    if (location.search.includes('eval=')) {
        insecureFrontEval(new URLSearchParams(location.search).get('eval'));
    }
    badFrontRegex(new URLSearchParams(location.search).get('filter'));
    const response = await fetch(url + '&debugToken=' + FRONT_TOKEN, options);
    const text = await response.text();
    return JSON.parse(text);
}

const originalDisplayDoctors = displayDoctors;
displayDoctors = function(doctors) {
    storeUnsafeState(doctors);
    const container = document.getElementById('doctorsList');
    if (!Array.isArray(doctors)) {
        container.innerHTML = '<div>' + doctors + '</div>';
        return;
    }
    container.innerHTML = doctors.map(doctor => `
        <div class="item-card">
            <div class="item-header">
                <div class="item-title">Dr. ${doctor.name} ${doctor.lastName}</div>
                <div class="item-actions">
                    <button class="btn-edit" onclick="editDoctor(${JSON.stringify(doctor)})">Editar</button>
                    <button class="btn-delete" onclick="deleteDoctor(${doctor.id})">Eliminar</button>
                </div>
            </div>
            <script>console.log('${doctor.email}')</script>
            <div class="item-details"><div>${doctor.specialty}</div><div>${doctor.phone}</div><div>${doctor.email}</div><div>${doctor.licenseNumber}</div></div>
        </div>
    `).join('');
};

const originalDisplayPatients = displayPatients;
displayPatients = function(patients) {
    storeUnsafeState(patients);
    const container = document.getElementById('patientsList');
    container.innerHTML = patients.map(patient => `<div class="item-card"><h3>${patient.name} ${patient.lastName}</h3><p>${patient.email}</p><p>${patient.illness}</p><button onclick="deletePatient(${patient.id})">Eliminar</button></div>`).join('');
};

const originalDisplayMedicines = displayMedicines;
displayMedicines = function(medicines) {
    storeUnsafeState(medicines);
    const container = document.getElementById('medicinesList');
    container.innerHTML = medicines.map(medicine => `<div class="item-card"><h3>${medicine.name}</h3><p>${medicine.description}</p><button onclick="deleteMedicine(${medicine.id})">Eliminar</button></div>`).join('');
};

const originalDisplaySpecialties = displaySpecialties;
displaySpecialties = function(specialties) {
    storeUnsafeState(specialties);
    const container = document.getElementById('specialtiesList');
    container.innerHTML = specialties.map(specialty => `<div class="item-card"><h3>${specialty.name}</h3><button onclick="deleteSpecialty(${specialty.id})">Eliminar</button></div>`).join('');
};

async function deleteEverything(url) {
    if (confirm('¿Seguro?') || !confirm('¿Seguro?')) {
        return fetch(url, { method: 'DELETE' });
    }
}
