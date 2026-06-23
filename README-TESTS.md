# Manual de Pruebas Unitarias y Cobertura (Vitest + Angular 18)

Este documento detalla la suite de pruebas unitarias desarrollada para la aplicación cliente en Angular, incluyendo la migración del motor de pruebas de **Karma/Jasmine** a **Vitest**, los detalles de las pruebas implementadas para cada componente/servicio y el reporte de cobertura de código obtenido.

---

## 1. Resumen Ejecutivo de las Pruebas

- **Total de archivos de prueba (`.spec.ts`)**: 9
- **Total de pruebas unitarias**: 89
- **Estado final**: **89 exitosas (100% de éxito)** 
- **Tiempo de ejecución total**: ~1.4 segundos
- **Cobertura de código final (Statements/Lines)**: **99.62%**

### Métrica de Cobertura de Código

| Métrica | Cobertura | Descripción |
| :--- | :---: | :--- |
| **Sentencias (Statements)** | **99.62%** (265/266) | Prácticamente todas las sentencias del sistema fueron validadas. |
| **Ramas (Branches)** | **94.02%** (63/67) | Evaluación de todos los flujos lógicos (if/else, switch, etc.). |
| **Funciones (Functions)** | **98.90%** (90/91) | Pruebas de inicialización, callbacks, eventos y métodos de negocio. |
| **Líneas (Lines)** | **99.62%** (259/260) | Evaluación línea por línea de la lógica de negocio. |

---

## 2. Detalle de Pruebas Unitarias por Componente y Servicio

A continuación, se describen las pruebas desarrolladas para los 9 archivos de especificación:

### A. Servicios de Datos y Utilidades

#### 1. [toast.service.spec.ts](file:///c:/Users/Usuario-PC/Desktop/Respaldos%20Cliente%20Leonel%20Tipan/Desktop/Universidad/8vosemestre/Pruebas/Pruebas-Proyecto-1P/client/src/app/services/toast.service.spec.ts) (4 pruebas)
Prueba la lógica de notificaciones en tiempo real (Toasts) de la aplicación:
- **should be created**: Valida la instanciación correcta del servicio.
- **should initial toast value be null**: Confirma que el estado inicial del toast es `null`.
- **should show toast message and type, and clear it after 3000ms**: Valida que al llamar a `showToast` se emita el mensaje con su tipo, y que exactamente 3000ms después se auto-oculte (`null`). *Nota: Se usa mock de temporizadores con `vi.useFakeTimers()` para simular el paso del tiempo de forma síncrona sin bloquear la CPU.*
- **should default to success type when type is not specified**: Valida que si se omite el tipo de toast, el sistema por defecto asigne `'success'`.

#### 2. [api.service.spec.ts](file:///c:/Users/Usuario-PC/Desktop/Respaldos%20Cliente%20Leonel%20Tipan/Desktop/Universidad/8vosemestre/Pruebas/Pruebas-Proyecto-1P/client/src/app/services/api.service.spec.ts) (20 pruebas)
Mockea por completo el servicio `HttpClient` mediante `HttpTestingController` para probar de forma segura las operaciones CRUD y el estado de red:
- **Operaciones de Doctores**: Pruebas para obtener la lista de doctores (`GET`), crear (`POST`), actualizar (`PUT`) y eliminar (`DELETE`).
- **Operaciones de Pacientes**: Validación del CRUD de pacientes y mapeo correcto de propiedades.
- **Operaciones de Medicamentos**: Validación del CRUD de medicamentos, precios y existencias.
- **Operaciones de Especialidades**: CRUD de especialidades médicas.
- **Monitoreo de Red (Conectividad)**:
  - Valida el comportamiento inicial del servidor (`serverStatus$`).
  - Prueba la verificación periódica de conectividad (cada 5000ms) simulando respuestas exitosas y fallidas del backend y verificando la actualización reactiva del estado a `true` o `false`.

---

### B. Componentes Reutilizables de la Interfaz

