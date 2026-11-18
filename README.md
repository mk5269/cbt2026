# 자격검정 CBT 2026

흰색 배경과 파란색 포인트의 자격검정 CBT입니다. 로그인한 응시자는 관리자가 등록한 문제 중 20문제를 20분 동안 풀고, 제출 즉시 점수와 순위가 갱신됩니다.

## 로컬 실행

PostgreSQL이 없으면 포함된 로컬 데이터베이스를 띄웁니다. 첫 실행은 바이너리를 받느라 조금 걸립니다.

```bash
npm install
npm run db:up
```

다른 터미널에서:

```bash
npm run db:deploy
npm run dev
```

브라우저에서 http://localhost:3000 을 엽니다.

기본 관리자 계정은 아이디 `admin`, 비밀번호 `admin1234` 입니다. 배포 전에는 반드시 바꿉니다.

## GitHub로 Vercel 배포

1. 이 폴더를 GitHub 저장소에 푸시합니다. `.env`는 올리지 않습니다.
2. [Vercel](https://vercel.com)에서 그 GitHub 저장소를 Import 합니다. Framework는 Next.js입니다.
3. Vercel 프로젝트에서 Storage → Postgres(Neon)를 만듭니다.
4. Environment Variables에 아래 값을 Production과 Preview 모두 넣습니다.
   - `DATABASE_URL`: Postgres의 **non-pooling** 연결 문자열. Neon/Vercel이 `POSTGRES_URL_NON_POOLING`만 만들어 준 경우 그 값을 `DATABASE_URL`로 넣어도 되고, 변수 이름 그대로 두어도 앱이 읽습니다.
   - `AUTH_SECRET`: 16자 이상의 랜덤 문자열. `openssl rand -base64 32`
   - `ADMIN_LOGIN_ID`: `admin`
   - `ADMIN_PASSWORD`: 배포용 관리자 비밀번호
   - `ADMIN_NAME`: `관리자`
5. Deploy를 누르면 빌드 중 `prisma migrate deploy`가 테이블을 만듭니다.
6. 배포된 주소에서 관리자로 로그인한 뒤 **문제 관리**에서 문제를 20개 이상 등록합니다.

관리자 계정은 사이트가 처음 데이터베이스에 연결될 때 환경변수 기준으로 한 번 만들어집니다. 비밀번호를 나중에 바꾸려면 `ADMIN_PASSWORD`를 수정하고, 데이터베이스에서 해당 관리자 사용자를 삭제한 다음 다시 배포합니다.

## 시험 규칙

- 로그인: 아이디, 비밀번호
- 닉네임: 아이디와 별도로 메인 화면에서 수정
- 순위표: 닉네임, 이름, 최고 점수 1위~15위
- 점수: 20문제 × 5점 = 100점
- 제한시간: 20분. 시간이 끝나면 자동 제출됩니다.
