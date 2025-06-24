export interface User {
  id?: string;
  email: string;
  name?: string;
  avatar?: string;
}

export interface Team {
  id?: string;
  name: string;
  logo?: string | React.ElementType;
  plan: string;
}
