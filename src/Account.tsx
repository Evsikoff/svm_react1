import React from "react";

/**
 * Простое меню аккаунта.
 * Содержит большую кнопку для перехода в профиль пользователя
 * и бейдж с вариантами авторизации через популярные сервисы.
 * Пока реализована только визуальная часть.
 */
const Account: React.FC = () => {
  return (
    <div className="p-8 flex justify-center">
      <div className="w-full max-w-sm space-y-4">
        <button className="w-full bg-purple-600 text-white py-4 rounded-xl text-xl font-semibold active:scale-95">
          Профиль пользователя
        </button>

        <div className="border border-gray-300 rounded-xl p-4 bg-white shadow flex flex-col items-center space-y-3">
          <span className="text-gray-700 font-medium">
            Авторизоваться через
          </span>
          <div className="flex space-x-4">
            <img
              src="https://img.icons8.com/color/48/google-logo.png"
              alt="Google"
              className="w-10 h-10"
            />
            <img
              src="https://img.icons8.com/color/48/yandex.png"
              alt="Yandex"
              className="w-10 h-10"
            />
            <img
              src="https://img.icons8.com/color/48/vk-com.png"
              alt="VK"
              className="w-10 h-10"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Account;

