const fs = require('node:fs');
const path = require('node:path');

describe('production frontend build configuration', () => {
  const projectRoot = path.join(__dirname, '..');

  it('loads the compiled stylesheet without an inline onload handler', () => {
    const angularConfig = JSON.parse(
      fs.readFileSync(path.join(projectRoot, 'client/angular.json'), 'utf8')
    );
    const optimization = angularConfig.projects['hospital-client']
      .architect.build.configurations.production.optimization;

    expect(optimization.styles.inlineCritical).toBe(false);
    expect(optimization.fonts).toBe(false);
  });

  it('enables zone change detection for subscription-driven components', () => {
    const appConfig = fs.readFileSync(
      path.join(projectRoot, 'client/src/app/app.config.ts'),
      'utf8'
    );

    expect(appConfig).toContain('provideZoneChangeDetection');
    expect(appConfig).toContain('provideZoneChangeDetection({ eventCoalescing: true })');
  });
});
