// Основные типы данных для приложения

export interface InitResponse {
  userId: number;
  monstersId: number[];
  newUser: boolean;
}

export interface MenuItem {
  name: string;
  sequence: number;
  iconURL: string;
  index: boolean;
}

export interface MainMenuResponse {
  menuitems: MenuItem[];
}

export interface NotificationResponse {
  notificationquantity: number;
}

export interface Monster {
  face: string;
  name: string;
  sequence: number;
  index: boolean;
}

export interface MonstersResponse {
  monsters: Monster[];
}

export interface TeachEnergyResponse {
  teachenergy: number;
  nextfreereplenishment: string;
}

export interface MonsterCharacteristic {
  id: number;
  value: number;
  icon: string;
  name: string;
}

export interface MonsterCharacteristicsResponse {
  monstercharacteristics: MonsterCharacteristic[];
}

export interface MonsterImpact {
  id: number;
  image: string;
  name: string;
  comment: string;
  available: boolean;
  energyprice: number;
  minendurance?: number;
}

export interface MonsterImpactsResponse {
  monsterimpacts: MonsterImpact[];
}

export interface RoomItem {
  id: number;
  name: string;
  spriteUrl: string;
  placement: string;
  xaxis: number;
  yaxis: number;
}

export interface MonsterRoomResponse {
  monsterimage: string;
  roomimage: string;
  roomitems: RoomItem[];
}

export interface InventoryItem {
  inventoryid: number;
  inventoryname: string;
  inventoryimage: string;
  inventorydescription: string;
  quantity: number;
}

export interface ImpactResponse {
  errortext: string;
  video?: string;
  text?: string;
  characteristicschanges?: {
    characteristicsid: number;
    name: string;
    amount: number;
  }[];
  inventoryitems?: InventoryItem[];
}

// Типы для полосы загрузки
export type BootTaskKey =
  | "init"
  | "mainmenu"
  | "notifications"
  | "monsters"
  | "teachenergy"
  | "characteristics"
  | "monsterroom"
  | "impacts";

export type BootTask = {
  key: BootTaskKey;
  label: string;
  done: boolean;
};

// Типы для пропсов компонентов
export interface EnergyProps {
  current: number;
  max: number;
  regenHint?: string;
}

export interface MobileMainMenuProps {
  items: MenuItem[];
  selectedName: string | null;
  notificationCount: number;
  onSelect: (item: MenuItem) => void;
  onToggleNotifications: () => void;
}

export interface AutoFitTextProps {
  children: React.ReactNode;
  min?: number;
  max?: number;
  className?: string;
}

// Дополнительные типы для компонента MonsterItems
// Эти типы нужно добавить в src/types/index.ts

export interface MonsterItemAction {
  actionname: string;
  actionicon: string;
  actionfunction: string;
  actionargument: string;
}

export interface MonsterInventoryItem {
  inventoryid: number;
  inventoryname: string;
  inventoryimage: string;
  inventoryfunction: string | null;
  inventorydescription: string;
  inventorytype: number;
  inventorysaleprice: number;
  quantity: number;
  activity: boolean;
  itemactions: MonsterItemAction[];
}

export interface MonsterWithItems {
  monsterid: number;
  monstername: string;
  monsterface: string;
  monsteritems: MonsterInventoryItem[];
}

export interface MonsterItemsResponse {
  monsters: MonsterWithItems[];
}