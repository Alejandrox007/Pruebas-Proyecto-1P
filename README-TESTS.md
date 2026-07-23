# Estrategia de pruebas

- Jest + Supertest + pg-mem: 23 pruebas de integración y unidad del backend, sin depender de una base externa.
- Vitest + Angular Testing: autenticación, interceptor JWT, servicios, componentes, CRUD, citas y recetas.
- Postman/Newman: flujo completo desde login de administrador hasta receta, incluida una verificación negativa de permisos.
- JMeter: carga autenticada con health, login y consulta administrativa.
- k6: smoke, carga gradual y estrés con umbrales que hacen fallar CI.
- SonarQube: consume los reportes LCOV de backend y frontend, espera el Quality Gate y bloquea los despliegues si falla.
- Docker: el workflow compila la imagen de producción para detectar errores antes del despliegue.
- Vercel y Render: solo despliegan desde `main` después de superar toda la compuerta de calidad.

Los comandos exactos están documentados en [README.md](README.md).
