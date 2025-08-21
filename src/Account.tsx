import React, { useState, useEffect } from "react";

// Типы данных для ответа от сервера
interface UserAccountData {
  username: string;
  userphotourl: string;
  googleuserid?: string;
  yandexuserid?: string;
  vkuserid?: string;
}

interface SaveNameResponse {
  text: string;
}

interface AccountProps {
  userId?: number | null;
}

const Account: React.FC<AccountProps> = ({ userId = 11131 }) => {
  // Состояния компонента
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [userData, setUserData] = useState<UserAccountData | null>(null);
  const [username, setUsername] = useState<string>("");
  const [originalUsername, setOriginalUsername] = useState<string>("");
  const [saveLoading, setSaveLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [modalMessage, setModalMessage] = useState<string>("");

  // Загрузка данных пользователя
  const loadUserData = async () => {
    if (!userId) {
      setError("Идентификатор пользователя отсутствует");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        "https://functions.yandexcloud.net/d4e9ranipvahqrcc8sd4",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ userId }),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: UserAccountData = await response.json();
      setUserData(data);
      setUsername(data.username || "");
      setOriginalUsername(data.username || "");
    } catch (err: any) {
      setError("Ошибка при загрузке данных пользователя");
      console.error("Ошибка загрузки данных пользователя:", err);
    } finally {
      setLoading(false);
    }
  };

  // Загрузка данных при монтировании компонента
  useEffect(() => {
    loadUserData();
  }, [userId]);

  // Сохранение имени пользователя
  const handleSaveName = async () => {
    if (!userId || username.trim() === originalUsername.trim()) {
      return;
    }

    setSaveLoading(true);

    try {
      const response = await fetch(
        "https://functions.yandexcloud.net/d4ep0ucg6i4e7s0p81ph",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            userId,
            newname: username.trim(),
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: SaveNameResponse = await response.json();
      setModalMessage(data.text || "Имя успешно сохранено");
      setShowModal(true);
      setOriginalUsername(username.trim());

      // Обновляем данные пользователя
      if (userData) {
        setUserData({ ...userData, username: username.trim() });
      }
    } catch (err: any) {
      setModalMessage("Ошибка при сохранении имени");
      setShowModal(true);
      console.error("Ошибка сохранения имени:", err);
    } finally {
      setSaveLoading(false);
    }
  };

  // Проверка, изменилось ли имя пользователя
  const isNameChanged =
    username.trim() !== originalUsername.trim() && username.trim() !== "";

  // Получение URL фотографии пользователя
  const getUserPhotoUrl = (): string => {
    if (userData?.userphotourl && userData.userphotourl.trim() !== "") {
      return userData.userphotourl;
    }
    return "https://storage.yandexcloud.net/svm/img/nophoto.png";
  };

  // Проверка подключения сервиса
  const isServiceConnected = (service: "google" | "yandex" | "vk"): boolean => {
    if (!userData) return false;

    switch (service) {
      case "google":
        return !!(userData.googleuserid && userData.googleuserid.trim() !== "");
      case "yandex":
        return !!(userData.yandexuserid && userData.yandexuserid.trim() !== "");
      case "vk":
        return !!(userData.vkuserid && userData.vkuserid.trim() !== "");
      default:
        return false;
    }
  };

  // Обработчик нажатия на кнопку "Подключить" (пока ничего не делает)
  const handleConnect = (service: string) => {
    console.log(`Попытка подключения к сервису: ${service}`);
    // TODO: Реализовать логику подключения
  };

  // Обработчик нажатия на иконку авторизации (пока ничего не делает)
  const handleAuthClick = (service: string) => {
    console.log(`Попытка авторизации через: ${service}`);
    // TODO: Реализовать логику авторизации
  };

  if (loading) {
    return (
      <div className="p-6 max-w-2xl mx-auto">
        <div className="w-full flex items-center justify-center py-16">
          <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 max-w-2xl mx-auto">
        <div className="bg-red-100 text-red-700 border border-red-300 px-4 py-3 rounded-lg">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      {/* Фрейм "Данные о пользователе" */}
      <div className="bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-200 rounded-2xl p-6 shadow-lg">
        <h2 className="text-xl font-bold text-blue-800 mb-6 text-center">
          Данные о пользователе
        </h2>

        <div className="flex flex-col items-center space-y-4">
          {/* Фотография пользователя */}
          <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-blue-300 shadow-md">
            <img
              src={getUserPhotoUrl()}
              alt="Фото пользователя"
              className="w-full h-full object-cover"
              onError={(e) => {
                e.currentTarget.src =
                  "https://storage.yandexcloud.net/svm/img/nophoto.png";
              }}
            />
          </div>

          {/* Поле для редактирования имени */}
          <div className="w-full max-w-sm">
            <label
              htmlFor="username"
              className="block text-sm font-medium text-blue-800 mb-2"
            >
              Имя пользователя
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Введите ваше имя"
            />
          </div>

          {/* Кнопка "Сохранить" */}
          <button
            onClick={handleSaveName}
            disabled={!isNameChanged || saveLoading}
            className={`px-6 py-2 rounded-lg font-medium transition-all duration-200 ${
              isNameChanged && !saveLoading
                ? "bg-blue-500 text-white hover:bg-blue-600 active:scale-95"
                : "bg-gray-300 text-gray-500 cursor-not-allowed"
            }`}
          >
            {saveLoading ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Сохранение...
              </div>
            ) : (
              "Сохранить"
            )}
          </button>
        </div>
      </div>

      {/* Фрейм "Подключенные аккаунты" */}
      <div className="bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-200 rounded-2xl p-6 shadow-lg">
        <h2 className="text-xl font-bold text-green-800 mb-6 text-center">
          Подключенные аккаунты
        </h2>

        <div className="space-y-4">
          {/* Google */}
          <div className="flex items-center justify-between bg-white rounded-xl p-4 border border-green-200">
            <div className="flex items-center gap-3">
              <img
                src="https://storage.yandexcloud.net/svm/img/service_icons/google.png"
                alt="Google"
                className="w-8 h-8"
              />
              <span className="font-medium text-gray-800">Google</span>
            </div>
            <div>
              {isServiceConnected("google") ? (
                <div className="flex items-center text-green-600">
                  <svg
                    className="w-6 h-6"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
              ) : (
                <button
                  onClick={() => handleConnect("google")}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors duration-200 text-sm"
                >
                  Подключить
                </button>
              )}
            </div>
          </div>

          {/* Yandex */}
          <div className="flex items-center justify-between bg-white rounded-xl p-4 border border-green-200">
            <div className="flex items-center gap-3">
              <img
                src="https://storage.yandexcloud.net/svm/img/service_icons/yandex.png"
                alt="Yandex"
                className="w-8 h-8"
              />
              <span className="font-medium text-gray-800">Yandex</span>
            </div>
            <div>
              {isServiceConnected("yandex") ? (
                <div className="flex items-center text-green-600">
                  <svg
                    className="w-6 h-6"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
              ) : (
                <button
                  onClick={() => handleConnect("yandex")}
                  className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors duration-200 text-sm"
                >
                  Подключить
                </button>
              )}
            </div>
          </div>

          {/* VK */}
          <div className="flex items-center justify-between bg-white rounded-xl p-4 border border-green-200">
            <div className="flex items-center gap-3">
              <img
                src="https://storage.yandexcloud.net/svm/img/service_icons/vk.png"
                alt="VK"
                className="w-8 h-8"
              />
              <span className="font-medium text-gray-800">VK</span>
            </div>
            <div>
              {isServiceConnected("vk") ? (
                <div className="flex items-center text-green-600">
                  <svg
                    className="w-6 h-6"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
              ) : (
                <button
                  onClick={() => handleConnect("vk")}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 text-sm"
                >
                  Подключить
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Фрейм "Авторизация" */}
      <div className="bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-200 rounded-2xl p-6 shadow-lg">
        <h2 className="text-xl font-bold text-purple-800 mb-6 text-center">
          Авторизация
        </h2>

        <div className="flex justify-center gap-8">
          {/* Google */}
          <button
            onClick={() => handleAuthClick("google")}
            className="flex flex-col items-center p-4 bg-white rounded-xl border border-purple-200 hover:border-purple-300 hover:shadow-md transition-all duration-200 active:scale-95"
          >
            <img
              src="https://storage.yandexcloud.net/svm/img/service_icons/google.png"
              alt="Google"
              className="w-12 h-12 mb-2"
            />
            <span className="text-sm font-medium text-gray-800">Google</span>
          </button>

          {/* Yandex */}
          <button
            onClick={() => handleAuthClick("yandex")}
            className="flex flex-col items-center p-4 bg-white rounded-xl border border-purple-200 hover:border-purple-300 hover:shadow-md transition-all duration-200 active:scale-95"
          >
            <img
              src="https://storage.yandexcloud.net/svm/img/service_icons/yandex.png"
              alt="Yandex"
              className="w-12 h-12 mb-2"
            />
            <span className="text-sm font-medium text-gray-800">Yandex</span>
          </button>

          {/* VK */}
          <button
            onClick={() => handleAuthClick("vk")}
            className="flex flex-col items-center p-4 bg-white rounded-xl border border-purple-200 hover:border-purple-300 hover:shadow-md transition-all duration-200 active:scale-95"
          >
            <img
              src="https://storage.yandexcloud.net/svm/img/service_icons/vk.png"
              alt="VK"
              className="w-12 h-12 mb-2"
            />
            <span className="text-sm font-medium text-gray-800">VK</span>
          </button>
        </div>
      </div>

      {/* Модальное окно */}
      {showModal && (
        <div
          className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50"
          onClick={() => setShowModal(false)}
        >
          <div
            className="bg-white rounded-xl shadow-xl p-6 max-w-md w-full mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-lg font-semibold mb-4 text-gray-800">
              Результат
            </div>
            <div className="text-gray-700 mb-6">{modalMessage}</div>
            <div className="flex justify-end">
              <button
                onClick={() => setShowModal(false)}
                className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors duration-200"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Account;
