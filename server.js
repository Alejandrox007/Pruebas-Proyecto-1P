const app = require('./src/app');

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Hospital API Server running on http://localhost:${PORT}`);
  console.log(`Interface available at http://localhost:${PORT}`);
  console.log(`API endpoints at http://localhost:${PORT}/api`);
});
