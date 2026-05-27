# Үйлдвэрийн нөөцийн систем

Уламжлалт монгол урлан эдлэлийн (домбо, айрагны хувин, мөнгөн аяга) нөөц,
үйлдвэрлэл болон борлуулагчдын хэрэглээг бүртгэх web систем.

**Live:** https://uildver-system.vercel.app

## Технологи

- **Backend**: Node.js + Express + PostgreSQL
- **Frontend**: React + Vite + React Router
- **Auth**: JWT + bcrypt

## Эрхийн төрлүүд

- **admin** — бүгдийг хийнэ (хэрэглэгч нэмэх, устгах гэх мэт)
- **uildver** — бүтээгдэхүүн нэмэх, үйлдвэрлэл болон шилжүүлэг бүртгэх
- **borluulagch** — өөрт ногдсон нөөцөө харах, борлуулсан мэдээ оруулах

---

## 1. PostgreSQL суулгах

1. https://www.postgresql.org/download/windows/ хаягаас Windows installer татаж суулгана.
2. Суулгах үед `postgres` хэрэглэгчид нууц үг тавьна (жишээ нь `password`).
3. Суусны дараа pgAdmin эсвэл terminal-аар database үүсгэнэ:

```sql
CREATE DATABASE uildver;
```

## 2. Backend ажиллуулах

```powershell
cd D:\uildver-system\backend
copy .env.example .env
# .env файл дотор DATABASE_URL-ийг өөрийн PostgreSQL нууц үгээр засна
# жишээ нь: postgresql://postgres:password@localhost:5432/uildver
npm install
npm run migrate   # хүснэгтүүдийг үүсгэнэ
npm run seed      # эхний admin хэрэглэгч ба бүтээгдэхүүн үүсгэнэ
npm run dev       # сервер :4000 порт дээр ажиллана
```

## 3. Frontend ажиллуулах

Шинэ terminal нээгээд:

```powershell
cd D:\uildver-system\frontend
npm install
npm run dev       # http://localhost:5173
```

Brаузераар `http://localhost:5173` нээж нэвтэрнэ:

- **admin / admin123**
- **uildver / uildver123**

---

## API товч

| Method | Path | Эрх |
|---|---|---|
| POST | `/api/auth/login` | бүгд |
| GET | `/api/auth/me` | нэвтэрсэн |
| POST | `/api/auth/users` | admin |
| GET | `/api/auth/users` | admin |
| GET | `/api/products` | нэвтэрсэн |
| POST | `/api/products` | admin, uildver |
| PUT | `/api/products/:id` | admin, uildver |
| DELETE | `/api/products/:id` | admin |
| POST | `/api/products/:id/produce` | admin, uildver |
| GET | `/api/distributors` | нэвтэрсэн |
| POST | `/api/distributors` | admin, uildver |
| POST | `/api/distributors/:id/transfer` | admin, uildver |
| POST | `/api/distributors/:id/sell` | нэвтэрсэн |
| GET | `/api/reports/summary` | нэвтэрсэн |
| GET | `/api/reports/transactions` | нэвтэрсэн |

## Database бүтэц

- `users` — хэрэглэгчид (role: admin / uildver / borluulagch)
- `products` — бүтээгдэхүүний жагсаалт
- `warehouse_stock` — агуулахын нөөц (бүтээгдэхүүн бүрд нэг мөр)
- `distributors` — борлуулагчид
- `distributor_stock` — борлуулагч бүрд бүтээгдэхүүн тус бүрийн үлдэгдэл
- `transactions` — бүх гүйлгээний түүх (produce, transfer, sell, return)

## Гүйлгээний урсгал

1. **Үйлдвэрлэл** — Бүтээгдэхүүний хуудаснаас "Үйлдвэрлэв" дарж тоо бичнэ → агуулахын нөөц нэмэгдэнэ.
2. **Шилжүүлэг** — Борлуулагчийн картаас "Шилжүүлэх" дарж бүтээгдэхүүн, тоо сонгоно → агуулахаас хасагдаж, борлуулагч руу нэмэгдэнэ.
3. **Зарагдсан** — Борлуулагчийн картаас "Зарагдсан бүртгэх" → борлуулагчийн нөөцөөс хасагдана.

Бүх алхам `transactions` хүснэгтэд бичигдэх тул дараа нь "Гүйлгээ" цонхноос харах боломжтой.
