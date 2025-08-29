# Egg Digital Lambda App

โปรเจกต์นี้ประกอบด้วย **AWS Lambda functions** สำหรับจัดการผู้ใช้ด้วย **Cognito** และ **DynamoDB** พร้อม **Next.js frontend** และรวม **unit tests** โดยใช้ **Jest**

---

## ภาพรวมสถาปัตยกรรม (Architecture Overview)

- **Frontend:** Next.js application
- **Backend:** AWS Lambda functions
  - `createUserProfile` – สร้างผู้ใช้ใหม่ใน Cognito และเก็บโปรไฟล์ใน DynamoDB
  - `signin` – ตรวจสอบการเข้าสู่ระบบของผู้ใช้กับ Cognito
  - `refreshToken` – รีเฟรช token ของ Cognito
  - `getProfile` – ดึงข้อมูลโปรไฟล์ผู้ใช้จาก DynamoDB
  - `updateProfile` – อัปเดตโปรไฟล์ผู้ใช้ใน DynamoDB
- **AWS Services**
  - **Cognito** – จัดการ authentication และ user management
  - **DynamoDB** – เก็บข้อมูลโปรไฟล์ผู้ใช้
  - **API Gateway** – เปิด endpoint ของ Lambda functions เป็น HTTP

---

## การติดตั้งและใช้งาน (How to Deploy the App)

1. **ติดตั้ง dependencies**
```bash
npm install
```

2. **ตั้งค่า environment variables**
สร้างไฟล์ .env.local แล้วเพิ่มค่าดังนี้:
```text
API Gateway base URL
NEXT_PUBLIC_API_BASE_URL=https://<api-id>.execute-api.<region>.amazonaws.com/dev

Cognito
NEXT_PUBLIC_COGNITO_CLIENT_ID=<your-client-id>
NEXT_PUBLIC_COGNITO_REGION=<your-region>

Lambda functions
AWS_REGION=<your-region>
USER_POOL_ID=<your-user-pool-id>
CLIENT_ID=<your-client-id>
```

3. **รันโปรเจกต์**
```bash
npm run dev      # โหมดพัฒนา
npm run build    # สร้าง build สำหรับ production
npm run start    # เริ่ม server
```

4. **การทดสอบ (How to Test the App)**
รัน unit tests ด้วย Jest:
```bash
npm test           # รันทดสอบทั้งหมด
npm test -- --watch  # รันแบบ watch mode
```

ตัวอย่างผลลัพธ์:
```text
Test Suites: 5 passed, 5 total
Tests:       21 passed, 21 total
Snapshots:   0 total
Time:        0.678 s
```


