export interface AuthResponse {
  message: string;
  userId?: string;
  token?: string;
  errorCode?: string;
}

export interface SignInData {
  email: string;
  password: string;
}

export interface SignUpData {
  email: string;
  password: string;
  name: string;
}

export const signIn = async (data: SignInData): Promise<AuthResponse> => {
  const response = await fetch(`${process.env.NEXT_PUBLIC_HTTP_BACKEND}/signin`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error('Authentication failed');
  }

  const result = await response.json();
  localStorage.setItem('jwt_token', result.token);
  return result;
};

export const signUp = async (data: SignUpData): Promise<AuthResponse> => {
  const response = await fetch(`${process.env.NEXT_PUBLIC_HTTP_BACKEND}/signup`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error('Registration failed');
  }

  const result = await response.json();
  localStorage.setItem('jwt_token', result.token);
  return result;
};

export const getStoredToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('jwt_token');
};

export const logout = (): void => {
  localStorage.removeItem('jwt_token');
};