#### 3. [toast.component.spec.ts](file:///c:/Users/Usuario-PC/Desktop/Respaldos%20Cliente%20Leonel%20Tipan/Desktop/Universidad/8vosemestre/Pruebas/Pruebas-Proyecto-1P/client/src/app/components/toast/toast.component.spec.ts) (4 pruebas)
Prueba la interacción del componente visual del Toast con el DOM:
- **should create**: Instanciación correcta.
- **should not show toast when service emits null**: Verifica que no se renderice el contenedor del toast si no hay notificaciones activas.
- **should display toast message and apply correct CSS class**: Valida el renderizado correcto del texto y que se apliquen las clases dinámicas CSS correspondientes al tipo de alerta (ej: clase `bg-danger` para un tipo `error`).
- **should clear toast when close button is clicked**: Verifica que el botón de cerrar (`×`) dispare la acción de limpiar en el `ToastService`.

#### 4. [sidebar.component.spec.ts](file:///c:/Users/Usuario-PC/Desktop/Respaldos%20Cliente%20Leonel%20Tipan/Desktop/Universidad/8vosemestre/Pruebas/Pruebas-Proyecto-1P/client/src/app/components/sidebar/sidebar.component.spec.ts) (4 pruebas)
Valida la barra lateral de navegación:
- **should create**: Instanciación correcta.
- **should have initial activeTab as "doctors"**: Confirma la pestaña inicial por defecto.
- **should select tab and emit event on selectTab()**: Comprueba que al hacer clic en un enlace de navegación, se actualice la propiedad `activeTab` y se emita el evento hacia el componente padre (`tabSelected`).
- **should receive serverStatus$ from ApiService**: Comprueba de forma reactiva asíncrona (usando promesas) que el componente refleje el indicador de estado de red (`Online`/`Offline`) de acuerdo al flujo de datos del servicio API.

#### 5. [app.component.spec.ts](file:///c:/Users/Usuario-PC/Desktop/Respaldos%20Cliente%20Leonel%20Tipan/Desktop/Universidad/8vosemestre/Pruebas/Pruebas-Proyecto-1P/client/src/app/app.component.spec.ts) (3 pruebas)
Valida el componente raíz de la aplicación:
- **should create**: Instanciación del layout general.
- **should have initial activeTab as "doctors"**: El tab inicial es la sección de doctores.
- **should update activeTab when selectTab is called**: Comprueba que el componente responda al evento emitido por el Sidebar y actualice la sección activa (ej: alternar a Pacientes, Medicamentos o Especialidades).

---

### C. Módulos de Gestión (CRUDs)

#### 6. [doctors.component.spec.ts](file:///c:/Users/Usuario-PC/Desktop/Respaldos%20Cliente%20Leonel%20Tipan/Desktop/Universidad/8vosemestre/Pruebas/Pruebas-Proyecto-1P/client/src/app/modules/doctors/doctors.component.spec.ts) (14 pruebas)
Pruebas exhaustivas para el módulo de Doctores:
- **Formularios y Validaciones**: Campos obligatorios (nombre, especialidad, etc.) y formato de correo electrónico.
- **Carga de Datos**: Recuperación inicial de doctores de la API y manejo de errores.
- **Operaciones de Creación y Edición**: Envío de datos válidos, control del flujo de edición, llamadas a la API y notificaciones visuales exitosas/erróneas a través de `ToastService`.
- **Eliminación**: Confirmación interactiva mediante `window.confirm`. Si el usuario confirma, realiza el borrado; si cancela, detiene la operación.

#### 7. [patients.component.spec.ts](file:///c:/Users/Usuario-PC/Desktop/Respaldos%20Cliente%20Leonel%20Tipan/Desktop/Universidad/8vosemestre/Pruebas/Pruebas-Proyecto-1P/client/src/app/modules/patients/patients.component.spec.ts) (14 pruebas)
Valida la gestión de Pacientes:
- Mismos flujos CRUD (carga, validación de campos obligatorios, creación, edición, eliminación con confirmación interactiva y notificaciones).
- **Default gender**: Valida que al limpiar/inicializar el formulario, el género por defecto se configure automáticamente como `'M'` (Masculino).

