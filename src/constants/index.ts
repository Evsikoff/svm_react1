import { BootTask } from "../types";

// Порядок задач загрузки
export const BOOT_TASKS_ORDER: BootTask[] = [
  { key: "init", label: "Инициализация", done: false },
  { key: "mainmenu", label: "Главное меню", done: false },
  { key: "notifications", label: "Уведомления", done: false },
  { key: "monsters", label: "Монстры", done: false },
  { key: "teachenergy", label: "Энергия", done: false },
  { key: "characteristics", label: "Характеристики", done: false },
  { key: "monsterroom", label: "Комната и монстр", done: false },
  { key: "impacts", label: "Взаимодействия", done: false },
];

// API URLs
export const API_URLS = {
  init: "https://functions.yandexcloud.net/d4eft5881ootoasr4lcn",
  mainmenu:
    "https://d5ddiovnmsbs5p6merq9.8wihnuyr.apigw.yandexcloud.net/mainmenu",
  notifications:
    "https://d5ddiovnmsbs5p6merq9.8wihnuyr.apigw.yandexcloud.net/notificationcounter",
  monsters:
    "https://d5ddiovnmsbs5p6merq9.8wihnuyr.apigw.yandexcloud.net/monsters",
  teachenergy: "https://functions.yandexcloud.net/d4ek0gg34e57hosr45u8",
  competitionenergy: "https://functions.yandexcloud.net/d4e83k58k32gf9ibt1jt",
  characteristics: "https://functions.yandexcloud.net/d4eja3aglipp5f8hfb73",
  monsterroom: "https://functions.yandexcloud.net/d4eqemr3g0g9i1kbt5u0",
  impacts: "https://functions.yandexcloud.net/d4en3p6tiu5kcoe261mj",
  impact: "https://functions.yandexcloud.net/d4een4tv1fhjs9o05ogj",
};

// Образы и иконки
export const IMAGES = {
  loading: "https://storage.yandexcloud.net/svm/loading.gif",
  bell: "https://storage.yandexcloud.net/svm/img/bell.png",
  energy: "https://storage.yandexcloud.net/svm/img/userteachenergy.png",
  competitionEnergy:
    "https://storage.yandexcloud.net/svm/img/usercompetitionenergy.png",
};

// Последовательности меню
export const MENU_SEQUENCES = {
  RAISING: 1,
  ARENA: 2,
  SHOP: 3,
  INVENTORY: 4,
  ACCOUNT: 5,
} as const;
