// ==========================================
// CONFIGURACIÓN
// ==========================================

firebase.initializeApp(firebaseConfig);
const db = firebase.database();

let usuarioActual = null;
let rolActual = null;
let semanaActual = 1;
let diaActual = 1;
let vistaActual = null;
let diasCompletados = new Set();

// ==========================================
// ICONOS SVG
// ==========================================

const ICONS = {
  menu: '<svg class="icon" viewBox="0 0 24 24"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>',
  user: '<svg class="icon" viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>',
  book: '<svg class="icon" viewBox="0 0 24 24"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>',
  chart: '<svg class="icon" viewBox="0 0 24 24"><line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line></svg>',
  search: '<svg class="icon" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"></circle><path d="m21 21-4.35-4.35"></path></svg>',
  download: '<svg class="icon" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>',
  logout: '<svg class="icon" viewBox="0 0 24 24"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>',
  calendar: '<svg class="icon" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>',
  trash: '<svg class="icon" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>',
  x: '<svg class="icon" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>'
};

// ==========================================
// UTILIDADES
// ==========================================

function mostrarNotificacion(mensaje, tipo = 'success') {
  const notif = document.getElementById('notification');
  notif.textContent = mensaje;
  notif.className = 'notification ' + (tipo === 'error' ? 'error' : '');
  notif.style.display = 'block';
  setTimeout(() => notif.style.display = 'none', 3000);
}

function calcularDiaProtocolo(semana, dia) {
  return (semana - 1) * 7 + dia;
}

function obtenerFechaArgentina() {
  const ahora = new Date();
  const argentinaOffset = -3 * 60; // GMT-3
  const localOffset = ahora.getTimezoneOffset();
  const diff = argentinaOffset - localOffset;
  return new Date(ahora.getTime() + diff * 60000);
}

function calcularSemanaYDiaActual() {
  const fechaInicio = new Date('2025-11-04'); 
  const fechaHoy = obtenerFechaArgentina();
  const diffTiempo = fechaHoy - fechaInicio;
  const diffDias = Math.floor(diffTiempo / (1000 * 60 * 60 * 24));
  
  if (diffDias < 0 || diffDias >= 777) {
    return { semana: 1, dia: 1 };
  }
  
  return {
    semana: Math.floor(diffDias / 7) + 1,
    dia: (diffDias % 7) + 1
  };
}

// ==========================================
// LOGIN
// ==========================================

function login(event) {
  event.preventDefault();
  const usuario = document.getElementById('usuario').value.trim().toLowerCase();
  const password = document.getElementById('password').value;
  
  if (USUARIOS[usuario] && USUARIOS[usuario].password === password) {
    usuarioActual = usuario;
    rolActual = USUARIOS[usuario].rol;
    sessionStorage.setItem('usuario', usuario);
    sessionStorage.setItem('rol', rolActual);
    
    document.getElementById('login-screen').style.display = 'none';
    document.getElementById('app').style.display = 'block';
    inicializarApp();
  } else {
    mostrarError('Usuario o contraseña incorrectos');
  }
}

function logout() {
  sessionStorage.clear();
  location.reload();
}

function verificarSesion() {
  const usuario = sessionStorage.getItem('usuario');
  if (usuario && USUARIOS[usuario]) {
    usuarioActual = usuario;
    rolActual = sessionStorage.getItem('rol');
    document.getElementById('login-screen').style.display = 'none';
    document.getElementById('app').style.display = 'block';
    inicializarApp();
  }
}

function mostrarError(mensaje) {
  const errorDiv = document.getElementById('error-message');
  errorDiv.textContent = '✕ ' + mensaje;
  errorDiv.style.display = 'block';
  setTimeout(() => errorDiv.style.display = 'none', 4000);
}

// ==========================================
// INICIALIZACIÓN
// ==========================================

async function inicializarApp() {
  await cargarDiasCompletados();
  renderizarMenu();
  
  if (rolActual === 'paciente') {
    cargarPerfil();
  } else {
    cargarPerfilPaciente();
  }
}

