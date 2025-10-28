# Diario de Tratamiento - Riliprubart

Aplicación web para el seguimiento de tratamiento médico.

## 🚀 Configuración

1. **Clonar el repositorio**
```bash
   git clone https://github.com/TU_USUARIO/diario-tratamiento.git
```

2. **Configurar credenciales**
   - Copia `config.example.js` y renómbralo a `config.js`
   - Completa con tus credenciales de Firebase
   - Define tus usuarios y contraseñas

3. **Firebase Setup**
   - Crea un proyecto en [Firebase Console](https://console.firebase.google.com)
   - Habilita Realtime Database
   - Configura las reglas de seguridad (ver abajo)

4. **Abrir en navegador**
   - Abre `index.html` directamente o usa un servidor local

## 🔥 Reglas de Firebase
```json
{
  "rules": {
    "diario": {
      ".read": true,
      ".write": true
    }
  }
}
```

## 📦 Tecnologías

- HTML5
- CSS3
- JavaScript (Vanilla)
- Firebase Realtime Database

## ⚠️ Nota de Seguridad

Este proyecto usa autenticación básica en el frontend. Para producción, 
considera implementar Firebase Authentication.

- Creado por Carla González