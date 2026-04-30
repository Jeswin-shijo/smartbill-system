const { app } = require('./src/app');
const { bootstrapDatabase } = require('./src/db/bootstrap');

const port = Number(process.env.PORT || 4000);

async function startServer() {
  await bootstrapDatabase();

  app.listen(port, () => {
    console.log(`Smart Bill backend running on http://localhost:${port}`);
  });
}

startServer().catch((error) => {
  console.error('Unable to start Smart Bill backend:', error);
  process.exit(1);
});
