// firebase-config.example.js
// Template de configuración de Firebase
// Instrucciones:
// 1. Copia este archivo y renómbralo a: firebase-config.js
// 2. Completa los valores con tus datos reales

const firebaseConfig = {
    apiKey: "TU_API_KEY",
    authDomain: "tu-proyecto.firebaseapp.com",
    databaseURL: "https://tu-proyecto.firebaseio.com",
    projectId: "tu-proyecto",
    storageBucket: "tu-proyecto.appspot.com",
    messagingSenderId: "XXXXXXXXXXX",
    appId: "XXXXXXXXXXX",
    measurementId: "G-XXXXXXX"
};

const USUARIOS = {
    "usuario_paciente": {
        password: "TU_PASSWORD_AQUI",
        rol: "paciente",
        nombre: "Nombre del Paciente",
        paciente_id: "XXXXXXX",
        hospital: "Nombre del Hospital",
        patrocinadora: "Nombre del Doctor/a"
    },
    "usuario_medico": {
        password: "TU_PASSWORD_AQUI",
        rol: "medico",
        nombre: "Nombre del Médico",
        especialidad: "Especialidad"
    }
};
