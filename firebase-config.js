// firebase-config.js - NO SUBIR A GITHUB
const USUARIOS = {
    "carla": {
        password: "carla2025",
        rol: "paciente",
        nombre: "Carla González",
        paciente_id: "310002",
        hospital: "Hospital General de Agudos Dr. José María Ramos Mejía",
        patrocinadora: "Dra. Florencia Aguirre"
    },
    "neuro": {
        password: "medico2025",
        rol: "medico",
        nombre: "Dra. Florencia Aguirre",
        especialidad: "Neurología"
    }
};

const firebaseConfig = {
    apiKey: "AIzaSyA49CptY_U_qW-i4F4Vec4nm54ZmNKLmNk",
    authDomain: "diario-riliprubart.firebaseapp.com",
    databaseURL: "https://diario-riliprubart-default-rtdb.firebaseio.com",
    projectId: "diario-riliprubart",
    storageBucket: "diario-riliprubart.firebasestorage.app",
    messagingSenderId: "734159582319",
    appId: "1:734159582319:web:6368e56d3af7f5bc67499a",
    measurementId: "G-3J4CB1NMN1"
};