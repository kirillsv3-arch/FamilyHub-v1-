# FamilyHub

FamilyHub — это платформа для координации семьи, включающая управление задачами, списком покупок, планированием питания, отслеживанием бюджета и эмоций, а также общим виртуальным питомцем (Тамагочи).

## Стек технологий

- **Frontend**: Next.js (App Router), TypeScript, Tailwind CSS v4, Framer Motion, Lucide React, Recharts.
- **Backend**: Firebase (Authentication, Firestore, Cloud Messaging), Firebase Admin SDK.
- **Инструменты**: date-fns, use-long-press, canvas-confetti.

## Настройка окружения

Для работы проекта необходимо создать файл `.env.local` в корне и заполнить его следующими переменными:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=ваш_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=ваш_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=ваш_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=ваш_storage_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=ваш_messaging_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=ваш_app_id

FIREBASE_CLIENT_EMAIL=ваш_service_account_email
FIREBASE_PRIVATE_KEY="ваш_service_account_private_key"
```

## Запуск проекта

1. Установите зависимости:
   ```bash
   npm install
   ```

2. Запустите сервер для разработки:
   ```bash
   npm run dev
   ```

3. Откройте [http://localhost:3000](http://localhost:3000) в браузере.

## Основные модули

- **Планировщик**: задачи с делегированием и календарем.
- **Покупки**: список покупок с сортировкой и историей цен.
- **Меню**: генератор рецептов и планирование питания на неделю.
- **Бюджет**: учет доходов, расходов, кредитов и целей сбережения.
- **Эмоции**: отслеживание состояния членов семьи и отправка "сердечек".
- **Тамагочи**: общий питомец, состояние которого зависит от активности семьи.
