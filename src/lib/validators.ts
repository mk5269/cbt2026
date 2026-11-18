const LOGIN_ID = /^[a-zA-Z0-9가-힣_-]{3,20}$/;

type Failure = { ok: false; error: string };
type Success<T> = { ok: true; data: T };

function fail(error: string): Failure {
  return { ok: false, error };
}

export function validateLoginId(value: string): Failure | Success<{ loginId: string }> {
  const loginId = value.trim();
  if (!LOGIN_ID.test(loginId)) {
    return fail("아이디는 3~20자의 한글, 영문, 숫자, _, - 만 사용할 수 있습니다.");
  }
  return { ok: true, data: { loginId } };
}

export function validatePassword(value: string): Failure | Success<{ password: string }> {
  if (value.length < 4 || value.length > 50) {
    return fail("비밀번호는 4~50자로 입력해 주세요.");
  }
  return { ok: true, data: { password: value } };
}

export function validateName(value: string): Failure | Success<{ name: string }> {
  const name = value.trim();
  if (name.length < 1 || name.length > 30 || /[\r\n]/.test(name)) {
    return fail("이름은 1~30자로 입력해 주세요.");
  }
  return { ok: true, data: { name } };
}

export function validateNickname(value: string): Failure | Success<{ nickname: string }> {
  const nickname = value.trim();
  if (nickname.length > 20 || /[\r\n]/.test(nickname)) {
    return fail("닉네임은 20자 이하로 입력해 주세요.");
  }
  return { ok: true, data: { nickname } };
}
