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

## 4. Bugs y vulnerabilidades encontradas

## 4.1. Ejecución insegura de comandos del sistema operativo

### Código problemático

    exec(req.query.cmd, function(error, stdout) {
      console.log(stdout);
    });

    const out = execSync(req.body.shell).toString();

### Problema

El código permite ejecutar comandos del sistema operativo usando datos enviados directamente por el usuario mediante `req.query.cmd` o `req.body.shell`.

Esto representa un riesgo de Command Injection, ya que un usuario podría enviar comandos no autorizados al servidor.

### Riesgos

- Ejecución de comandos arbitrarios.
- Acceso no autorizado al servidor.
- Lectura, modificación o eliminación de archivos.
- Caída del sistema.
- Compromiso total del entorno donde se ejecuta la aplicación.

### Solución recomendada

No se deben ejecutar comandos recibidos directamente desde el usuario.

En caso de que sea necesario ejecutar alguna acción del sistema, se debe usar una lista blanca de comandos permitidos y evitar concatenar entradas del usuario.

Ejemplo de corrección:

    const { execFile } = require('child_process');

    const allowedCommands = {
      nodeVersion: {
        command: 'node',
        args: ['--version']
      },
      npmVersion: {
        command: 'npm',
        args: ['--version']
      }
    };

    app.get('/command', (req, res) => {
      const commandKey = req.query.command;

      if (!allowedCommands[commandKey]) {
        return res.status(400).json({
          message: 'Comando no permitido'
        });
      }

      const selectedCommand = allowedCommands[commandKey];

      execFile(selectedCommand.command, selectedCommand.args, (error, stdout) => {
        if (error) {
          return res.status(500).json({
            message: 'Error al ejecutar el comando'
          });
        }

        res.json({
          output: stdout
        });
      });
    });

## 4.2. Uso inseguro de eval

### Código problemático

    if (req.query.eval) {
      eval(req.query.eval);
    }

### Problema

La función `eval()` permite ejecutar código JavaScript dinámicamente. En este caso, el código proviene de una petición del usuario, lo cual representa un riesgo grave.

Un atacante podría enviar instrucciones maliciosas para manipular el servidor o afectar el funcionamiento de la aplicación.

### Riesgos

- Ejecución remota de código.
- Manipulación de variables internas.
- Robo de información.
- Caída del servidor.
- Alteración del comportamiento de la aplicación.

### Solución recomendada

Eliminar completamente el uso de `eval()`.

Si se necesita realizar una operación dinámica, se debe controlar mediante estructuras seguras como condicionales, `switch` o funciones previamente definidas.

Ejemplo de corrección:

    app.get('/calculate', (req, res) => {
      const { a, b, operation } = req.query;

      const numA = Number(a);
      const numB = Number(b);

      if (Number.isNaN(numA) || Number.isNaN(numB)) {
        return res.status(400).json({
          message: 'Valores inválidos'
        });
      }

      let result;

      switch (operation) {
        case 'sum':
          result = numA + numB;
          break;

        case 'subtract':
          result = numA - numB;
          break;

        case 'multiply':
          result = numA * numB;
          break;

        default:
          return res.status(400).json({
            message: 'Operación no permitida'
          });
      }

      res.json({
        result
      });
    });

## 4.3. Expresión regular vulnerable a ReDoS

### Código problemático

    const pattern = /^(a+)+$/;

### Problema

La expresión regular contiene cuantificadores anidados. Esto puede provocar un crecimiento excesivo en el tiempo de ejecución cuando se evalúan entradas largas o diseñadas específicamente para generar lentitud.

Este problema se conoce como ReDoS, es decir, Regular Expression Denial of Service.

### Riesgos

- Alto consumo de CPU.
- Lentitud del servidor.
- Bloqueo temporal de la aplicación.
- Denegación de servicio.
- Mala experiencia para el usuario.

### Solución recomendada

Evitar expresiones regulares con cuantificadores anidados y reemplazarlas por patrones más simples.

Ejemplo de corrección:

    const pattern = /^a+$/;

También se recomienda limitar la longitud máxima de las entradas del usuario:

    app.post('/validate', (req, res) => {
      const input = req.body.value;

      if (!input || input.length > 100) {
        return res.status(400).json({
          message: 'Entrada inválida'
        });
      }

      const pattern = /^a+$/;

      res.json({
        valid: pattern.test(input)
      });
    });

## 4.4. Divulgación de la tecnología usada por el servidor

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

### Solución recomendada

Desactivar la cabecera `X-Powered-By`.

    const app = express();

    app.disable('x-powered-by');

También se recomienda utilizar Helmet para agregar cabeceras de seguridad adicionales.

    const helmet = require('helmet');

    app.use(helmet());

## 4.5. Exposición de credenciales en cabeceras HTTP

### Código problemático

    res.header('X-Admin-Password', adminPassword);
    res.header('X-Api-Key', apiKey);

### Problema

El código envía información sensible como contraseñas o API keys dentro de las cabeceras HTTP.

Esto es una mala práctica de seguridad, ya que las cabeceras pueden ser visibles para clientes, herramientas de depuración, proxies o registros del servidor.

### Riesgos

- Robo de credenciales.
- Acceso no autorizado.
- Uso indebido de claves API.
- Escalada de privilegios.
- Compromiso de servicios externos.

### Solución recomendada

Nunca se deben enviar contraseñas, tokens o API keys en las respuestas HTTP.

Código corregido:

    res.header('Access-Control-Allow-Origin', allowedOrigin);
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');

Las credenciales deben almacenarse en variables de entorno.

Ejemplo de archivo `.env`:

    API_KEY=clave_segura
    ADMIN_PASSWORD=clave_segura

Uso recomendado en Node.js:

    require('dotenv').config();

    const apiKey = process.env.API_KEY;
    const adminPassword = process.env.ADMIN_PASSWORD;

## 5. Soluciones generales aplicadas o recomendadas

Para corregir los problemas detectados se recomienda aplicar las siguientes mejoras:

- Eliminar el uso de `eval()`.
- Evitar la ejecución directa de comandos recibidos desde el usuario.
- Usar `execFile()` en lugar de `exec()` cuando sea estrictamente necesario ejecutar comandos.
- Aplicar listas blancas para acciones permitidas.
- Reemplazar expresiones regulares vulnerables.
- Limitar el tamaño máximo de las entradas del usuario.
- Desactivar la cabecera `X-Powered-By` de Express.
- Usar Helmet para mejorar las cabeceras de seguridad.
- No exponer credenciales en cabeceras HTTP.
- Usar variables de entorno para datos sensibles.
- Validar correctamente los datos recibidos por query params, body y headers.
- Agregar pruebas unitarias y de integración para mejorar la cobertura del proyecto.


## 7. Conclusión

El análisis permitió identificar varios problemas importantes dentro del archivo `src/app.js`. Los casos más críticos están relacionados con la ejecución de comandos del sistema, el uso de `eval()`, expresiones regulares inseguras y exposición de información sensible.

Aunque SonarQube calificó la seguridad general como A, el Security Review aparece con calificación E debido a que existen Security Hotspots sin revisar. Por esta razón, es necesario analizar y corregir manualmente estos puntos antes de considerar que el proyecto es seguro.

La aplicación de las soluciones propuestas mejora la seguridad, confiabilidad y mantenibilidad del sistema.
