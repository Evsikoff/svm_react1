// Account.tsx
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
  userId: number | null;
}

// Глобальные переменные для Google OAuth
declare global {
  interface Window {
    google: any;
    gapi: any;
  }
}

const Account: React.FC<AccountProps> = ({ userId }) => {
  // Состояния компонента
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [userData, setUserData] = useState<UserAccountData | null>(null);
  const [username, setUsername] = useState<string>("");
  const [originalUsername, setOriginalUsername] = useState<string>("");
  const [saveLoading, setSaveLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [modalMessage, setModalMessage] = useState<string>("");
  const [googleLoading, setGoogleLoading] = useState(false);
  const [yandexLoading, setYandexLoading] = useState(false);
  const [vkLoading, setVkLoading] = useState(false);

  // Константы OAuth
  const GOOGLE_CLIENT_ID =
    "125465866043-pe37ut04loiu1vg8rni1vf7tt7dv247i.apps.googleusercontent.com";
  const YANDEX_CLIENT_ID = "3d7ec2c7ceb34ed59b445d7fb152ac9f";
  const YANDEX_CLIENT_SECRET = "1d85ca9e132b4e419c960c38832f8d71";
  const VK_CLIENT_ID = "54069665";
  const VK_CLIENT_SECRET = "wD4EGCDwIg5lpTO1s8tj";


  // Загрузка Google API скрипта (убираем видимую кнопку)
  useEffect(() => {
    const loadGoogleScript = () => {
      if (window.google || document.getElementById("google-signin-script")) {
        return Promise.resolve();
      }

      return new Promise<void>((resolve, reject) => {
        const script = document.createElement("script");
        script.id = "google-signin-script";
        script.src = "https://accounts.google.com/gsi/client";
        script.async = true;
        script.defer = true;
        script.onload = () => resolve();
        script.onerror = () =>
          reject(new Error("Failed to load Google script"));
        document.head.appendChild(script);
      });
    };

    loadGoogleScript().catch(console.error);

    // Очистка при размонтировании компонента
    return () => {
      if (
        window.google &&
        window.google.accounts &&
        window.google.accounts.id
      ) {
        try {
          window.google.accounts.id.disableAutoSelect();
        } catch (error) {
          console.log("Google cleanup error:", error);
        }
      }
    };
  }, []);

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

  // Обработка возврата с авторизации VK
  useEffect(() => {
    const url = new URL(window.location.href);
    const state = url.searchParams.get("state");
    const code = url.searchParams.get("code");

    const deviceId = url.searchParams.get("device_id");
    const error = url.searchParams.get("error");
    const errorDescription = url.searchParams.get("error_description");


    if (state !== "vk") return;

    if (error) {
      setModalMessage(
        errorDescription || "Авторизация VK не удалась"
      );
      setShowModal(true);
      url.searchParams.delete("error");
      url.searchParams.delete("error_description");

      url.searchParams.delete("state");
      window.history.replaceState(
        null,
        "",
        url.pathname +
          (url.searchParams.toString()
            ? `?${url.searchParams.toString()}`
            : "") +
          url.hash
      );
      return;
    }


    if (code && deviceId && userId) {
      setVkLoading(true);
      const redirectUri = window.location.origin + window.location.pathname;
      const codeVerifier =
        sessionStorage.getItem("vk_code_verifier") || "";

      const fetchVkData = async () => {
        try {
          const tokenResponse = await fetch(
            "https://id.vk.com/oauth2/auth",
            {
              method: "POST",
              headers: {
                "Content-Type": "application/x-www-form-urlencoded",
              },
              body: new URLSearchParams({
                grant_type: "authorization_code",
                client_id: VK_CLIENT_ID,
                client_secret: VK_CLIENT_SECRET,
                code,
                device_id: deviceId,
                redirect_uri: redirectUri,
                code_verifier: codeVerifier,
              }),
            }

          );

          const tokenData = await tokenResponse.json();
          if (tokenData.error) {
            throw new Error(tokenData.error_description || "Token error");
          }

          let vkUserId = tokenData.user_id || tokenData.user?.id;
          let fullName = "";
          let avatar = "";

          if (tokenData.user) {
            fullName = `${tokenData.user.first_name || ""} ${
              tokenData.user.last_name || ""
            }`.trim();
            avatar =
              tokenData.user.avatar ||
              tokenData.user.avatar_100 ||
              tokenData.user.photo_100 ||
              tokenData.user.picture ||
              "";
          }

          if (tokenData.id_token) {
            try {
              const payload = JSON.parse(
                base64UrlDecode(tokenData.id_token.split(".")[1])
              );
              vkUserId = vkUserId || payload.sub;
              fullName =
                fullName ||
                payload.name ||
                `${payload.first_name || ""} ${
                  payload.last_name || ""
                }`.trim();
              avatar = avatar || payload.picture || "";
            } catch (e) {
              console.error("VK id_token parse error:", e);
            }
          }

          if ((!fullName || !avatar) && vkUserId && tokenData.access_token) {
            try {
              const userResponse = await fetch(
                `https://api.vk.com/method/users.get?user_ids=${vkUserId}&fields=photo_100&access_token=${tokenData.access_token}&v=5.131`
              );
              const userJson = await userResponse.json();
              const info =
                userJson.response && userJson.response.length > 0
                  ? userJson.response[0]
                  : null;
              if (info) {
                fullName =
                  fullName ||
                  `${info.first_name || ""} ${info.last_name || ""}`.trim();
                avatar = avatar || info.photo_100 || "";
              }
            } catch (e) {
              console.error("VK user info fetch error:", e);
            }
          }


          await fetch(
            "https://functions.yandexcloud.net/d4el0k9669mrdg265k5r",
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                userId,

                newserviceid: String(vkUserId || ""),

                newservicename: fullName,
                newserviceimage: avatar,
                service: "vk",
              }),
            }
          );

          setModalMessage("VK аккаунт успешно подключен");
          setShowModal(true);
          await loadUserData();
        } catch (err) {
          console.error("Ошибка при подключении VK аккаунта:", err);
          setModalMessage("Ошибка при подключении VK аккаунта");
          setShowModal(true);
        } finally {
          setVkLoading(false);

          sessionStorage.removeItem("vk_code_verifier");
          url.searchParams.delete("code");
          url.searchParams.delete("device_id");

          url.searchParams.delete("state");
          window.history.replaceState(
            null,
            "",
            url.pathname +
              (url.searchParams.toString()
                ? `?${url.searchParams.toString()}`
                : "") +
              url.hash
          );
        }
      };

      fetchVkData();
    }
  }, [userId]);

  // Обработка возврата с авторизации Yandex
  useEffect(() => {
    const url = new URL(window.location.href);
    const state = url.searchParams.get("state");
    if (state === "vk") return;
    const code = url.searchParams.get("code");
    const error = url.searchParams.get("error");

    const clearParams = () => {
      url.searchParams.delete("code");
      url.searchParams.delete("error");
      url.searchParams.delete("state");
      window.history.replaceState(
        null,
        "",
        url.pathname +
          (url.searchParams.toString()
            ? `?${url.searchParams.toString()}`
            : "") +
          url.hash
      );
    };

    // Авторизация во фрейме "Авторизация"
    if (state === "yandex_auth") {
      if (error) {
        setModalMessage("Авторизация Yandex не удалась");
        setShowModal(true);
        clearParams();
        return;
      }

      if (code && userId) {
        setYandexLoading(true);

        const fetchYandexAuth = async () => {
          try {
            const tokenResponse = await fetch("https://oauth.yandex.ru/token", {
              method: "POST",
              headers: {
                "Content-Type": "application/x-www-form-urlencoded",
              },
              body: new URLSearchParams({
                grant_type: "authorization_code",
                code,
                client_id: YANDEX_CLIENT_ID,
                client_secret: YANDEX_CLIENT_SECRET,
              }),
            });

            if (!tokenResponse.ok) {
              throw new Error(`HTTP error! status: ${tokenResponse.status}`);
            }

            const tokenData = await tokenResponse.json();
            const accessToken = tokenData.access_token;

            const infoResponse = await fetch(
              "https://login.yandex.ru/info?format=json",
              {
                headers: {
                  Authorization: `OAuth ${accessToken}`,
                },
              }
            );

            if (!infoResponse.ok) {
              throw new Error(`HTTP error! status: ${infoResponse.status}`);
            }

            const info = await infoResponse.json();
            const avatarUrl = info.is_avatar_empty
              ? ""
              : `https://avatars.yandex.net/get-yapic/${info.default_avatar_id}/islands-200`;

            const response = await fetch(
              "https://functions.yandexcloud.net/d4el0k9669mrdg265k5r",
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  userId,
                  newserviceid: info.id,
                  newservicename: info.display_name || info.login,
                  newserviceimage: avatarUrl,
                  service: "yandex",
                }),
              }
            );

            if (!response.ok) {
              throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();

            if (result.userId) {
              clearParams();

              window.location.reload();
              return;
            }

            setModalMessage(result.text || "Авторизация Yandex не удалась");
            setShowModal(true);
          } catch (err) {
            console.error("Ошибка при авторизации через Yandex:", err);
            setModalMessage("Ошибка при авторизации Yandex");
            setShowModal(true);
          } finally {
            setYandexLoading(false);
            clearParams();
          }
        };

        fetchYandexAuth();
      }
      return;
    }

    // Подключение аккаунта Yandex
    if (error) {
      setModalMessage("Авторизация Yandex не удалась");
      setShowModal(true);
      clearParams();
      return;
    }

    if (code && userId) {
      setYandexLoading(true);

      const fetchYandexData = async () => {
        try {
          const tokenResponse = await fetch("https://oauth.yandex.ru/token", {
            method: "POST",
            headers: {
              "Content-Type": "application/x-www-form-urlencoded",
            },
            body: new URLSearchParams({
              grant_type: "authorization_code",
              code,
              client_id: YANDEX_CLIENT_ID,
              client_secret: YANDEX_CLIENT_SECRET,
            }),
          });

          if (!tokenResponse.ok) {
            throw new Error(`HTTP error! status: ${tokenResponse.status}`);
          }

          const tokenData = await tokenResponse.json();
          const accessToken = tokenData.access_token;

          const infoResponse = await fetch(
            "https://login.yandex.ru/info?format=json",
            {
              headers: {
                Authorization: `OAuth ${accessToken}`,
              },
            }
          );

          if (!infoResponse.ok) {
            throw new Error(`HTTP error! status: ${infoResponse.status}`);
          }

          const info = await infoResponse.json();
          const avatarUrl = info.is_avatar_empty
            ? ""
            : `https://avatars.yandex.net/get-yapic/${info.default_avatar_id}/islands-200`;

          await fetch(
            "https://functions.yandexcloud.net/d4el0k9669mrdg265k5r",
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                userId,
                newserviceid: info.id,
                newservicename: info.display_name || info.login,
                newserviceimage: avatarUrl,
                service: "yandex",
              }),
            }
          );

          setModalMessage("Yandex аккаунт успешно подключен");
          setShowModal(true);
          await loadUserData();
        } catch (err) {
          console.error("Ошибка при подключении Yandex аккаунта:", err);
          setModalMessage("Ошибка при подключении Yandex аккаунта");
          setShowModal(true);
        } finally {
          setYandexLoading(false);
          clearParams();
        }
      };

      fetchYandexData();
    }
  }, [userId]);

  // Функция для декодирования base64url с поддержкой UTF-8
  const base64UrlDecode = (str: string): string => {
    str = str.replace(/-/g, "+").replace(/_/g, "/");
    while (str.length % 4) str += "=";

    const binary = atob(str);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }

    return new TextDecoder("utf-8").decode(bytes);
  };

  // Функция обработки успешной авторизации Google
  const handleGoogleSuccess = async (credentialResponse: any) => {
    setGoogleLoading(true);

    try {
      // Декодируем JWT токен правильно с поддержкой UTF-8
      const credential = credentialResponse.credential;
      const payloadStr = base64UrlDecode(credential.split(".")[1]);
      const payload = JSON.parse(payloadStr);

      const googleUserData = {
        userId: userId,
        newserviceid: payload.sub, // Google ID пользователя
        newservicename: payload.name || "", // Имя пользователя (уже в правильной кодировке)
        newserviceimage: payload.picture, // URL аватара
        service: "google",
      };

      console.log("Отправляем данные в Yandex функцию:", googleUserData);

      // Отправляем данные в Yandex функцию
      const response = await fetch(
        "https://functions.yandexcloud.net/d4el0k9669mrdg265k5r",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json; charset=utf-8",
          },
          body: JSON.stringify(googleUserData),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      // Показываем ответ от функции
      setModalMessage(result.text || "Google аккаунт успешно подключен");
      setShowModal(true);

      // Обновляем данные пользователя
      await loadUserData();
    } catch (err: any) {
      console.error("Ошибка при подключении Google аккаунта:", err);
      setModalMessage("Ошибка при подключении Google аккаунта");
      setShowModal(true);
    } finally {
      setGoogleLoading(false);
    }
  };

  // Функция обработки ошибки авторизации Google
  const handleGoogleError = () => {
    console.error("Google авторизация не удалась");
    setGoogleLoading(false);
    setModalMessage("Авторизация Google не удалась. Попробуйте еще раз.");
    setShowModal(true);
  };

  // Обработчик нажатия на кнопку "Подключить Google"
  const handleConnectGoogle = () => {
    if (!window.google || !window.google.accounts) {
      console.error("Google SDK не загружен");
      setModalMessage("Google SDK не загружен. Попробуйте обновить страницу.");
      setShowModal(true);
      return;
    }

    try {
      window.google.accounts.id.prompt((notification: any) => {
        if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
          console.warn("Google prompt skipped or not displayed");
        }
      });

      // Инициализируем One Tap с callback
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: (response: any) => {
          if (response.credential) {
            handleGoogleSuccess(response);
          } else {
            handleGoogleError();
          }
        },
        auto_select: false,
        cancel_on_tap_outside: true,
        context: "use",
      });

      // Показываем One Tap prompt
      window.google.accounts.id.prompt();
    } catch (error) {
      console.error("Ошибка инициализации Google:", error);
      setModalMessage("Ошибка при подключении Google");
      setShowModal(true);
    }
  };

  // Обработчик нажатия на кнопку "Подключить Yandex"
  const handleConnectYandex = () => {
    const redirectUri = window.location.origin + window.location.pathname;
    const authUrl =
      `https://oauth.yandex.ru/authorize?response_type=code&client_id=${YANDEX_CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUri)}`;
    setYandexLoading(true);
    window.location.href = authUrl;
  };

  // Генерация случайной строки для PKCE
  const generateRandomString = (length: number): string => {
    const array = new Uint8Array(length);
    window.crypto.getRandomValues(array);
    return Array.from(array, (dec) =>
      dec.toString(16).padStart(2, "0")
    )
      .join("")
      .slice(0, length);
  };

  const generateCodeChallenge = async (
    verifier: string
  ): Promise<string> => {
    const data = new TextEncoder().encode(verifier);
    const digest = await window.crypto.subtle.digest("SHA-256", data);
    return btoa(String.fromCharCode(...Array.from(new Uint8Array(digest))))
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");
  };

  // Обработчик нажатия на кнопку "Подключить VK"
  const handleConnectVK = async () => {
    const redirectUri = window.location.origin + window.location.pathname;
    const codeVerifier = generateRandomString(64);
    const codeChallenge = await generateCodeChallenge(codeVerifier);
    sessionStorage.setItem("vk_code_verifier", codeVerifier);
    const authUrl =
      `https://id.vk.com/authorize?client_id=${VK_CLIENT_ID}&redirect_uri=${encodeURIComponent(
        redirectUri
      )}&response_type=code&state=vk&code_challenge=${codeChallenge}&code_challenge_method=s256`;

    setVkLoading(true);
    window.location.href = authUrl;
  };

  // Общая функция для проверки подключения сервиса
  const isServiceConnected = (service: "google" | "yandex" | "vk") => {
    if (!userData) return false;
    switch (service) {
      case "google":
        return !!userData.googleuserid;
      case "yandex":
        return !!userData.yandexuserid;
      case "vk":
        return !!userData.vkuserid;
      default:
        return false;
    }
  };

  // Обработчик сохранения имени
  const handleSaveName = async () => {
    if (!userId || !username.trim()) return;

    setSaveLoading(true);

    try {
      const response = await fetch(
        "https://functions.yandexcloud.net/d4e0uavcq6k9i9b4c9rb",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            userId,
            newusername: username.trim(),
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result: SaveNameResponse = await response.json();
      setModalMessage(result.text || "Имя успешно сохранено");
      setShowModal(true);
      setOriginalUsername(username.trim());
      await loadUserData(); // Обновляем данные
    } catch (err: any) {
      setModalMessage("Ошибка при сохранении имени");
      setShowModal(true);
    } finally {
      setSaveLoading(false);
    }
  };

  // Функция обработки нажатия кнопки "Подключить" для сервисов
  const handleConnect = (service: "google" | "yandex" | "vk") => {
    switch (service) {
      case "google":
        handleConnectGoogle();
        break;
      case "yandex":
        handleConnectYandex();
        break;
      case "vk":
        handleConnectVK();
        break;
    }
  };

  // Функция обработки успешной авторизации Google во фрейме "Авторизация"
  const handleGoogleAuthSuccess = async (credentialResponse: any) => {
    setGoogleLoading(true);

    try {
      const credential = credentialResponse.credential;
      const payloadStr = base64UrlDecode(credential.split(".")[1]);
      const payload = JSON.parse(payloadStr);

      const googleAuthData = {
        userId: userId,
        newserviceid: payload.sub,
        newservicename: payload.name || "",
        newserviceimage: payload.picture,
        service: "google",
      };

      const response = await fetch(
        "https://functions.yandexcloud.net/d4el0k9669mrdg265k5r",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json; charset=utf-8",
          },
          body: JSON.stringify(googleAuthData),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (result.userId) {
        window.location.reload();
        return;
      }

      setModalMessage(result.text || "Авторизация Google не удалась");
      setShowModal(true);
    } catch (err: any) {
      console.error("Ошибка при авторизации через Google:", err);
      setModalMessage("Ошибка при авторизации Google");
      setShowModal(true);
    } finally {
      setGoogleLoading(false);
    }
  };

  // Обработчик ошибки авторизации Google
  const handleGoogleAuthError = () => {
    console.error("Google авторизация не удалась");
    setGoogleLoading(false);
    setModalMessage("Авторизация Google не удалась. Попробуйте еще раз.");
    setShowModal(true);
  };

  // Обработчик нажатия на кнопку авторизации Google
  const handleAuthGoogle = () => {
    if (!window.google || !window.google.accounts) {
      console.error("Google SDK не загружен");
      setModalMessage("Google SDK не загружен. Попробуйте обновить страницу.");
      setShowModal(true);
      return;
    }

    try {
      window.google.accounts.id.prompt((notification: any) => {
        if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
          console.warn("Google prompt skipped or not displayed");
        }
      });

      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: (response: any) => {
          if (response.credential) {
            handleGoogleAuthSuccess(response);
          } else {
            handleGoogleAuthError();
          }
        },
        auto_select: false,
        cancel_on_tap_outside: true,
        context: "use",
      });

      window.google.accounts.id.prompt();
    } catch (error) {
      console.error("Ошибка инициализации Google:", error);
      setModalMessage("Ошибка авторизации Google");
      setShowModal(true);
    }
  };

  // Обработчик нажатия на кнопку авторизации Yandex
  const handleAuthYandex = () => {
    const redirectUri = window.location.origin + window.location.pathname;
    const authUrl =
      `https://oauth.yandex.ru/authorize?response_type=code&client_id=${YANDEX_CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&state=yandex_auth`;
    setYandexLoading(true);
    window.location.href = authUrl;
  };

  // Функция обработки нажатия кнопки авторизации
  const handleAuthClick = (service: "google" | "yandex" | "vk") => {
    switch (service) {
      case "google":
        handleAuthGoogle();
        break;
      case "yandex":
        handleAuthYandex();
        break;
      default:
        setModalMessage(
          `Авторизация через ${
            service.charAt(0).toUpperCase() + service.slice(1)
          } в разработке`
        );
        setShowModal(true);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 text-red-700 p-4 rounded-lg border border-red-300">
        {error}
      </div>
    );
  }

  if (!userData) {
    return null;
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-8">
      {/* Фрейм "Данные о пользователе" */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-2xl p-6 shadow-lg">
        <h2 className="text-xl font-bold text-blue-800 mb-6 text-center">
          Данные о пользователе
        </h2>

        <div className="flex flex-col sm:flex-row items-center gap-6 mb-6">
          {/* Фотография пользователя */}
          <div className="flex-shrink-0">
            <img
              src={
                userData?.userphotourl ||
                "https://storage.yandexcloud.net/svm/img/nophoto.png"
              }
              alt="Фото пользователя"
              className="w-24 h-24 rounded-full object-cover border-4 border-blue-300 shadow-md"
              onError={(e) => {
                console.warn("Ошибка загрузки фото пользователя");
                e.currentTarget.src =
                  "https://storage.yandexcloud.net/svm/img/nophoto.png";
              }}
            />
          </div>

          {/* Поле имени пользователя */}
          <div className="w-full sm:w-auto flex-grow">
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-blue-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all duration-200 text-lg"
              placeholder="Введите имя пользователя"
            />
          </div>

          {/* Кнопка сохранения */}
          <button
            onClick={handleSaveName}
            disabled={
              saveLoading ||
              !username.trim() ||
              username.trim() === originalUsername
            }
            className="w-full sm:w-auto px-6 py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg flex items-center justify-center"
          >
            {saveLoading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              "Сохранить"
            )}
          </button>
        </div>
      </div>

      {/* Фрейм "Подключенные аккаунты" */}
      <div className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 rounded-2xl p-6 shadow-lg">
        <h2 className="text-xl font-bold text-green-800 mb-6 text-center">
          Подключенные аккаунты
        </h2>

        <div className="space-y-4">
          {/* Google */}
          <div className="flex items-center justify-between bg-white rounded-xl p-4 border border-red-200">
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
                  disabled={googleLoading}
                  className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors duration-200 text-sm flex items-center gap-2"
                >
                  {googleLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Подключаем...
                    </>
                  ) : (
                    "Подключить"
                  )}
                </button>
              )}
            </div>
          </div>

          {/* Yandex */}
          <div className="flex items-center justify-between bg-white rounded-xl p-4 border border-yellow-200">
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
                  disabled={yandexLoading}
                  className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors duration-200 text-sm flex items-center gap-2"
                >
                  {yandexLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Подключаем...
                    </>
                  ) : (
                    "Подключить"
                  )}
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