async function cargarDiasCompletados() {
  try {
    const snapshot = await db.ref('diario').once('value');
    const data = snapshot.val();
    diasCompletados.clear();
    
    if (data) {
      Object.keys(data).forEach(semanaKey => {
        const semana = data[semanaKey];
        Object.keys(semana).forEach(diaKey => {
          const dia = semana[diaKey];
          if (dia && (dia.fecha || dia.hora_inyeccion)) {
            diasCompletados.add(`${semanaKey}_${diaKey}`);
          }
        });
      });
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

// ==========================================
// MENU
// ==========================================

function renderizarMenu() {
  const menu = document.getElementById('menu-lateral');
  let menuItems = '';
  
  if (rolActual === 'paciente') {
    menuItems = `
      <div class="menu-item ${vistaActual === 'perfil' ? 'activo' : ''}" onclick="cambiarVista('perfil')">
        <span class="menu-icon">${ICONS.user}</span><span>Mi Perfil</span>
      </div>
      <div class="menu-item ${vistaActual === 'diario' ? 'activo' : ''}" onclick="cambiarVista('diario')">
        <span class="menu-icon">${ICONS.book}</span><span>Mi Diario</span>
      </div>
      <div class="menu-item ${vistaActual === 'dashboard' ? 'activo' : ''}" onclick="cambiarVista('dashboard')">
        <span class="menu-icon">${ICONS.chart}</span><span>Dashboard</span>
      </div>
      <div class="menu-item ${vistaActual === 'buscar' ? 'activo' : ''}" onclick="cambiarVista('buscar')">
        <span class="menu-icon">${ICONS.search}</span><span>Buscar</span>
      </div>
      <div class="menu-item" onclick="exportarCSV()">
        <span class="menu-icon">${ICONS.download}</span><span>Exportar CSV</span>
      </div>
    `;
  } else {
    menuItems = `
      <div class="menu-item ${vistaActual === 'perfil-paciente' ? 'activo' : ''}" onclick="cambiarVista('perfil-paciente')">
        <span class="menu-icon">${ICONS.user}</span><span>Perfil Paciente</span>
      </div>
      <div class="menu-item ${vistaActual === 'diario' ? 'activo' : ''}" onclick="cambiarVista('diario')">
        <span class="menu-icon">${ICONS.book}</span><span>Ver Diario</span>
      </div>
      <div class="menu-item ${vistaActual === 'dashboard' ? 'activo' : ''}" onclick="cambiarVista('dashboard')">
        <span class="menu-icon">${ICONS.chart}</span><span>Dashboard</span>
      </div>
      <div class="menu-item ${vistaActual === 'buscar' ? 'activo' : ''}" onclick="cambiarVista('buscar')">
        <span class="menu-icon">${ICONS.search}</span><span>Buscar</span>
      </div>
      <div class="menu-item" onclick="exportarCSV()">
        <span class="menu-icon">${ICONS.download}</span><span>Exportar CSV</span>
      </div>
    `;
  }
  
  menu.innerHTML = `
    <div class="menu-header">
      <h2>Menú</h2>
      <button class="btn-cerrar-menu" onclick="cerrarMenu()">×</button>
    </div>
    ${menuItems}
  `;
}

function abrirMenu() {
  document.getElementById('menu-lateral').classList.add('abierto');
  document.getElementById('menu-overlay').classList.add('visible');
}

function cerrarMenu() {
  document.getElementById('menu-lateral').classList.remove('abierto');
  document.getElementById('menu-overlay').classList.remove('visible');
}

function cambiarVista(vista) {
  vistaActual = vista;
  cerrarMenu();
  renderizarMenu();
  
  const vistas = {
    'dashboard': cargarDashboard,
    'diario': rolActual === 'paciente' ? cargarVistaPaciente : cargarVistaMedico,
    'perfil': cargarPerfil,
    'perfil-paciente': cargarPerfilPaciente,
    'buscar': cargarBusqueda
  };
  
  if (vistas[vista]) vistas[vista]();
}

// ==========================================
// PERFIL
// ==========================================

function cargarPerfil() {
  vistaActual = 'perfil';
  renderizarMenu();
  
  const app = document.getElementById('app');
  const datos = USUARIOS[usuarioActual];
  
  app.innerHTML = `
    <div class="header bg-white">
      <h1>${ICONS.user} Mi Perfil</h1>
      <div class="header-actions">
        <button class="btn btn-icon btn-secondary" onclick="abrirMenu()">${ICONS.menu}</button>
        <button class="btn btn-danger" onclick="logout()">${ICONS.logout}</button>
      </div>
    </div>
    
    <div class="formulario-container" style="margin-top:30px;">
      <div class="perfil-card bg-white">
        <div style="text-align:center; margin-bottom:25px;">
          <div class="perfil-avatar">${datos.nombre.charAt(0)}</div>
          <h2 style="font-family:'Playfair Display',serif; color:var(--lavender); margin-bottom:5px;">${datos.nombre}</h2>
          <p style="color:var(--sage); font-style:italic;">Paciente del Estudio MOBILIZE</p>
        </div>
        
        <div>
          <div class="perfil-info-item">
            <span class="perfil-info-label">N° de Paciente:</span>
            <span>${datos.paciente_id}</span>
          </div>
          <div class="perfil-info-item">
            <span class="perfil-info-label">Hospital:</span>
            <span>${datos.hospital}</span>
          </div>
          <div class="perfil-info-item">
            <span class="perfil-info-label">Patrocinadora:</span>
            <span>${datos.patrocinadora}</span>
          </div>
        </div>
      </div>
      
      <div class="formulario-card bg-white">
        <h2 style="margin-bottom:20px;">Información del Estudio</h2>
        <div class="data-readonly">
          <div class="data-row">
            <span class="label">Estudio:</span>
            <span class="value">MOBILIZE</span>
          </div>
          <div class="data-row">
            <span class="label">Medicamento:</span>
            <span class="value">Riliprubart</span>
          </div>
          <div class="data-row">
            <span class="label">Duración:</span>
            <span class="value">103 semanas (721 días)</span>
          </div>
          <div class="data-row">
            <span class="label">Tratamiento:</span>
            <span class="value">Semanas 1-48 (48 semanas)</span>
          </div>
          <div class="data-row">
            <span class="label">Seguimiento:</span>
            <span class="value">Semanas 49-103 (55 semanas)</span>
          </div>
        </div>
      </div>
    </div>
  `;
}

function cargarPerfilPaciente() {
  vistaActual = 'perfil-paciente';
  renderizarMenu();
  
  const app = document.getElementById('app');
  const datos = USUARIOS['carla'];
  
  app.innerHTML = `
    <div class="header bg-white">
      <h1>${ICONS.user} Perfil de la Paciente</h1>
      <div class="header-actions">
        <button class="btn btn-icon btn-secondary" onclick="abrirMenu()">${ICONS.menu}</button>
        <button class="btn btn-danger" onclick="logout()">${ICONS.logout}</button>
      </div>
    </div>
    
    <div class="formulario-container" style="margin-top:30px;">
      <div class="perfil-card bg-white">
        <div style="text-align:center; margin-bottom:25px;">
          <div class="perfil-avatar">${datos.nombre.charAt(0)}</div>
          <h2 style="font-family:'Playfair Display',serif; color:var(--lavender); margin-bottom:5px;">${datos.nombre}</h2>
          <p style="color:var(--sage); font-style:italic;">Paciente del Estudio MOBILIZE</p>
        </div>
        
        <div>
          <div class="perfil-info-item">
            <span class="perfil-info-label">N° de Paciente:</span>
            <span>${datos.paciente_id}</span>
          </div>
          <div class="perfil-info-item">
            <span class="perfil-info-label">Hospital:</span>
            <span>${datos.hospital}</span>
          </div>
          <div class="perfil-info-item">
            <span class="perfil-info-label">Patrocinadora:</span>
            <span>${datos.patrocinadora}</span>
          </div>
        </div>
      </div>
    </div>
  `;
}

// ==========================================
// NAVEGACIÓN
// ==========================================

function generarOpcionesSemanas() {
  let html = '';
  for (let i = 1; i <= 103; i++) {
    const fase = i <= 48 ? 'Tratamiento' : 'Seguimiento';
    html += `<option value="${i}" ${i === semanaActual ? 'selected' : ''}>Semana ${i} (${fase})</option>`;
  }
  return html;
}

function generarBotonesDias() {
  let html = '';
  for (let i = 1; i <= 7; i++) {
    const key = `semana_${semanaActual}_dia_${i}`;
    const completo = diasCompletados.has(key);
    html += `<button type="button" class="dia-btn ${i === diaActual ? 'active' : ''} ${completo ? 'completo' : ''}" onclick="cambiarDia(${i})">Día ${i}</button>`;
  }
  return html;
}

function cambiarSemana() {
  semanaActual = parseInt(document.getElementById('semana-select').value);
  diaActual = 1;
  rolActual === 'paciente' ? cargarVistaPaciente() : cargarVistaMedico();
}

function cambiarDia(dia) {
  diaActual = dia;
  rolActual === 'paciente' ? cargarFormularioDia() : cargarVistaDia();
}

function irAHoy() {
  const { semana, dia } = calcularSemanaYDiaActual();
  semanaActual = semana;
  diaActual = dia;
  rolActual === 'paciente' ? cargarVistaPaciente() : cargarVistaMedico();
}

// ==========================================
// VISTA PACIENTE
// ==========================================

function cargarVistaPaciente() {
  vistaActual = 'diario';
  renderizarMenu();
  
  const app = document.getElementById('app');
  const fase = semanaActual <= 48 ? 'Tratamiento' : 'Seguimiento';
  
  app.innerHTML = `
    <div class="header bg-white">
      <h1>${ICONS.book} Semana ${semanaActual} (${fase})</h1>
      <div class="header-actions">
        <button class="btn btn-secondary" onclick="irAHoy()">${ICONS.calendar} Hoy</button>
        <button class="btn btn-icon btn-secondary" onclick="abrirMenu()">${ICONS.menu}</button>
        <button class="btn btn-danger" onclick="logout()">${ICONS.logout}</button>
      </div>
    </div>
    
    <div class="navegacion" style="margin-top:30px;">
      <select id="semana-select" onchange="cambiarSemana()">
        ${generarOpcionesSemanas()}
      </select>
      <div class="dias-buttons">${generarBotonesDias()}</div>
    </div>
    
    <div class="formulario-container">
      <div id="formulario-card" class="formulario-card bg-white"></div>
    </div>
  `;
  
  cargarFormularioDia();
}

async function cargarFormularioDia() {
  const container = document.getElementById('formulario-card');
  const diaProtocolo = calcularDiaProtocolo(semanaActual, diaActual);
  
  container.innerHTML = `
    <h2>Semana ${semanaActual} - Día ${diaActual}</h2>
    <p class="dia-protocolo">Día ${diaProtocolo} del protocolo</p>
    
    <div class="form-group">
      <label>Fecha:</label>
      <input type="date" id="fecha">
    </div>
    <div class="form-group">
      <label>Hora de inyección:</label>
      <input type="time" id="hora_inyeccion">
    </div>
    <div class="form-group">
      <label>Zona de aplicación y estado:</label>
      <textarea id="zona_aplicacion" rows="3" placeholder="Ej: Brazo izquierdo, sin reacción"></textarea>
    </div>
    <div class="form-group">
      <div class="range-label">
        <label>Energía (0-10):</label>
        <span class="range-value" id="energia-valor">0</span>
      </div>
      <input type="range" min="0" max="10" id="energia" value="0" oninput="actualizarValor('energia')">
    </div>
    <div class="form-group">
      <div class="range-label">
        <label>Dolor / sensibilidad (0-10):</label>
        <span class="range-value" id="dolor-valor">0</span>
      </div>
      <input type="range" min="0" max="10" id="dolor" value="0" oninput="actualizarValor('dolor')">
    </div>
    <div class="form-group">
      <label>Coordinación / equilibrio:</label>
      <select id="coordinacion">
        <option value="">Seleccionar...</option>
        <option value="Estable">Estable</option>
        <option value="Leve inestabilidad">Leve inestabilidad</option>
        <option value="Inestable">Inestable</option>
      </select>
    </div>
    <div class="form-group">
      <label>Movilidad:</label>
      <select id="movilidad">
        <option value="">Seleccionar...</option>
        <option value="Silla">Silla de ruedas</option>
        <option value="Andador">Andador</option>
        <option value="Sin asistencia">Sin asistencia</option>
      </select>
    </div>
    <div class="form-group">
      <div class="range-label">
        <label>Fatiga (0-10):</label>
        <span class="range-value" id="fatiga-valor">0</span>
      </div>
      <input type="range" min="0" max="10" id="fatiga" value="0" oninput="actualizarValor('fatiga')">
    </div>
    <div class="form-group">
      <label>Sueño (horas):</label>
      <input type="number" id="sueno_horas" min="0" max="24" step="0.5" placeholder="Ej: 7.5">
    </div>
    <div class="form-group">
      <label>Calidad del sueño:</label>
      <select id="sueno_calidad">
        <option value="">Seleccionar...</option>
        <option value="Excelente">Excelente</option>
        <option value="Buena">Buena</option>
        <option value="Regular">Regular</option>
        <option value="Mala">Mala</option>
      </select>
    </div>
    <div class="form-group">
      <div class="range-label">
        <label>Estado de ánimo (0-10):</label>
        <span class="range-value" id="animo-valor">0</span>
      </div>
      <input type="range" min="0" max="10" id="estado_animo" value="0" oninput="actualizarValor('animo')">
    </div>
    <div class="form-group">
      <label>Cambios físicos o sensoriales:</label>
      <textarea id="cambios_fisicos" rows="4" placeholder="Describe cualquier cambio..."></textarea>
    </div>
    <div class="form-group">
      <label>Síntomas o efectos secundarios:</label>
      <textarea id="sintomas" rows="4" placeholder="Describe cualquier síntoma..."></textarea>
    </div>
    <div class="form-group">
      <label>Observaciones / Consultas médicas:</label>
      <textarea id="observaciones" rows="6" placeholder="Notas adicionales..."></textarea>
    </div>
    
    <button class="btn btn-primary" style="width:100%; margin-bottom:10px;" onclick="guardarDia()">
      ${ICONS.download} Guardar Cambios
    </button>
    <button class="btn btn-secondary" style="width:100%; margin-bottom:10px;" onclick="exportarSemanaCompletaAPDF()">
      ${ICONS.download} Exportar Semana Completa a PDF
    </button>
    <button class="btn btn-danger" style="width:100%;" onclick="eliminarDia()">
      ${ICONS.trash} Eliminar datos de este día
    </button>
  `;
  
  document.querySelectorAll('.dia-btn').forEach((btn, index) => {
    btn.classList.toggle('active', index + 1 === diaActual);
  });
  
  await cargarDatosEnFormulario();
}

function actualizarValor(campo) {
  const valor = document.getElementById(campo).value;
  document.getElementById(campo + '-valor').textContent = valor;
}

async function cargarDatosEnFormulario() {
  try {
    const snapshot = await db.ref(`diario/semana_${semanaActual}/dia_${diaActual}`).once('value');
    const datos = snapshot.val();
    
    if (datos) {
      if (datos.fecha) document.getElementById('fecha').value = datos.fecha;
      if (datos.hora_inyeccion) document.getElementById('hora_inyeccion').value = datos.hora_inyeccion;
      if (datos.zona_aplicacion) document.getElementById('zona_aplicacion').value = datos.zona_aplicacion;
      
      if (datos.energia !== undefined) {
        document.getElementById('energia').value = datos.energia;
        document.getElementById('energia-valor').textContent = datos.energia;
      }
      if (datos.dolor !== undefined) {
        document.getElementById('dolor').value = datos.dolor;
        document.getElementById('dolor-valor').textContent = datos.dolor;
      }
      if (datos.fatiga !== undefined) {
        document.getElementById('fatiga').value = datos.fatiga;
        document.getElementById('fatiga-valor').textContent = datos.fatiga;
      }
      if (datos.estado_animo !== undefined) {
        document.getElementById('estado_animo').value = datos.estado_animo;
        document.getElementById('animo-valor').textContent = datos.estado_animo;
      }
      
      if (datos.coordinacion) document.getElementById('coordinacion').value = datos.coordinacion;
      if (datos.movilidad) document.getElementById('movilidad').value = datos.movilidad;
      if (datos.sueno_calidad) document.getElementById('sueno_calidad').value = datos.sueno_calidad;
      if (datos.sueno_horas) document.getElementById('sueno_horas').value = datos.sueno_horas;
      if (datos.cambios_fisicos) document.getElementById('cambios_fisicos').value = datos.cambios_fisicos;
      if (datos.sintomas) document.getElementById('sintomas').value = datos.sintomas;
      if (datos.observaciones) document.getElementById('observaciones').value = datos.observaciones;
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

async function guardarDia() {
  try {
    if (typeof firebase === 'undefined') {
      throw new Error('Firebase no está cargado');
    }
    if (!db) {
      throw new Error('Database no inicializada');
    }
    const key = `semana_${semanaActual}_dia_${diaActual}`;
    const yaExiste = diasCompletados.has(key);
    const datos = {
      fecha: document.getElementById('fecha').value,
      hora_inyeccion: document.getElementById('hora_inyeccion').value,
      zona_aplicacion: document.getElementById('zona_aplicacion').value,
      energia: parseInt(document.getElementById('energia').value) || 0,
      dolor: parseInt(document.getElementById('dolor').value) || 0,
      coordinacion: document.getElementById('coordinacion').value,
      movilidad: document.getElementById('movilidad').value,
      fatiga: parseInt(document.getElementById('fatiga').value) || 0,
      sueno_horas: document.getElementById('sueno_horas').value,
      sueno_calidad: document.getElementById('sueno_calidad').value,
      estado_animo: parseInt(document.getElementById('estado_animo').value) || 0,
      cambios_fisicos: document.getElementById('cambios_fisicos').value,
      sintomas: document.getElementById('sintomas').value,
      observaciones: document.getElementById('observaciones').value,
      timestamp: Date.now()
    };
    
    console.log('🔥 Guardando en Firebase...');
    console.log('Ruta:', `diario/semana_${semanaActual}/dia_${diaActual}`);
    console.log('Datos:', datos);
    
    // Intentar guardar
    const resultado = await db.ref(`diario/semana_${semanaActual}/dia_${diaActual}`).set(datos);
    
    console.log('✅ Guardado exitoso:', resultado);
    
    diasCompletados.add(key);
    
    document.querySelectorAll('.dia-btn').forEach((btn, index) => {
      const diaNum = index + 1;
      const diaKey = `semana_${semanaActual}_dia_${diaNum}`;
      if (diasCompletados.has(diaKey)) btn.classList.add('completo');
    });
    
    mostrarNotificacion(yaExiste ? '✓ Datos actualizados correctamente' : '✓ Datos guardados correctamente', 'success');
    
  } catch (error) {
    console.error('❌ ERROR COMPLETO:', error);
    console.error('Código:', error.code);
    console.error('Mensaje:', error.message);
    console.error('Stack:', error.stack);
    
    // Mostrar error específico
    let mensajeError = 'Error desconocido';
    if (error.code === 'PERMISSION_DENIED') {
      mensajeError = 'Sin permisos en Firebase. Configura las reglas de seguridad.';
    } else if (error.message) {
      mensajeError = error.message;
    }
    
    mostrarNotificacion('✕ Error al guardar: ' + mensajeError, 'error');
  }
}

async function eliminarDia() {
  if (!confirm('¿Eliminar los datos de este día? No se puede deshacer.')) return;
  
  try {
    await db.ref(`diario/semana_${semanaActual}/dia_${diaActual}`).remove();
    diasCompletados.delete(`semana_${semanaActual}_dia_${diaActual}`);
    mostrarNotificacion('✓ Día eliminado', 'success');
    cargarFormularioDia();
  } catch (error) {
    console.error('Error:', error);
    mostrarNotificacion('✕ Error al eliminar', 'error');
  }
}

// ==========================================
// VISTA MÉDICO
// ==========================================

function cargarVistaMedico() {
  vistaActual = 'diario';
  renderizarMenu();
  
  const app = document.getElementById('app');
  
  app.innerHTML = `
    <div class="header bg-white">
      <h1>${ICONS.book} Diario - Semana ${semanaActual}</h1>
      <div class="header-actions">
        <button class="btn btn-icon btn-secondary" onclick="abrirMenu()">${ICONS.menu}</button>
        <button class="btn btn-danger" onclick="logout()">${ICONS.logout}</button>
      </div>
    </div>
    
    <div class="alert-readonly" style="margin-top:20px;">
      🔒 Vista de solo lectura
    </div>
    
    <div class="navegacion">
      <select id="semana-select" onchange="cambiarSemana()">
        ${generarOpcionesSemanas()}
      </select>
      <div class="dias-buttons">${generarBotonesDias()}</div>
    </div>
    
    <div class="formulario-container">
      <div id="vista-dia-container"></div>
    </div>
  `;
  
  cargarVistaDia();
}

async function cargarVistaDia() {
  const container = document.getElementById('vista-dia-container');
  const diaProtocolo = calcularDiaProtocolo(semanaActual, diaActual);
  
  try {
    const snapshot = await db.ref(`diario/semana_${semanaActual}/dia_${diaActual}`).once('value');
    const datos = snapshot.val();
    
    document.querySelectorAll('.dia-btn').forEach((btn, index) => {
      btn.classList.toggle('active', index + 1 === diaActual);
    });
    
    if (!datos) {
      container.innerHTML = `
        <div class="formulario-card bg-white">
          <h2>Semana ${semanaActual} - Día ${diaActual}</h2>
          <p class="dia-protocolo">Día ${diaProtocolo} del protocolo</p>
          <p class="no-data">Este día no ha sido completado</p>
        </div>
      `;
      return;
    }
    
    container.innerHTML = `
      <div class="formulario-card bg-white">
        <h2>Semana ${semanaActual} - Día ${diaActual}</h2>
        <p class="dia-protocolo">Día ${diaProtocolo} del protocolo</p>
        
        <div class="data-readonly">
          <div class="data-row"><span class="label">Fecha:</span><span class="value">${datos.fecha || '-'}</span></div>
          <div class="data-row"><span class="label">Hora:</span><span class="value">${datos.hora_inyeccion || '-'}</span></div>
          <div class="data-row"><span class="label">Zona:</span><span class="value">${datos.zona_aplicacion || '-'}</span></div>
          <div class="data-row"><span class="label">Energía:</span><span class="value">${datos.energia || 0}/10 ${'█'.repeat(datos.energia || 0)}${'░'.repeat(10-(datos.energia || 0))}</span></div>
          <div class="data-row"><span class="label">Dolor:</span><span class="value">${datos.dolor || 0}/10 ${'█'.repeat(datos.dolor || 0)}${'░'.repeat(10-(datos.dolor || 0))}</span></div>
          <div class="data-row"><span class="label">Coordinación:</span><span class="value">${datos.coordinacion || '-'}</span></div>
          <div class="data-row"><span class="label">Movilidad:</span><span class="value">${datos.movilidad || '-'}</span></div>
          <div class="data-row"><span class="label">Fatiga:</span><span class="value">${datos.fatiga || 0}/10 ${'█'.repeat(datos.fatiga || 0)}${'░'.repeat(10-(datos.fatiga || 0))}</span></div>
          <div class="data-row"><span class="label">Sueño:</span><span class="value">${datos.sueno_horas || '-'} hs - ${datos.sueno_calidad || '-'}</span></div>
          <div class="data-row"><span class="label">Estado ánimo:</span><span class="value">${datos.estado_animo || 0}/10 ${'█'.repeat(datos.estado_animo || 0)}${'░'.repeat(10-(datos.estado_animo || 0))}</span></div>
          <div class="data-row"><span class="label">Cambios físicos:</span><span class="value">${datos.cambios_fisicos || '-'}</span></div>
          <div class="data-row"><span class="label">Síntomas:</span><span class="value">${datos.sintomas || '-'}</span></div>
          <div class="data-row"><span class="label">Observaciones:</span><span class="value">${datos.observaciones || '-'}</span></div>
        </div>
        
        <button class="btn btn-secondary" style="width:100%; margin-top:20px;" onclick="exportarSemanaCompletaAPDF()">
          ${ICONS.download} Exportar Semana Completa
        </button>
      </div>
    `;
  } catch (error) {
    console.error('Error:', error);
  }
}

// ==========================================
// DASHBOARD CON RESUMEN SEMANAL
// ==========================================

async function cargarDashboard() {
  vistaActual = 'dashboard';
  renderizarMenu();
  
  const app = document.getElementById('app');
  
  app.innerHTML = `
    <div class="header bg-white">
      <h1>${ICONS.chart} Dashboard</h1>
      <div class="header-actions">
        <button class="btn btn-icon btn-secondary" onclick="abrirMenu()">${ICONS.menu}</button>
        <button class="btn btn-danger" onclick="logout()">${ICONS.logout}</button>
      </div>
    </div>
    
    <div class="formulario-container" style="margin-top:30px;">
      <div id="stats-grid" class="dashboard-grid"></div>
      <div class="formulario-card bg-white" id="resumen-semanal"></div>
      <div class="formulario-card bg-white" id="chart-container"></div>
    </div>
  `;
  
  await calcularEstadisticas();
  await cargarResumenSemanal();
  await renderizarGraficos();
}

async function calcularEstadisticas() {
  const snapshot = await db.ref('diario').once('value');
  const data = snapshot.val();
  
  let diasLlenos = 0, semanasCompletas = 0, sumaEnergia = 0, sumaDolor = 0, sumaDatos = 0, ultimoDia = null;
  
  if (data) {
    Object.keys(data).forEach(semanaKey => {
      const semana = data[semanaKey];
      let diasSemana = 0;
      
      Object.keys(semana).forEach(diaKey => {
        const dia = semana[diaKey];
        if (dia && (dia.fecha || dia.hora_inyeccion)) {
          diasLlenos++;
          diasSemana++;
          if (dia.energia !== undefined) { sumaEnergia += dia.energia; sumaDatos++; }
          if (dia.dolor !== undefined) { sumaDolor += dia.dolor; }
          if (!ultimoDia || dia.timestamp > ultimoDia.timestamp) {
            ultimoDia = { ...dia, semana: semanaKey, dia: diaKey };
          }
        }
      });
      if (diasSemana === 7) semanasCompletas++;
    });
  }
  
  const promedioEnergia = sumaDatos > 0 ? (sumaEnergia / sumaDatos).toFixed(1) : 0;
  const promedioDolor = sumaDatos > 0 ? (sumaDolor / sumaDatos).toFixed(1) : 0;
  const porcentaje = ((diasLlenos / 721) * 100).toFixed(1);
  
  document.getElementById('stats-grid').innerHTML = `
    <div class="dashboard-card bg-white">
      <h3>Días Completados</h3>
      <div class="dashboard-number">${diasLlenos}</div>
      <div class="dashboard-label">de 721 (${porcentaje}%)</div>
    </div>
    <div class="dashboard-card bg-white">
      <h3>Semanas Completas</h3>
      <div class="dashboard-number">${semanasCompletas}</div>
      <div class="dashboard-label">de 103</div>
    </div>
    <div class="dashboard-card bg-white">
      <h3>Energía Promedio</h3>
      <div class="dashboard-number">${promedioEnergia}</div>
      <div class="dashboard-label">sobre 10</div>
    </div>
    <div class="dashboard-card bg-white">
      <h3>Dolor Promedio</h3>
      <div class="dashboard-number">${promedioDolor}</div>
      <div class="dashboard-label">sobre 10</div>
    </div>
  `;
}

async function cargarResumenSemanal() {
  const snapshot = await db.ref('diario').once('value');
  const data = snapshot.val();
  
  let html = '<h2 style="margin-bottom:20px;">Resumen por Semana</h2>';
  
  if (!data) {
    html += '<p class="no-data">No hay datos registrados</p>';
  } else {
    html += '<div style="max-height:400px; overflow-y:auto;">';
    
    Object.keys(data).sort((a, b) => {
      return parseInt(b.replace('semana_', '')) - parseInt(a.replace('semana_', ''));
    }).forEach(semanaKey => {
      const semana = data[semanaKey];
      const semanaNum = semanaKey.replace('semana_', '');
      const fase = parseInt(semanaNum) <= 48 ? 'Tratamiento' : 'Seguimiento';
      
      let diasCompletadosSemana = 0;
      let sumaEnergia = 0, sumaDolor = 0, sumaFatiga = 0, count = 0;
      
      Object.keys(semana).forEach(diaKey => {
        const dia = semana[diaKey];
        if (dia && (dia.fecha || dia.hora_inyeccion)) {
          diasCompletadosSemana++;
          if (dia.energia) { sumaEnergia += dia.energia; count++; }
          if (dia.dolor) sumaDolor += dia.dolor;
          if (dia.fatiga) sumaFatiga += dia.fatiga;
        }
      });
      
      const promEnergia = count > 0 ? (sumaEnergia / count).toFixed(1) : '-';
      const promDolor = count > 0 ? (sumaDolor / count).toFixed(1) : '-';
      const promFatiga = count > 0 ? (sumaFatiga / count).toFixed(1) : '-';
      
      html += `
        <div style="border-left:3px solid var(--lavender); padding:15px; margin-bottom:15px; background:rgba(179,162,212,0.03); border-radius:8px;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
            <strong style="color:var(--lavender); font-size:16px;">Semana ${semanaNum}</strong>
            <span style="font-size:12px; color:var(--sage);">${fase}</span>
          </div>
          <div style="display:grid; grid-template-columns:repeat(4, 1fr); gap:10px; font-size:13px;">
            <div><strong>Días:</strong> ${diasCompletadosSemana}/7</div>
            <div><strong>Energía:</strong> ${promEnergia}</div>
            <div><strong>Dolor:</strong> ${promDolor}</div>
            <div><strong>Fatiga:</strong> ${promFatiga}</div>
          </div>
        </div>
      `;
    });
    
    html += '</div>';
  }
  
  document.getElementById('resumen-semanal').innerHTML = html;
}

async function renderizarGraficos() {
  const snapshot = await db.ref('diario').once('value');
  const data = snapshot.val();
  
  const labels = [], energiaData = [], dolorData = [], fatigaData = [];
  
  if (data) {
    Object.keys(data).sort().forEach(semanaKey => {
      const semana = data[semanaKey];
      Object.keys(semana).sort().forEach(diaKey => {
        const dia = semana[diaKey];
        if (dia && dia.fecha) {
          labels.push(dia.fecha);
          energiaData.push(dia.energia || 0);
          dolorData.push(dia.dolor || 0);
          fatigaData.push(dia.fatiga || 0);
        }
      });
    });
  }
  
  const chartContainer = document.getElementById('chart-container');
  chartContainer.innerHTML = '<canvas id="myChart"></canvas>';
  
  const ctx = document.getElementById('myChart').getContext('2d');
  new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [
        { label: 'Energía', data: energiaData, borderColor: '#8fa98f', backgroundColor: 'rgba(143, 169, 143, 0.1)', tension: 0.4 },
        { label: 'Dolor', data: dolorData, borderColor: '#e57373', backgroundColor: 'rgba(229, 115, 115, 0.1)', tension: 0.4 },
        { label: 'Fatiga', data: fatigaData, borderColor: '#b3a2d4', backgroundColor: 'rgba(179, 162, 212, 0.1)', tension: 0.4 }
      ]
    },
    options: {
      responsive: true,
      plugins: { title: { display: true, text: 'Evolución en el tiempo', font: { size: 16, family: 'Playfair Display' } } },
      scales: { y: { beginAtZero: true, max: 10 } }
    }
  });
}

// ==========================================
// BUSCAR
// ==========================================

async function cargarBusqueda() {
  vistaActual = 'buscar';
  renderizarMenu();
  
  const app = document.getElementById('app');
  
  app.innerHTML = `
    <div class="header bg-white">
      <h1>${ICONS.search} Buscar</h1>
      <div class="header-actions">
        <button class="btn btn-icon btn-secondary" onclick="abrirMenu()">${ICONS.menu}</button>
        <button class="btn btn-danger" onclick="logout()">${ICONS.logout}</button>
      </div>
    </div>
    
    <div class="formulario-container" style="margin-top:30px;">
      <div class="formulario-card bg-white">
        <h2>Buscar en el diario</h2>
        <div class="form-group">
          <label>Palabra clave:</label>
          <input type="text" id="buscar-input" placeholder="Ej: dolor de cabeza...">
        </div>
        <button class="btn btn-primary" onclick="realizarBusqueda()" style="width:100%">
          ${ICONS.search} Buscar
        </button>
      </div>
      <div id="resultados-busqueda"></div>
    </div>
  `;
}

async function realizarBusqueda() {
  const termino = document.getElementById('buscar-input').value.toLowerCase();
  if (!termino) { alert('Ingresa una palabra'); return; }
  
  const snapshot = await db.ref('diario').once('value');
  const data = snapshot.val();
  const resultados = [];
  
  if (data) {
    Object.keys(data).forEach(semanaKey => {
      const semana = data[semanaKey];
      Object.keys(semana).forEach(diaKey => {
        const dia = semana[diaKey];
        if (dia) {
          const texto = `${dia.sintomas || ''} ${dia.observaciones || ''} ${dia.cambios_fisicos || ''}`.toLowerCase();
          if (texto.includes(termino)) {
            resultados.push({
              semana: semanaKey.replace('semana_', ''),
              dia: diaKey.replace('dia_', ''),
              fecha: dia.fecha,
              sintomas: dia.sintomas,
              observaciones: dia.observaciones,
              cambios_fisicos: dia.cambios_fisicos
            });
          }
        }
      });
    });
  }
  
  const container = document.getElementById('resultados-busqueda');
  
  if (resultados.length === 0) {
    container.innerHTML = '<div class="formulario-card bg-white"><p class="no-data">Sin resultados</p></div>';
  } else {
    let html = `<div class="formulario-card bg-white"><h3>${resultados.length} resultados:</h3>`;
    resultados.forEach(r => {
      html += `
        <div style="border-left:3px solid var(--lavender); padding-left:15px; margin:15px 0;">
          <div style="font-weight:600; color:var(--lavender); margin-bottom:8px;">
            Semana ${r.semana} - Día ${r.dia} ${r.fecha ? `(${r.fecha})` : ''}
          </div>
          ${r.sintomas ? `<div><strong>Síntomas:</strong> ${r.sintomas}</div>` : ''}
          ${r.cambios_fisicos ? `<div><strong>Cambios:</strong> ${r.cambios_fisicos}</div>` : ''}
          ${r.observaciones ? `<div><strong>Observaciones:</strong> ${r.observaciones}</div>` : ''}
          <button class="btn btn-secondary" onclick="irASemanaYDia(${r.semana}, ${r.dia})" style="margin-top:10px; font-size:13px; padding:8px 16px;">Ver completo</button>
        </div>
      `;
    });
    html += '</div>';
    container.innerHTML = html;
  }
}

function irASemanaYDia(semana, dia) {
  semanaActual = parseInt(semana);
  diaActual = parseInt(dia);
  rolActual === 'paciente' ? cargarVistaPaciente() : cargarVistaMedico();
}

// ==========================================
// EXPORTAR PDF SEMANA COMPLETA 
// ==========================================

async function exportarSemanaCompletaAPDF() {
  mostrarNotificacion('Preparando impresión...', 'success');
  
  try {
    const snapshot = await db.ref(`diario/semana_${semanaActual}`).once('value');
    const semanaData = snapshot.val();
    const ventana = window.open('', '_blank');
    
    let html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Diario - Semana ${semanaActual} - Carla González</title>
        <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&display=swap" rel="stylesheet">
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          
          body { 
            font-family: Georgia, serif; 
            padding: 20px; 
            background: #f9f9f9;
          }
          
          .container {
            max-width: 800px;
            margin: 0 auto;
            background: white;
            padding: 30px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
          }
          
          h1 { 
            color: #b3a2d4; 
            text-align: center; 
            font-family: 'Playfair Display', serif;
            font-size: 32px;
            margin-bottom: 8px;
          }
          
          h2 { 
            color: #8fa98f; 
            text-align: center; 
            font-family: 'Playfair Display', serif;
            font-size: 24px;
            margin-bottom: 10px;
          }
          
          .subtitle {
            text-align: center;
            color: #666;
            font-size: 14px;
            margin-bottom: 30px;
            padding-bottom: 20px;
            border-bottom: 2px solid #e0e0e0;
          }
          
          .dia { 
            border: 2px solid #b3a2d4; 
            padding: 15px; 
            margin-bottom: 20px; 
            border-radius: 10px; 
            page-break-inside: avoid; 
            background: #fafafa;
          }
          
          .dia h3 {
            color: #b3a2d4;
            font-family: 'Playfair Display', serif;
            font-size: 18px;
            margin-bottom: 12px;
            padding-bottom: 8px;
            border-bottom: 2px solid #e0e0e0;
          }
          
          table { 
            width: 100%; 
            border-collapse: collapse; 
            font-size: 13px; 
            background: white;
          }
          
          td { 
            padding: 8px 12px; 
            border-bottom: 1px solid #f0f0f0; 
          }
          
          td:first-child { 
            color: #8fa98f; 
            font-weight: 600; 
            width: 35%; 
          }
          
          .no-data {
            color: #999;
            font-style: italic;
            padding: 20px;
            text-align: center;
            background: #f5f5f5;
            border-radius: 8px;
          }
          
          .footer-info {
            text-align: center;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 2px solid #e0e0e0;
            color: #666;
            font-size: 12px;
          }
          
          .btn-container {
            text-align: center;
            margin: 20px 0;
            padding: 20px;
            background: #f0f0f0;
            border-radius: 10px;
          }
          
          .btn-download {
            background: #8fa98f;
            color: white;
            padding: 12px 30px;
            border: none;
            border-radius: 8px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            font-family: 'Playfair Display', serif;
            transition: all 0.3s;
          }
          
          .btn-download:hover {
            background: #7a8f7a;
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(143, 169, 143, 0.4);
          }
          
          @media print {
            body { 
              background: white;
              padding: 0;
            }
            
            .container {
              box-shadow: none;
              padding: 15mm;
            }
            
            .btn-container {
              display: none;
            }
            
            .footer-info {
              position: fixed;
              bottom: 0;
              left: 0;
              right: 0;
              padding: 10px;
              background: white;
              border-top: 1px solid #ddd;
            }
            
            @page {
              margin: 15mm;
            }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="btn-container">
            <button class="btn-download" onclick="window.print()">
              📥 Descargar PDF
            </button>
          </div>
          <h1>Diario Riliprubart</h1>
          <h2>Semana ${semanaActual}</h2>
          <div class="subtitle">
            Estudio MOBILIZE<br>
            Carla González - Paciente N° 310002
          </div>
    `;
    
    // Generar contenido de cada día
    for (let d = 1; d <= 7; d++) {
      const dia = semanaData ? semanaData[`dia_${d}`] : null;
      const diaProtocolo = calcularDiaProtocolo(semanaActual, d);
      
      html += `
        <div class="dia">
          <h3>Día ${d} (Día ${diaProtocolo} del protocolo)</h3>
      `;
      
      if (dia && (dia.fecha || dia.hora_inyeccion)) {
        html += `
          <table>
            <tr><td>Fecha:</td><td>${dia.fecha || '-'}</td></tr>
            <tr><td>Hora de inyección:</td><td>${dia.hora_inyeccion || '-'}</td></tr>
            <tr><td>Zona de aplicación:</td><td>${dia.zona_aplicacion || '-'}</td></tr>
            <tr><td>Energía:</td><td>${dia.energia || 0}/10</td></tr>
            <tr><td>Dolor / sensibilidad:</td><td>${dia.dolor || 0}/10</td></tr>
            <tr><td>Coordinación:</td><td>${dia.coordinacion || '-'}</td></tr>
            <tr><td>Movilidad:</td><td>${dia.movilidad || '-'}</td></tr>
            <tr><td>Fatiga:</td><td>${dia.fatiga || 0}/10</td></tr>
            <tr><td>Sueño:</td><td>${dia.sueno_horas || '-'} horas - ${dia.sueno_calidad || '-'}</td></tr>
            <tr><td>Estado de ánimo:</td><td>${dia.estado_animo || 0}/10</td></tr>
            <tr><td>Cambios físicos:</td><td>${dia.cambios_fisicos || '-'}</td></tr>
            <tr><td>Síntomas:</td><td>${dia.sintomas || '-'}</td></tr>
            <tr><td>Observaciones:</td><td>${dia.observaciones || '-'}</td></tr>
          </table>
        `;
      } else {
        html += '<p class="no-data">Este día no ha sido completado</p>';
      }
      
      html += '</div>';
    }
    
    html += `
          <div class="footer-info">
            <strong>Carla González</strong> - Paciente N° 310002<br>
            Hospital General de Agudos Dr. José María Ramos Mejía<br>
            Estudio MOBILIZE - Riliprubart
          </div>
        </div>
        
        <script>
          // Auto-abrir diálogo de impresión después de cargar
          window.onload = function() {
            setTimeout(function() {
              window.print();
            }, 800);
          };
        </script>
      </body>
      </html>
    `;
    
    ventana.document.write(html);
    ventana.document.close();
    
    mostrarNotificacion('✓ Ventana de impresión abierta', 'success');
    
  } catch (error) {
    console.error('Error:', error);
    mostrarNotificacion('✕ Error al generar', 'error');
  }
}

// ==========================================
// EXPORTAR CSV
// ==========================================

async function exportarCSV() {
  const snapshot = await db.ref('diario').once('value');
  const data = snapshot.val();
  
  if (!data) { alert('No hay datos'); return; }
  
  let csv = 'Semana,Día,Fecha,Hora,Zona,Energía,Dolor,Coordinación,Movilidad,Fatiga,Sueño Hs,Sueño Calidad,Ánimo,Cambios,Síntomas,Observaciones\n';
  
  Object.keys(data).sort().forEach(semanaKey => {
    const semana = data[semanaKey];
    const semanaNum = semanaKey.replace('semana_', '');
    
    Object.keys(semana).sort().forEach(diaKey => {
      const dia = semana[diaKey];
      const diaNum = diaKey.replace('dia_', '');
      
      if (dia) {
        const esc = (str) => !str ? '' : '"' + String(str).replace(/"/g, '""') + '"';
        csv += `${semanaNum},${diaNum},${esc(dia.fecha)},${esc(dia.hora_inyeccion)},${esc(dia.zona_aplicacion)},${dia.energia || ''},${dia.dolor || ''},${esc(dia.coordinacion)},${esc(dia.movilidad)},${dia.fatiga || ''},${dia.sueno_horas || ''},${esc(dia.sueno_calidad)},${dia.estado_animo || ''},${esc(dia.cambios_fisicos)},${esc(dia.sintomas)},${esc(dia.observaciones)}\n`;
      }
    });
  });
  
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `diario_${new Date().toISOString().split('T')[0]}.csv`;
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  mostrarNotificacion('✓ CSV exportado', 'success');
}

// ==========================================
// INICIALIZACIÓN
// ==========================================

window.onload = verificarSesion;