export interface ChurchMember {
  EmpID?: number;
  lastname: string;
  firstname: string;
  phone: string;
  email: string;
  PictureUrl?: string | null;
  EmailValidationDate?: Date | string | null;
  RequestDate: Date | string;
  DeviceID?: string | null;
  userid?: string | null;
  gmail?: string | null;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

export interface CreateChurchMemberInput extends Omit<ChurchMember, 'EmpID' | 'createdAt' | 'updatedAt'> {}
export interface UpdateChurchMemberInput extends Partial<ChurchMember> {
  EmpID: number;
}
