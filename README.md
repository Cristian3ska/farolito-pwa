# ☕ El Farolito — PWA de Lealtad

<p align="center">
  <img src="public/images/farolito-blanco.png" alt="El Farolito" height="80"/>
</p>

<p align="center">
  <strong>Tarjeta de sellos digital para El Farolito, café de especialidad.</strong><br>
  Progressive Web App construida con Angular 17, Firebase y diseño iOS‑minimalista.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Angular-17-red?logo=angular" alt="Angular 17"/>
  <img src="https://img.shields.io/badge/Firebase-Firestore%20%7C%20Auth-orange?logo=firebase" alt="Firebase"/>
  <img src="https://img.shields.io/badge/PWA-Installable-5ca0d1?logo=pwa" alt="PWA"/>
  <img src="https://img.shields.io/badge/License-MIT-green" alt="MIT"/>
</p>

---

## 📱 Capturas de pantalla

| Login | Tarjeta de Lealtad | Panel Barista |
|---|---|---|
| Pantalla de ingreso con Google o Magic Link | Tarjeta con sellos y progreso | Escáner QR + lista de clientes |

---

## 🚀 Descripción del proyecto

**El Farolito PWA** es una aplicación web progresiva (PWA) diseñada para gestionar un **programa de lealtad digital** para un café de especialidad. Los clientes acumulan sellos digitales con cada visita y, al completar 10 sellos, obtienen un café de cortesía.

La app está dividida en dos flujos principales:

- 👤 **Flujo cliente** — Registro, tarjeta digital, código QR personal e historial de visitas.
- ☕ **Flujo barista** — Escáner de QR, gestión de clientes y edición del menú en tiempo real.

---

## ✨ Funcionalidades

### Para el cliente
| Función | Descripción |
|---|---|
| 🔐 **Login sin contraseña** | Google Sign-In o Magic Link por correo electrónico |
| 🎴 **Tarjeta de sellos digital** | Visualización de progreso (0–10) con la imagen de El Farolito |
| 📲 **Código QR personal** | El cliente muestra su QR dinámico al barista para recibir sellos |
| 📜 **Historial de visitas** | Lista de sellos y canjes anteriores con fecha |
| 📥 **Instalable como app** | "Añadir a pantalla de inicio" en iOS y Android (PWA) |
| 🍽️ **Menú / Nuestra Carta** | Consulta de bebidas y snacks disponibles |

### Para el barista (admin)
| Función | Descripción |
|---|---|
| 📷 **Escáner de QR** | Leer el código QR del cliente con la cámara del dispositivo |
| ✅ **Animación de éxito** | Check verde animado al escanear correctamente |
| 👥 **Lista de clientes** | Ver todos los clientes registrados, buscar por nombre/correo |
| ✏️ **Editor de menú** | Agregar, editar y eliminar productos del menú en tiempo real |
| 🗂️ **Categorías dinámicas** | Selector de categoría con opción de agregar nuevas categorías |
| ☁️ **Sincronización Firebase** | Todo en tiempo real con Firestore |

---

## 🛠️ Stack tecnológico

| Herramienta | Descripción |
|---|---|
| **Angular 17** (Standalone) | Framework principal, componentes standalone con Signals |
| **Firebase Authentication** | Google Sign-In + Email Magic Link, sesión persistente |
| **Cloud Firestore** | Base de datos NoSQL en tiempo real |
| **@angular/fire** | Integración oficial Firebase para Angular |
| **html5-qrcode** | Escáner de QR via cámara del dispositivo |
| **qrcode** | Generación del código QR dinámico del cliente |
| **Angular PWA** | Service Worker, manifest, instalación nativa |
| **SCSS** | Estilos con variables personalizadas, glassmorphism y micro-animaciones |
| **ngrok** | Túnel HTTPS para pruebas en dispositivos físicos |

---

## 🏗️ Arquitectura del proyecto

```
src/
├── app/
│   ├── components/
│   │   └── bottom-nav/         # Barra de navegación inferior (oculta en /login)
│   ├── guards/
│   │   ├── auth.guard.ts       # Protege rutas para usuarios autenticados
│   │   └── admin.guard.ts      # Protege /barista solo para el admin
│   ├── pages/
│   │   ├── login/              # Autenticación (Google + Magic Link)
│   │   ├── home/               # Tarjeta de sellos del cliente
│   │   ├── qr/                 # Muestra el QR personal del cliente
│   │   ├── menu/               # Carta de bebidas y snacks
│   │   ├── profile/            # Perfil e historial del cliente
│   │   └── barista/            # Panel admin: scanner, clientes, menú
│   └── services/
│       ├── auth.service.ts     # Manejo de sesión, roles y usuario actual
│       ├── loyalty.service.ts  # Sellos, historial, tarjetas de clientes
│       └── menu.service.ts     # CRUD de elementos del menú (Firestore)
├── environments/
│   └── environment.ts          # Configuración de Firebase
public/
├── icons/
│   └── circulo-blanco.png      # Icono de la PWA
├── images/
│   └── farolito-blanco.png     # Logo del café
└── manifest.webmanifest        # Configuración de instalación PWA
```

