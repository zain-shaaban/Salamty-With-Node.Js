export interface LocationType {
  time: number;
  coords: {
    lat: number;
    lng: number;
  };
}

export interface UserType {
  userID: string;
  socketID: string | null;
  userName: string;
  location: LocationType;
  notificationSent: boolean;
  offline: boolean;
  sos: boolean;
  path: LocationType[];
  destination: {
    coords: { lat: number; lng: number };
    estimatedTime: number;
  };
  notificationDes: boolean;
}

export interface GroupSession {
  groupID: string;
  groupName: string;
  members: UserType[];
}
