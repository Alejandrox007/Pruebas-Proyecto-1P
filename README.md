# Informe de Bugs y Security Hotspots detectados

## 1. Resumen del análisis

El proyecto fue analizado con SonarQube para identificar errores, malas prácticas, problemas de seguridad y puntos críticos dentro del código fuente.

El archivo principal analizado fue:

    src/app.js

Durante el análisis se detectaron problemas relacionados con ejecución insegura de comandos, uso de código dinámico, expresiones regulares vulnerables, exposición de información sensible y divulgación de tecnología del servidor.

## 2. Resultados generales de SonarQube

| Métrica | Resultado |
|---|---:|
| Bugs | 18 |
| Vulnerabilidades | 0 |
| Security Hotspots | 18 |
| Code Smells | 35 |
| Deuda técnica | 3h 42min |
| Cobertura de pruebas | 0.0% |
| Reliability | E |
| Security | A |
| Security Review | E |
| Maintainability | A |

Aunque SonarQube no detectó vulnerabilidades directas, sí marcó varios Security Hotspots. Estos puntos deben revisarse manualmente porque pueden convertirse en riesgos graves si el sistema se ejecuta en un entorno real.

## 3. Evidencia del análisis

### Resumen general de SonarQube

![Resumen general de SonarQube](https://github.com/user-attachments/assets/455cd7f1-4118-4ebf-8a03-eed42571bfd2)

### Ejecución insegura de comandos del sistema

![Ejecución insegura con exec](https://github.com/user-attachments/assets/9ac30eab-35e0-4383-8aa6-3bdd15a09053)

![Ejecución insegura con execSync](https://github.com/user-attachments/assets/d3e47abf-a257-4386-b29c-b0fe2a867413)

### Uso inseguro de eval

![Uso inseguro de eval](https://github.com/user-attachments/assets/606fb07f-362a-44d9-b41b-81e9f5da133e)

### Expresión regular vulnerable

![Regex vulnerable a ReDoS](https://github.com/user-attachments/assets/5442c192-7206-4a03-943b-d63a15ef63e7)

### Divulgación de tecnología del servidor

![Divulgación de tecnología Express](https://github.com/user-attachments/assets/4ccab2d8-1b8b-4f8f-9b21-ac82209d8096)

### Resumen final general de SonarQube

![Resumen final general de SonarQube](https://github.com/user-attachments/assets/d725b69b-3701-40fa-bdd7-824ed4bf2913)

## 4. Bugs y vulnerabilidades encontradas

## 4.1. Ejecución insegura de comandos del sistema operativo

### Código problemático

    exec(req.query.cmd, function(error, stdout) {
      console.log(stdout);
    });

    const out = execSync(req.body.shell).toString();

### Problema

El código permitía ejecutar comandos del sistema operativo usando datos enviados directamente por el usuario mediante `req.query.cmd` o `req.body.shell`.

Esto representaba un riesgo de Command Injection, ya que un usuario podía enviar comandos no autorizados al servidor.

### Riesgos

- Ejecución de comandos arbitrarios.
- Acceso no autorizado al servidor.
- Lectura, modificación o eliminación de archivos.
- Caída del sistema.
- Compromiso total del entorno donde se ejecuta la aplicación.

### Solución aplicada

Se eliminaron los endpoints y llamadas que ejecutaban comandos del sistema desde datos enviados por el usuario.

La aplicación quedó limitada a cargar rutas controladas y endpoints propios del sistema:

    app.use('/api/pacientes', patientRoutes);
    app.use('/api/medicamentos', medicamentosRoutes);
    app.use('/api/especialidades', especialidadesRoutes);
    app.use('/api/doctores', doctoresRoutes);

Con esto se evita que una petición HTTP pueda ejecutar comandos del sistema operativo.

## 4.2. Uso inseguro de eval

### Código problemático

    if (req.query.eval) {
      eval(req.query.eval);
    }

### Problema

La función `eval()` permitía ejecutar código JavaScript dinámicamente. Como el contenido venía desde una petición del usuario, esto representaba un riesgo grave de ejecución remota de código.

### Riesgos

- Ejecución remota de código.
- Manipulación de variables internas.
- Robo de información.
- Caída del servidor.
- Alteración del comportamiento de la aplicación.

### Solución aplicada

Se eliminó el uso de `eval()` y se mantuvieron únicamente endpoints con lógica controlada por funciones internas.

Parte corregida:

    app.post('/api/run-tests', (req, res) => {
      const { failTests } = req.body;

      runTests(failTests, (error, result) => {
        if (error) {
          return res.status(500).json({
            success: false,
            error: error.message
          });
        }

        res.json(result);
      });
    });

Con esta corrección, la aplicación ya no interpreta ni ejecuta código enviado directamente por el usuario.

## 4.3. Expresión regular vulnerable a ReDoS

### Código problemático

    const pattern = /^(a+)+$/;

### Problema

La expresión regular contenía cuantificadores anidados. Esto podía provocar un crecimiento excesivo en el tiempo de ejecución cuando se evaluaban entradas largas o diseñadas específicamente para generar lentitud.

Este problema se conoce como ReDoS, es decir, Regular Expression Denial of Service.

### Riesgos

- Alto consumo de CPU.
- Lentitud del servidor.
- Bloqueo temporal de la aplicación.
- Denegación de servicio.
- Mala experiencia para el usuario.

### Solución aplicada

Se eliminó la validación basada en una expresión regular vulnerable y se mantuvo el manejo de rutas mediante Express y controladores definidos.

Parte corregida:

    router.get('/', getAllDoctors);
    router.post('/', addNewDoctor);
    router.put('/:id', updateDoctor);
    router.delete('/:id', deleteDoctor);

Con esto se evita procesar entradas mediante patrones inseguros y se delega la lógica a controladores específicos.

## 4.4. Divulgación de información sensible en rutas

### Código problemático

    let routeCounter = 0;
    const routeSecret = 'route-secret-123';

### Problema

El archivo de rutas contenía variables innecesarias relacionadas con un contador y un valor secreto. Aunque no formaban parte de la lógica final del CRUD, mantener secretos o valores sensibles dentro del código fuente es una mala práctica.

### Riesgos

- Exposición accidental de información sensible.
- Código innecesario dentro del módulo de rutas.
- Posibles alertas de análisis estático.
- Menor mantenibilidad del código.

### Solución aplicada

Se limpió el archivo de rutas para conservar únicamente la configuración necesaria del router y sus controladores.

Parte corregida:

    const express = require('express');
    const { getAllDoctors, addNewDoctor, updateDoctor, deleteDoctor } = require('../controllers/doctores.controller');

    const router = express.Router();

    router.get('/', getAllDoctors);
    router.post('/', addNewDoctor);
    router.put('/:id', updateDoctor);
    router.delete('/:id', deleteDoctor);

    module.exports = router;

Con esta corrección, el archivo de rutas queda más limpio, seguro y mantenible.

## 4.5. Divulgación de la tecnología usada por el servidor

### Código relacionado

    const app = express();

### Problema

Express puede exponer por defecto información del framework mediante cabeceras HTTP como `X-Powered-By`.

Esto permite que un atacante identifique la tecnología utilizada por el servidor y busque ataques específicos contra esa tecnología.

### Riesgos

- Fingerprinting del servidor.
- Reconocimiento tecnológico.
- Mayor facilidad para ataques dirigidos.
- Exposición innecesaria de información interna.

### Solución aplicada

Se centralizó la configuración de la aplicación en `app.js`, manteniendo únicamente los middlewares y rutas necesarias.

Parte corregida:

    const app = express();

    app.use(express.json());

    app.use(express.static(path.join(__dirname, '../public')));

    app.use('/api/pacientes', patientRoutes);
    app.use('/api/medicamentos', medicamentosRoutes);
    app.use('/api/especialidades', especialidadesRoutes);
    app.use('/api/doctores', doctoresRoutes);

Además, como mejora recomendada, se puede desactivar la cabecera de Express con:

    app.disable('x-powered-by');

## 4.6. Manejo de rutas no encontradas

### Problema

Cuando una ruta no existe, es importante responder correctamente con un estado HTTP 404 para evitar respuestas ambiguas y mejorar la trazabilidad del sistema.

### Solución aplicada

Se agregó un manejador global para rutas no encontradas.

Parte corregida:

    app.use((req, res) => {
      res.status(404).json({ message: 'Route not found' });
    });

Con esto, cualquier ruta inexistente devuelve una respuesta clara y controlada.

## 4.7. Manejo de errores en endpoints internos

### Problema

Los endpoints internos deben manejar errores de forma controlada para evitar caídas del servidor y respuestas incompletas.

### Solución aplicada

Se agregó manejo de errores en los endpoints relacionados con pruebas y logs.

Parte corregida:

    app.get('/api/test-logs', (req, res) => {
      try {
        const logs = getTestLogs();
        res.json({ success: true, logs: logs });
      } catch (error) {
        res.status(500).json({ success: false, error: error.message });
      }
    });

Con esto, si ocurre un error al obtener logs, el servidor responde con un estado 500 controlado.

## 5. Soluciones generales aplicadas o recomendadas

Para corregir los problemas detectados se aplicaron o recomendaron las siguientes mejoras:

- Eliminar el uso de `eval()`.
- Eliminar la ejecución directa de comandos recibidos desde el usuario.
- Quitar endpoints inseguros que permitían ejecutar código o comandos externos.
- Mantener rutas controladas mediante routers de Express.
- Separar la lógica mediante controladores.
- Eliminar variables innecesarias o sensibles dentro de archivos de rutas.
- Manejar rutas inexistentes con una respuesta 404.
- Manejar errores internos con respuestas 500 controladas.
- Validar correctamente los datos recibidos por `query params`, `body` y `headers`.
- No exponer credenciales ni secretos dentro del código fuente.
- Agregar pruebas unitarias y de integración para mejorar la cobertura del proyecto.


## 6. Conclusión

El análisis permitió identificar varios problemas importantes dentro del proyecto. Los casos más críticos estaban relacionados con la ejecución de comandos del sistema, el uso de `eval()`, expresiones regulares inseguras y exposición de información sensible.

Las correcciones realizadas eliminaron los puntos inseguros y dejaron la aplicación organizada mediante rutas controladas, middlewares definidos, manejo de errores y separación de responsabilidades.

Aunque SonarQube puede mostrar una buena calificación general de seguridad, los Security Hotspots deben revisarse manualmente porque pueden representar riesgos reales si el proyecto se ejecuta en un entorno productivo.

La aplicación de estas soluciones mejora la seguridad, confiabilidad y mantenibilidad del sistema.
