export interface ChurchMember {
  EmpId: number;
  Lastname: string;
  Firstname: string;
  Phone: string;
  Email: string;
  Picture?: Buffer;
  EmailValidationDate?: Date | null;
  RequestDate: Date;
  DeviceID?: string | null;
  DeptId?: number | null;
  userid?: string | null;
  gmail?: string | null;
}

export interface CreateChurchMemberInput extends Omit<ChurchMember, 'EmpId'> {}
export interface UpdateChurchMemberInput extends Partial<ChurchMember> {
  EmpId: number;
}