# Hospital Client - Angular

Application Angular migrada desde vanilla JavaScript. Aplicación de gestión de hospital con módulos para Doctores, Pacientes, Medicamentos y Especialidades.

## Instalación

```bash
npm install
```

## Desarrollo

```bash
npm start
```

Accede a `http://localhost:4200/`

## Build

```bash
npm run build
```

## Estructura

- `src/app/services/` - Servicios de API
- `src/app/components/` - Componentes reutilizables
- `src/app/modules/` - Módulos de funcionalidad (Doctores, Pacientes, etc.)

## Dependencias

- Angular 18+
- RxJS
- Reactive Forms

## Pruebas Unitarias y Cobertura

Las pruebas unitarias del proyecto han sido migradas a **Vitest** y **jsdom** para mayor velocidad y para evitar problemas de bloqueos en navegadores externos.

Para más detalles sobre la estructura de las pruebas y la cobertura obtenida, consulta el archivo [README-TESTS.md](../README-TESTS.md) en la raíz del proyecto.

### Ejecutar Pruebas
```bash
# Ejecutar todas las pruebas unitarias una vez
ng test

# O equivalentemente:
npm run test
```

### Generar Reporte de Cobertura
```bash
npm run test:coverage
```
El reporte HTML interactivo se generará en la carpeta `coverage/`.

