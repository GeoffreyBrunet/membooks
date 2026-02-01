import { mock } from 'bun:test';

export function useAuthRequest() {
  return [null, null, mock()];
}

export function makeRedirectUri() {
  return 'https://redirect.test';
}

export const ResponseType = {
  Code: 'code',
  Token: 'token',
  IdToken: 'id_token',
};
