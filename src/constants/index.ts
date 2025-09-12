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
  init: "https://init2-production.up.railway.app/execute",
  mainmenu:
    "https://d5ddiovnmsbs5p6merq9.8wihnuyr.apigw.yandexcloud.net/mainmenu",
  notifications:
    "https://d5ddiovnmsbs5p6merq9.8wihnuyr.apigw.yandexcloud.net/notificationcounter",
  monsters:
    "https://d5ddiovnmsbs5p6merq9.8wihnuyr.apigw.yandexcloud.net/monsters",
  teachenergy: "https://userteachenergy-production.up.railway.app/teachenergy",
  competitionenergy: "https://functions.yandexcloud.net/d4e83k58k32gf9ibt1jt",
  arenamonsters: "https://functions.yandexcloud.net/d4es67buap1fl8ad3sp8",
  characteristics:
    "https://monstercharacteristics-production.up.railway.app/characteristics",
  monsterroom: "https://functions.yandexcloud.net/d4eqemr3g0g9i1kbt5u0",
  impacts: "https://monsterimpacts-production.up.railway.app/monster-impacts",
  impact: "https://impactslauncher-production.up.railway.app/impact-exec",
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
