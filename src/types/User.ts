export interface User {
  id: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  createdAt?: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}
