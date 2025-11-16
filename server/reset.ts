import { seed } from './seeds/seed.js';

const reset = async () => {
  console.log('🔄 Полный сброс БД...');
  await seed();
  console.log('✅ БД сброшена и заполнена');
  process.exit(0);
};

reset().catch((err) => {
  console.error('❌ Ошибка сброса:', err);
  process.exit(1);
});
