export const AppleAuthenticationScope = {
  FULL_NAME: 0,
  EMAIL: 1,
};

export const AppleAuthenticationButton = () => null;

export const AppleAuthenticationButtonType = {
  SIGN_IN: 0,
  CONTINUE: 1,
};

export const AppleAuthenticationButtonStyle = {
  WHITE: 0,
  WHITE_OUTLINE: 1,
  BLACK: 2,
};

export async function signInAsync() {
  return {
    identityToken: 'mock-token',
    email: 'test@example.com',
    fullName: { givenName: 'Test', familyName: 'User' },
    user: 'apple-user-id',
  };
}

export async function isAvailableAsync() {
  return true;
}
