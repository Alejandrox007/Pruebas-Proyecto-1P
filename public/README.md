# 🖥️ Interfaz Gráfica - Hospital API

Interfaz web interactiva para gestionar la API del Hospital.

## 🚀 Iniciar el Servidor

```bash
npm start
```

El servidor iniciará en `http://localhost:3000`

## 📋 Características

### ✅ Gestión Completa de Entidades
- **Doctores** 👨‍⚕️: Crear, editar, listar y eliminar doctores
- **Pacientes** 👥: Gestión completa de pacientes
- **Medicamentos** 💊: Control de inventario de medicamentos
- **Especialidades** 🏥: Administrar especialidades médicas

### 🎨 Interfaz Moderna
- Diseño responsive (funciona en móviles y tablets)
- Animaciones suaves
- Notificaciones tipo toast
- Validación de formularios

### ✅ Pestaña de Tests
- Ver resultados de tests ejecutados
- Estadísticas de cobertura
- Información en tiempo real

## 📂 Estructura de la Interfaz

```
public/
├── index.html    # Estructura HTML principal
├── styles.css    # Estilos CSS (diseño moderno)
└── app.js        # Lógica JavaScript (fetch API)
```

## 🔧 Uso

1. **Iniciar el servidor:**
   ```bash
   npm start
   ```

2. **Abrir el navegador:**
   ```
   http://localhost:3000
   ```

3. **Navegar por las pestañas:**
   - Doctores
   - Pacientes
   - Medicamentos
   - Especialidades
   - Tests

4. **Realizar operaciones CRUD:**
   - **Crear**: Llenar el formulario y hacer clic en "Guardar"
   - **Editar**: Click en botón "✏️ Editar" de cualquier elemento
   - **Eliminar**: Click en botón "🗑️ Eliminar" (con confirmación)
   - **Listar**: Automático al cambiar de pestaña

## 🌐 API Endpoints Utilizados

| Entidad | GET | POST | PUT | DELETE |
|---------|-----|------|-----|--------|
| Doctores | `/api/doctores` | `/api/doctores` | `/api/doctores/:id` | `/api/doctores/:id` |
| Pacientes | `/api/pacientes` | `/api/pacientes` | `/api/pacientes/:id` | `/api/pacientes/:id` |
| Medicamentos | `/api/medicamentos` | `/api/medicamentos` | `/api/medicamentos/:id` | `/api/medicamentos/:id` |
| Especialidades | `/api/especialidades` | `/api/especialidades` | `/api/especialidades/:id` | `/api/especialidades/:id` |

## 🎯 Características Técnicas

### Frontend
- **HTML5**: Estructura semántica
- **CSS3**: Grid, Flexbox, animaciones
- **Vanilla JavaScript**: Fetch API, DOM manipulation
- **Responsive Design**: Mobile-first approach

### Backend
- **Express.js**: Servidor web
- **CORS habilitado**: Permite requests desde el frontend
- **Archivos estáticos**: Servidos desde `/public`

## 📱 Screenshots

### Pantalla de Doctores
- Formulario de creación/edición
- Lista de doctores registrados
- Botones de acción (Editar/Eliminar)

### Pantalla de Tests
- Ejecutar tests desde la interfaz
- Ver resultados en tiempo real
- Estadísticas de cobertura

## ⚡ Notificaciones

La interfaz muestra notificaciones tipo toast para:
- ✅ Operaciones exitosas (verde)
- ❌ Errores (rojo)
- ⚠️ Advertencias (amarillo)

## 🔐 Validaciones

- Campos requeridos marcados con `*`
- Validación de formato de email
- Confirmación antes de eliminar
- Prevención de números de licencia duplicados (doctores)
- Prevención de especialidades duplicadas

## 🎨 Paleta de Colores

- **Primary**: `#2563eb` (Azul)
- **Success**: `#10b981` (Verde)
- **Danger**: `#ef4444` (Rojo)
- **Warning**: `#f59e0b` (Naranja)
- **Background**: `#f8fafc` (Gris claro)

## 🚀 Próximas Mejoras

- [ ] Búsqueda y filtrado de registros
- [ ] Paginación para listas grandes
- [ ] Exportar datos a CSV/Excel
- [ ] Gráficos y estadísticas
- [ ] Modo oscuro
- [ ] Autenticación de usuarios

## 📝 Notas

- La interfaz se conecta a `http://localhost:3000/api`
- Los datos se almacenan en memoria (se pierden al reiniciar)
- Para producción, considerar usar una base de datos real

---

**¡Disfruta usando la interfaz! 🎉**
