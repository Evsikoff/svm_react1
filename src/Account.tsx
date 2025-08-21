import React from "react";

const Account: React.FC = () => {
  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      {/* Бейдж "Профиль пользователя" */}
      <button className="w-full bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-200 rounded-2xl p-6 shadow-lg hover:from-blue-100 hover:to-blue-150 hover:border-blue-300 transition-all duration-200 active:scale-95">
        <div className="text-center">
          <div className="text-blue-800 text-2xl mb-4">👤</div>
          <h2 className="text-xl font-bold text-blue-800">
            Профиль пользователя
          </h2>
        </div>
      </button>

      {/* Бейдж "Варианты авторизации" */}
      <div className="bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-200 rounded-2xl p-6 shadow-lg">
        <h2 className="text-xl font-bold text-purple-800 mb-6 text-center">
          Выберите сервис для авторизации
        </h2>

        <div className="grid grid-cols-1 gap-4">
          {/* Google */}
          <button className="flex items-center gap-4 bg-white border-2 border-gray-200 rounded-xl p-4 hover:border-red-300 hover:bg-red-50 transition-all duration-200 active:scale-95 group">
            <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-red-600 rounded-lg flex items-center justify-center text-white text-xl font-bold shadow-md">
              G
            </div>
            <div className="flex-1 text-left">
              <div className="font-semibold text-gray-800 group-hover:text-red-700">
                Авторизация через Google
              </div>
              <div className="text-sm text-gray-600 group-hover:text-red-600">
                Быстрый и безопасный вход с аккаунтом Google
              </div>
            </div>
            <div className="text-gray-400 group-hover:text-red-500">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M9 18l6-6-6-6v12z" />
              </svg>
            </div>
          </button>

          {/* Yandex */}
          <button className="flex items-center gap-4 bg-white border-2 border-gray-200 rounded-xl p-4 hover:border-yellow-300 hover:bg-yellow-50 transition-all duration-200 active:scale-95 group">
            <div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-red-500 rounded-lg flex items-center justify-center text-white text-xl font-bold shadow-md">
              Я
            </div>
            <div className="flex-1 text-left">
              <div className="font-semibold text-gray-800 group-hover:text-yellow-700">
                Авторизация через Яндекс
              </div>
              <div className="text-sm text-gray-600 group-hover:text-yellow-600">
                Вход с помощью аккаунта Яндекс
              </div>
            </div>
            <div className="text-gray-400 group-hover:text-yellow-500">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M9 18l6-6-6-6v12z" />
              </svg>
            </div>
          </button>

          {/* VK */}
          <button className="flex items-center gap-4 bg-white border-2 border-gray-200 rounded-xl p-4 hover:border-blue-300 hover:bg-blue-50 transition-all duration-200 active:scale-95 group">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center text-white text-xl font-bold shadow-md">
              VK
            </div>
            <div className="flex-1 text-left">
              <div className="font-semibold text-gray-800 group-hover:text-blue-700">
                Авторизация через ВКонтакте
              </div>
              <div className="text-sm text-gray-600 group-hover:text-blue-600">
                Войти с помощью профиля ВКонтакте
              </div>
            </div>
            <div className="text-gray-400 group-hover:text-blue-500">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M9 18l6-6-6-6v12z" />
              </svg>
            </div>
          </button>
        </div>

        {/* Дополнительная информация */}
        <div className="mt-6 p-4 bg-purple-100 rounded-xl border border-purple-200">
          <div className="flex items-start gap-3">
            <div className="text-purple-600 text-xl">🔒</div>
            <div className="text-sm text-purple-700">
              <div className="font-medium mb-1">Безопасность</div>
              <div>
                Ваши данные защищены и не передаются третьим лицам. Авторизация
                происходит через официальные API сервисов.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Account;