#### 8. [medicines.component.spec.ts](file:///c:/Users/Usuario-PC/Desktop/Respaldos%20Cliente%20Leonel%20Tipan/Desktop/Universidad/8vosemestre/Pruebas/Pruebas-Proyecto-1P/client/src/app/modules/medicines/medicines.component.spec.ts) (13 pruebas)
Valida la gestión del catálogo de Medicamentos:
- Validación de campos obligatorios (nombre, precio, stock).
- Creación de nuevos registros, actualización de precios y existencias.
- Eliminación con control de flujo de confirmación.

#### 9. [specialties.component.spec.ts](file:///c:/Users/Usuario-PC/Desktop/Respaldos%20Cliente%20Leonel%20Tipan/Desktop/Universidad/8vosemestre/Pruebas/Pruebas-Proyecto-1P/client/src/app/modules/specialties/specialties.component.spec.ts) (13 pruebas)
Valida la gestión de Especialidades médicas:
- Validación de campos obligatorios (nombre, descripción opcional).
- Flujos de creación, modificación y eliminación con confirmación interactiva.

---

## 3. Arquitectura de la Suite de Pruebas (Vitest + JSDOM)

Se eliminaron por completo las dependencias de Karma y Jasmine para solventar los bloqueos locales del navegador. El nuevo motor de pruebas está compuesto por:

1. **Vitest (`^1.6.1`)**: Ejecutor de pruebas ligero que reemplaza a Karma. Corre de forma headless directamente en Node.js.
2. **JSDOM (`^29.1.1`)**: Simula el entorno del navegador web y del DOM en memoria (permitiendo ejecutar `document`, `window`, etc. de forma virtual).
3. **AnalogJS Plugins (`~1.9.0`)**:
   - `@analogjs/vite-plugin-angular`: Plugin que compila componentes de Angular utilizando el compilador JIT/AOT de Angular en Vite.
   - `@analogjs/vitest-angular`: Configura y parchea las variables y timers globales de Angular para que el testing en zonas (`zone.js`) funcione sin Chrome.

### Configuración del TestBed Compartido

Uno de los mayores retos de usar Vitest en Angular es que las pruebas se ejecutan de manera aislada. Si el entorno se inicializa en el archivo setup, pero los tests importan una instancia duplicada del paquete `@angular/core/testing`, se genera el error:
`NullInjectorError: No provider for TestComponentRenderer!`

Esto se resolvió configurando el inlining de módulos en el archivo **[vitest.config.mts](file:///c:/Users/Usuario-PC/Desktop/Respaldos%20Cliente%20Leonel%20Tipan/Desktop/Universidad/8vosemestre/Pruebas/Pruebas-Proyecto-1P/client/vitest.config.mts)**:
```typescript
server: {
  deps: {
    inline: [/@angular/, /@analogjs/],
  },
}
```
Esto fuerza a Vite a procesar todos los módulos de Angular y AnalogJS de forma centralizada, garantizando que el `TestBed` inicializado en [test-setup.ts](file:///c:/Users/Usuario-PC/Desktop/Respaldos%20Cliente%20Leonel%20Tipan/Desktop/Universidad/8vosemestre/Pruebas/Pruebas-Proyecto-1P/client/src/test-setup.ts) sea exactamente el mismo que consumen las pruebas en ejecución.

---

## 4. Comandos de Ejecución y Cobertura

Para ejecutar las pruebas y analizar los resultados desde la carpeta `client`, utiliza los siguientes comandos:

### A. Ejecutar Pruebas Unitarias
```bash
# Opción 1 (Mediante Angular CLI):
ng test

# Opción 2 (Mediante NPM Scripts):
npm run test
```

### B. Generar Reporte de Cobertura de Código
```bash
npm run test:coverage
```
El reporte HTML interactivo se generará en el directorio `client/coverage/html`. Puedes abrir el archivo `index.html` en cualquier navegador web para explorar el desglose línea por línea de la cobertura de código.
