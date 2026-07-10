export interface CreateUserDto {
  firstName: string;
  lastName: string;
  email: string;
}

export interface UpdateUserDto {
  firstName?: string | undefined;
  lastName?: string | undefined;
  email?: string | undefined;
}
