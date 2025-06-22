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
}

export interface CreateChurchMemberInput extends Omit<ChurchMember, 'EmpID'> {}
export interface UpdateChurchMemberInput extends Partial<ChurchMember> {
  EmpID: number;
}