---

## 🔐 Roles y seguridad

La aplicación implementa un sistema de **Control de Acceso Basado en Roles (RBAC)**:

- **Cliente** — Cualquier usuario autenticado. Solo puede ver y modificar su propia tarjeta.
- **Barista/Admin** — Únicamente la cuenta `farolito.coffee@gmail.com`. Tiene acceso total al Panel Barista.

### Reglas de Firestore recomendadas

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    function isBarista() {
      return request.auth != null && request.auth.token.email == "farolito.coffee@gmail.com";
    }

    match /loyaltyCards/{uid} {
      allow read: if request.auth != null && (request.auth.uid == uid || isBarista());
      allow write: if request.auth != null && (request.auth.uid == uid || isBarista());
    }

    match /visitHistory/{id} {
      allow read: if request.auth != null && (request.auth.uid == resource.data.uid || isBarista());
      allow create: if request.auth != null && (request.auth.uid == request.resource.data.uid || isBarista());
      allow update, delete: if isBarista();
    }

    match /menuItems/{item} {
      allow read: if true;
      allow write: if isBarista();
    }
  }
}
```

---

## ⚙️ Configuración y puesta en marcha

### Prerrequisitos
- Node.js >= 18
- Angular CLI: `npm install -g @angular/cli`
- Cuenta en [Firebase](https://console.firebase.google.com/)

### 1. Clona el repositorio

```bash
git clone https://github.com/Cristian3ska/farolito-pwa.git
cd farolito-pwa
npm install
```

### 2. Configura Firebase

Crea un proyecto en Firebase con:
- **Authentication** habilitada (Google + Email/Password)
- **Firestore Database** en modo producción

Edita `src/environments/environment.ts` con tus credenciales:

```typescript
export const environment = {
  production: false,
  firebase: {
    apiKey: "TU_API_KEY",
    authDomain: "TU_PROYECTO.firebaseapp.com",
    projectId: "TU_PROYECTO",
    storageBucket: "TU_PROYECTO.firebasestorage.app",
    messagingSenderId: "TU_SENDER_ID",
    appId: "TU_APP_ID"
  }
};
```

### 3. Inicia en desarrollo

```bash
npm start
# App disponible en http://localhost:4200
```

### 4. Pruebas en dispositivo físico (requiere HTTPS)

```bash
# En otra terminal (ngrok debe estar instalado)
ngrok http 4200
```

Abre la URL HTTPS de ngrok en tu celular para usar la cámara y probar el escáner QR.

### 5. Build de producción

```bash
npm run build
# Build en dist/
```

---

## 🗄️ Colecciones en Firestore

### `loyaltyCards/{uid}`
```json
{
  "uid": "string",
  "name": "string",
  "email": "string",
  "stamps": 0,
  "totalStamps": 0,
  "maxStamps": 10,
  "lastRedeemed": null,
  "createdAt": "Timestamp"
}
```

### `visitHistory/{id}`
```json
{
  "uid": "string",
  "type": "stamp | redeem",
  "date": "Timestamp",
  "baristaId": "string",
  "note": "string"
}
```

### `menuItems/{id}`
```json
{
  "name": "string",
  "description": "string",
  "price": "string",
  "emoji": "string",
  "category": "string"
}
```

---

## 🎨 Sistema de diseño

La app utiliza un sistema de diseño oscuro e iOS-inspirado definido en variables CSS globales:

| Variable | Color | Uso |
|---|---|---|
| `--bg` | `#1c1620` | Fondo principal |
| `--surface-1..3` | Grises oscuros | Tarjetas y superficies |
| `--blue` | `#5ca0d1` | Acento principal, botones |
| `--sand` | `#f1cfa3` | Acento cálido, sellos |
| `--steel` | `#5a85a4` | Bordes y detalles |

---

## 📦 Scripts disponibles

| Comando | Descripción |
|---|---|
| `npm start` | Inicia el servidor de desarrollo |
| `npm run build` | Build de producción |
| `npm test` | Ejecuta las pruebas unitarias |

---

## 🗺️ Próximas mejoras (Roadmap)

- [ ] 🔔 Push Notifications con Firebase Cloud Messaging
- [ ] 🌐 Deploy en Firebase Hosting
- [ ] 📊 Dashboard de analytics para el barista
- [ ] 🗓️ Historial de sellos con gráfica mensual
- [ ] 🌙 Soporte offline mejorado con Service Worker

---

## 📄 Licencia

Este proyecto está bajo la licencia **MIT**. Consulta el archivo `LICENSE` para más detalles.

---

<p align="center">
  Hecho con ❤️ y mucho café por el equipo de <strong>El Farolito</strong>
</p>
