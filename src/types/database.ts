export interface ChurchMember {
  EmpID?: number;
  lastname: string;
  firstname: string;
  phone: string;
  email: string;
  Picture_Url?: string | null;
  EmailValidationDate?: Date | null;
  RequestDate: Date;
  DeviceID?: string | null;
  userid?: string | null;
  gmail?: string | null;
  created_at?: Date;
  updated_at?: Date;
}

export interface CreateChurchMemberInput extends Omit<ChurchMember, 'EmpID' | 'created_at' | 'updated_at'> {}
export interface UpdateChurchMemberInput extends Partial<ChurchMember> {
  EmpID: number;
}