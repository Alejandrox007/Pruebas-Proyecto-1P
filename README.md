# Hospital Ops

Aplicación clínica funcional con API Express, PostgreSQL y cliente Angular. Incluye autenticación real, autorización por roles, reglas para citas y recetas, validación estricta y una compuerta CI/CD antes del despliegue en Vercel o Render.

## Roles y reglas

- `client`: es el único rol que puede registrarse públicamente. Gestiona su perfil, agenda/cancela sus citas y consulta sus recetas.
- `doctor`: no puede registrarse. Su cuenta la crea un administrador; ve únicamente pacientes con citas asignadas, gestiona estados de sus citas y emite recetas después de completar una atención.
- `admin`: consulta todo el sistema, crea/desactiva médicos y administra especialidades, medicamentos y pacientes.
- No se permiten dobles reservas de un médico. Las citas se crean con al menos dos horas de anticipación, de lunes a viernes entre 08:00 y 18:00, en intervalos de 30 minutos.
- Un médico o paciente con citas futuras activas no puede eliminarse/desactivarse.

## Inicio local

Requisitos: Node.js 24 y PostgreSQL 16.

```bash
cp .env.example .env
npm ci
npm ci --prefix client
npm run db:migrate
npm --prefix client run build
npm start
```

Abre `http://localhost:3000`. Cambia obligatoriamente `ADMIN_PASSWORD` y `JWT_SECRET` fuera del entorno local.

## Inicio inmediato con Docker

Requisito: Docker con Compose.

```bash
docker compose up --build
```

Abre `http://localhost:3000`. La primera ejecución crea PostgreSQL, aplica el esquema y genera el administrador:

- Correo: `admin@hospital.local`
- Contraseña: `ChangeMe123!`

Para definir credenciales seguras antes de levantar los contenedores:

```bash
JWT_SECRET="una-clave-aleatoria-de-al-menos-32-caracteres" \
ADMIN_EMAIL="admin@midominio.com" \
ADMIN_PASSWORD="UnaClaveSegura123!" \
docker compose up --build
```

Comandos útiles:

```bash
docker compose ps
docker compose logs -f app
docker compose down
docker compose down --volumes
```

El último comando también elimina la base local y debe utilizarse solamente cuando se quiera reiniciar todos los datos.

Si reemplazaste el código por una versión corregida, fuerza una reconstrucción limpia y actualiza el navegador:

```bash
docker compose down
docker compose build --no-cache
docker compose up
```

Después usa `Ctrl + Shift + R` en el navegador. No es necesario eliminar el volumen para conservar los usuarios y datos existentes.

## Calidad

```bash
npm run lint
npm run test:coverage
npm run test:client:coverage
npm --prefix client run build
npm run security:audit
```

El backend exige 100% en líneas, ramas, funciones y sentencias. El cliente exige 100% en líneas y funciones; además mantiene umbrales explícitos de sentencias y ramas.

Pruebas adicionales:

```bash
npx newman run "postman/Hospital API - Pruebas Completas.postman_collection.json"
jmeter -n -t jmeter/hospital-business-flow.jmx
k6 run k6/smoke.js
k6 run k6/load.js
k6 run k6/stress.js
```

## Variables de producción

`DATABASE_URL`, `JWT_SECRET`, `JWT_EXPIRES_IN`, `ADMIN_EMAIL`, `ADMIN_PASSWORD` y `ALLOWED_ORIGINS`. Si PostgreSQL exige TLS, configura `DB_SSL=true` y entrega la CA mediante `DB_SSL_CA`.

Para GitHub Actions configura estos secretos:

- SonarQube: `SONAR_TOKEN` y `SONAR_HOST_URL`.
- Vercel: `VERCEL_TOKEN`, `VERCEL_ORG_ID` y `VERCEL_PROJECT_ID`.
- Render: `RENDER_DEPLOY_HOOK_URL`.

`render.yaml` permite crear en Render el servicio Docker y su PostgreSQL mediante un Blueprint. Configura allí `ADMIN_PASSWORD` y `ALLOWED_ORIGINS`; después copia el Deploy Hook del servicio al secreto `RENDER_DEPLOY_HOOK_URL`.

El workflow ejecuta lint, pruebas, cobertura, build, auditoría, SonarQube, Postman, JMeter, k6 y una compilación real de la imagen Docker. Los despliegues de Vercel y Render solo se ejecutan en `main` cuando todas esas validaciones pasan.
