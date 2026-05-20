📄 SkyLine Gadgets — Бэкенд (Локальный запуск)

## Учебный проект: бэкенд интернет-магазина электроники на Node.js + Express + PostgreSQL.

🚀 Возможности

Фича | Описание

📦 REST API | Товары, пользователи, комментарии, корзина, рейтинги, избранное

🔐 JWT-авторизация | Регистрация, вход, защита эндпоинтов

🛡️ Роли | Обычный пользователь / администратор

🔄 Seed-данные | Инициализация БД из db.json одной командой

🗑️ Каскадное удаление | Удаление пользователя → очистка связанных данных

⭐ Рейтинги | Целочисленные оценки 1–5, расчёт среднего с дробной частью

💬 Комментарии | Поддержка вложенных ответов (дерево)

🛒 Корзина | Учёт остатков на складе, добавление/удаление товаров

🛠️ Технологии

• Node.js + Express
• PostgreSQL (локально или облачно)
• pg — драйвер для PostgreSQL
• Zod — валидация входящих данных
• bcrypt — хэширование паролей
• jsonwebtoken — JWT-токены
• TypeScript — строгая типизация

🗂️ Структура проекта

skyLine-gadgets-backend/
├── server/
│ ├── routes/ # Роутеры: products, users, cart, ratings...
│ ├── utils/ # Подключение к БД, JWT, хелперы
│ ├── schemas/ # Zod-схемы валидации
│ ├── middleware/ # auth, validateBody, validateQuery
│ ├── seeds/ # seed.ts — инициализация БД
│ ├── scripts/ # reset.ts — сброс и заполнение БД
│ └── server.ts # Точка входа
├── db.json # Исходные данные для seed
├── .env # Переменные окружения (не в git!)
├── package.json
└── README.md

📦 Локальная установка и запуск

🔹 Шаг 1: Клонирование и установка зависимостей

# Перейди в папку проекта

cd skyLine-gadgets-backend

# Установи зависимости

npm install

🔹 Шаг 2: Установи PostgreSQL (если ещё нет)

# Вариант A: Официальный установщик (рекомендуется)

Скачай с postgresql.org/download/windows
Запусти установщик от имени администратора
На этапе Password запомни пароль (например, postgres)
Порт оставь 5432, локаль — UTF8
Вариант B: Docker (быстро и чисто)

# Вариант B: Docker (быстро и чисто)

docker run --name skyline-pg \
 -e POSTGRES_DB=skyline_gadgets \
 -e POSTGRES_PASSWORD=postgres \
 -p 5432:5432 \
 -d postgres:16

**После этого у тебя будет PostgreSQL на localhost:5432 с БД skyline_gadgets и паролем postgres.**

🔹 Шаг 3: Настрой подключение к БД
Создай файл .env в корне проекта:

# .env

DATABASE_URL=postgres://postgres:postgres@localhost:5432/skyline_gadgets
NODE_ENV=development
JWT_SECRET=my_strong_jwt_secret_123!
PORT=3001

**🔑 Замени postgres:postgres на твой*логин:твой*пароль, если они другие.**

🔹 Шаг 4: Создай базу данных (если не создана)
Через psql (SQL Shell):

# Запусти psql

psql -U postgres -h localhost

# Внутри psql создай БД (если ещё нет):

CREATE DATABASE skyline_gadgets;
\q

# 💡 Если psql не найден — используй полный путь: "C:\Program Files\PostgreSQL\16\bin\psql.exe" -U postgres -h localhost

🔹 Шаг 5: Если забыл пароль — сбрось его

Открой файл (от имени администратора!):

C:\Program Files\PostgreSQL\16\data\pg_hba.conf

Найди строки:

local all all scram-sha-256
host all all 127.0.0.1/32 scram-sha-256

Замени scram-sha-256 на trust:

local all all trust
host all all 127.0.0.1/32 trust

Сохрани и перезапусти службу PostgreSQL (services.msc)

Подключись без пароля: psql -U postgres -h localhost

Смени пароль: ALTER USER postgres PASSWORD 'postgres';

Верни scram-sha-256 в pg_hba.conf и перезапусти службу

🔹 Шаг 6: Инициализируй данные (seed)

# Создаст таблицы и загрузит данные из db.json

npm run reset

✅ Ожидай вывод:

🔄 Полный сброс БД...
🧹 Очищаем и пересоздаём структуру БД...
✅ Структура БД создана
✅ Данные из db.json успешно загружены в PostgreSQL
✅ БД сброшена и заполнена

⚠️ Внимание: npm run reset удаляет все данные и пересоздаёт БД! Используй только для разработки.

🔹 Шаг 7: Запусти сервер в режиме разработки

npm run dev

✅ Сервер запустится на: http://localhost:3001

🧪 Проверка работы API

Эндпоинт | Метод | Описание

GET /api/products | GET | Список товаров
GET /api/products/:id | GET | Товар по ID
GET /api/brands | GET | Список брендов
GET /api/comments?productId=... | GET | Комментарии к товару
POST /api/auth/register | POST | Регистрация
POST /api/auth/login | POST | Вход (возвращает JWT)
GET /api/cart | GET | Корзина (требует токен)
POST /api/ratings | POST | Оценка товара (требует токен)

🔑 Тестовые аккаунты

Роль | Логин | Пароль

👤 Пользователь | john | qwerty

👨‍💼 Администратор | admin | admin123

🧭 Пример запроса с авторизацией

# 1. Получи токен

curl -X POST http://localhost:3001/api/auth/login \
 -H "Content-Type: application/json" \
 -d '{"login":"john","password":"qwerty"}'

# 2. Используй токен в запросах

curl -X GET http://localhost:3001/api/cart \
 -H "Authorization: Bearer ТВОЙ*ТОКЕН*ЗДЕСЬ"

🛠️ Частые ошибки и решения

Ошибка | Причина | Решение

SASL: SCRAM-SERVER-FIRST-MESSAGE: client password must be a string | Неверный пароль или формат DATABASE_URL | Проверь .env, сбрось пароль через pg_hba.conf

база данных "skyline_gadgets" не существует | БД не создана | Выполни CREATE DATABASE skyline_gadgets; в psql

отношение "cart_items" не существует | Таблицы не созданы | Запусти npm run reset

401 Unauthorized | Нет JWT-токена в заголовке | Авторизуйся и добавь Authorization: Bearer ...

port 5432 refused | PostgreSQL не запущен | Запусти службу в services.msc или Docker-контейнер

🙌 Автор
Airat Habibulaev
Frontend/Fullstack Developer
📧 airat.24@mail.ru | 📱 +7 918 775-82-18 | ✈️ @Airat_Habibulaev
🔗 GitHub | 🌐 Портфолио
