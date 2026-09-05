export interface ResetPasswordCommand {
  token: string;
  password: string;
  confirmPassword: string;
}
