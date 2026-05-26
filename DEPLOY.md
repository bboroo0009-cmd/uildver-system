# Vercel + Supabase Deployment

Дараах алхмаар үйлдвэрийн системийг cloud-д гаргана. Бүх алхмыг та өөрөө хийнэ — Claude таны нэрийн өмнөөс данс үүсгэх, push хийх боломжгүй.

## 0. Шаардлагатай

- GitHub данс
- Vercel данс (https://vercel.com)
- Supabase данс (https://supabase.com)
- Локалд `git` суусан

---

## 1. Supabase дээр database үүсгэх

1. https://supabase.com/dashboard руу ороод **New project** дарна.
2. **Name**: `uildver`, **Database Password**: хүчтэй pass сонгоно (хадгална!).
3. **Region**: Singapore эсвэл Tokyo (Монголд хамгийн ойр).
4. Project үүсгээд хүлээнэ (~2 минут).
5. **Settings → Database → Connection string** руу ороод **URI** хэлбэрийг хуулна. Жишээ:
   ```
   postgresql://postgres:[PASSWORD]@db.xxxxxx.supabase.co:5432/postgres
   ```
   `[PASSWORD]`-ийг өөрийн pass-аар солино.

6. **Schema үүсгэх:**
   Supabase dashboard-ын **SQL Editor** руу ороод [backend/src/db/schema.sql](backend/src/db/schema.sql)-ын агуулгыг хуулж буулгаад **Run** дарна.

7. **Эхний admin хэрэглэгч ба бүтээгдэхүүн нэмэх:**
   Локалд `backend/.env`-ийг түр Supabase URL-ээр солиод seed ажиллуулна:
   ```powershell
   # backend/.env -г түр өөрчилнө
   # DATABASE_URL=postgresql://postgres:PASSWORD@db.xxxxxx.supabase.co:5432/postgres
   cd backend
   npm run seed
   ```
   Эсвэл SQL Editor дээр гараар INSERT хийж болно.

---

## 2. GitHub repo үүсгэх ба push хийх

```powershell
cd D:\uildver-system
git init
git add .
git commit -m "Initial commit"
```

GitHub дээр шинэ private repo `uildver-system` нэртэйгээр үүсгэнэ (README, .gitignore-гүйгээр).

```powershell
git remote add origin https://github.com/<your-username>/uildver-system.git
git branch -M main
git push -u origin main
```

---

## 3. Vercel дээр deploy хийх

1. https://vercel.com/new руу ороод GitHub repo-гоо сонгоно.
2. **Framework Preset**: `Other` (vercel.json-ийг автоматаар уншина).
3. **Root Directory**: үлдээ — repo root.
4. **Environment Variables** хэсэгт дараахыг нэмнэ:

   | Name | Value |
   |---|---|
   | `DATABASE_URL` | Supabase URI (1-р алхамаас) |
   | `JWT_SECRET` | Урт санамсаргүй мөр (жишээ: 64 тэмдэгт) |
   | `PGSSL` | `true` |

5. **Deploy** дарна. 1-2 минут хүлээнэ.

6. Гарсан URL дээр (жишээ: `https://uildver-system.vercel.app`) орж нэвтэрнэ:
   - `admin / 123456` (эсвэл seed-ийн анхдагч)

---

## 4. Дараа нь өөрчлөлт хийхэд

```powershell
git add .
git commit -m "Шинэчилсэн"
git push
```
Vercel автоматаар дахин deploy хийнэ.

---

## Локалд хөгжүүлэх (deploy-ийн дараа ч)

Локал PostgreSQL-ээ `backend/.env`-д буцааж тохируулна:
```
DATABASE_URL=postgresql://postgres:Vinc%409970@localhost:5432/uildver
```
Дараа нь:
```powershell
cd backend; npm run dev
cd frontend; npm run dev
```

---

## Алдаа гаргах магадлалтай зүйлс

- **"connect ECONNREFUSED" / SSL алдаа**: `PGSSL=true` тохируулсан эсэхийг шалга.
- **"relation does not exist"**: Supabase SQL Editor дээр schema.sql ажиллуулаагүй байх. Дахин ажиллуул.
- **Login дээр 401**: Supabase дээр `users` хүснэгтэд хэрэглэгч seed хийгээгүй байх. `npm run seed` ажиллуул (.env-ийг Supabase URL руу солиод).
- **Vercel build failed**: log-ыг хар. Дийлэнхдээ env var дутуу байх.
- **Cold start удаан**: Vercel free tier-ийн онцлог. 5-10 секунд хүлээх хэрэгтэй.

---

## Анхааруулга

- Supabase free tier нь 7 хоног идэвхгүй бол project-ыг pause хийдэг. Сард 1-2 удаа орох эсвэл upgrade хийх.
- Vercel free tier: 100GB bandwidth/сар, 100k function call/сар — энэ хэмжээний project-д хангалттай.
- `JWT_SECRET`-ыг production-д `change-in-production-2026` биш хүчтэй мөр болгох.
