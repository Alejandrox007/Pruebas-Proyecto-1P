const { exec } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

/**
 * Test Runner Module
 * Handles test execution with custom failure configuration
 * This module is separated from app.js to improve test coverage
 */

const testFiles = {
  'doctors-create': {
    file: path.join(__dirname, '../test/doctores.test.js'),
    find: 'expect(response.status).toBe(201);',
    replace: 'expect(response.status).toBe(500); // MODIFIED TO FAIL'
  },
  'doctors-update': {
    file: path.join(__dirname, '../test/doctores.test.js'),
    find: 'expect(response.status).toBe(200);\n    expect(response.body.name).toBe(\'Dr. Juan Actualizado\');',
    replace: 'expect(response.status).toBe(404); // MODIFIED TO FAIL\n    expect(response.body.name).toBe(\'Dr. Juan Actualizado\');'
  },
  'doctors-delete': {
    file: path.join(__dirname, '../test/doctores.test.js'),
    find: 'const deleteResponse = await request(app).delete(`/api/doctores/${doctorId}`);\n    expect(deleteResponse.status).toBe(200);',
    replace: 'const deleteResponse = await request(app).delete(`/api/doctores/${doctorId}`);\n    expect(deleteResponse.status).toBe(404); // MODIFIED TO FAIL'
  },
  'patients-create': {
    file: path.join(__dirname, '../test/pacientes.test.js'),
    find: 'expect(response.status).toBe(201);',
    replace: 'expect(response.status).toBe(500); // MODIFIED TO FAIL'
  },
  'medicines-create': {
    file: path.join(__dirname, '../test/medicamentos.test.js'),
    find: 'expect(response.status).toBe(201);',
    replace: 'expect(response.status).toBe(500); // MODIFIED TO FAIL'
  },
  'specialties-duplicate': {
    file: path.join(__dirname, '../test/especialidades.test.js'),
    find: 'expect(response2.status).toBe(409);',
    replace: 'expect(response2.status).toBe(201); // MODIFIED TO FAIL'
  }
};

/**
 * Saves test execution log to file
 * @param {Object} logData - Test execution data
 */
function saveTestLog(logData) {
  try {
    const logFile = path.join(__dirname, '../test-logs.json');
    let logs = [];
    
    if (fs.existsSync(logFile)) {
      const fileData = fs.readFileSync(logFile, 'utf8');
      logs = JSON.parse(fileData);
    }
    
    logs.unshift({
      timestamp: new Date().toISOString(),
      date: new Date().toLocaleString('es-ES'),
      passed: logData.passed,
      failed: logData.failed,
      total: logData.total,
      failedTests: logData.failedTests || [],
      output: logData.output
    });
    
    // Keep only last 100 entries
    if (logs.length > 100) {
      logs = logs.slice(0, 100);
    }
    
    fs.writeFileSync(logFile, JSON.stringify(logs, null, 2));
  } catch (error) {
    console.error('Error saving test log:', error);
  }
}

/**
 * Runs tests with optional modifications to make specific tests fail
 * @param {Array} failTests - Array of test keys to modify
 * @param {Function} callback - Callback function with (error, result)
 */
function runTests(failTests, callback) {
  const modifiedFiles = [];
  
  try {
    // Modify selected tests
    if (failTests && Array.isArray(failTests) && failTests.length > 0) {
      failTests.forEach(testKey => {
        const testConfig = testFiles[testKey];
        if (testConfig) {
          try {
            const originalContent = fs.readFileSync(testConfig.file, 'utf8');
            const modifiedContent = originalContent.replace(testConfig.find, testConfig.replace);
            
            if (modifiedContent !== originalContent) {
              fs.writeFileSync(testConfig.file, modifiedContent);
              modifiedFiles.push({
                file: testConfig.file,
                original: originalContent
              });
            }
          } catch (fileError) {
            console.error(`Error modifying ${testConfig.file}:`, fileError);
          }
        }
      });
    }
    
    // Run tests
    exec('npm test', { cwd: path.join(__dirname, '..') }, (error, stdout, stderr) => {
      // Restore all modified files
      modifiedFiles.forEach(({ file, original }) => {
        try {
          fs.writeFileSync(file, original);
        } catch (restoreError) {
          console.error(`Error restoring ${file}:`, restoreError);
        }
      });
      
      // Parse test results
      const output = stdout + stderr;
      const passedMatch = output.match(/(\d+)\s+passed/);
      const failedMatch = output.match(/(\d+)\s+failed/);
      const suitesPassedMatch = output.match(/Test Suites:.*?(\d+)\s+passed/);
      
      const passed = passedMatch ? Number.parseInt(passedMatch[1]) : 0;
      const failed = failedMatch ? Number.parseInt(failedMatch[1]) : 0;
      const total = passed + failed;
      const suites = suitesPassedMatch ? Number.parseInt(suitesPassedMatch[1]) : 0;
      
      const result = {
        success: true,
        testsPassed: failed === 0,
        totalTests: total > 0 ? total : 36,
        passed: passed,
        failed: failed,
        suites: suites,
        output: output || 'No output received',
        error: null
      };
      
      // Save log
      saveTestLog({
        passed: passed,
        failed: failed,
        total: total,
        failedTests: failTests || [],
        output: output
      });
      
      callback(null, result);
    });
  } catch (error) {
    // Restore files in case of error
    modifiedFiles.forEach(({ file, original }) => {
      try {
        fs.writeFileSync(file, original);
      } catch (restoreError) {
        console.error(`Error restoring ${file}:`, restoreError);
      }
    });
    
    callback(error);
  }
}

/**
 * Gets test logs from file
 * @returns {Array} Array of test log entries
 */
function getTestLogs() {
  const logFile = path.join(__dirname, '../test-logs.json');
  
  try {
    if (fs.existsSync(logFile)) {
      const logData = fs.readFileSync(logFile, 'utf8');
      return JSON.parse(logData);
    }
    return [];
  } catch (error) {
    throw new Error(`Error reading test logs: ${error.message}`);
  }
}

module.exports = {
  runTests,
  getTestLogs,
  saveTestLog
};
