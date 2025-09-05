import React, { useEffect, useState } from "react";
import axios from "axios";
import Spinner from "./Spinner";

interface WaitingProps {
  monsterId: number;
  competitionId: string | number;
  onCompetitionStart: (id: number) => void;
}

const WS_ENDPOINT = "wss://d5doo0fs9nl1iu1ae464.akta928u.apigw.yandexcloud.net/ws";
const START_ENDPOINT = "https://functions.yandexcloud.net/d4euroa2kfgg47hna4f0";
const GIF_URL = "https://storage.yandexcloud.net/svm/img/matchmakingexpectation.gif";

const WaitingForOpponentsModal: React.FC<WaitingProps> = ({
  monsterId,
  competitionId,
  onCompetitionStart,
}) => {
  const [timer, setTimer] = useState(120);
  const [message, setMessage] = useState<string>("");
  const [stage, setStage] = useState<"waiting" | "starting">("waiting");

  // Countdown timer
  useEffect(() => {
    const interval = setInterval(() => {
      setTimer((t) => (t > 0 ? t - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // WebSocket connection
  useEffect(() => {
    const ws = new WebSocket(WS_ENDPOINT);
    ws.onopen = () => {
      ws.send(
        JSON.stringify({
          monsterId,
          competitionId,
        })
      );
    };
    ws.onmessage = (ev) => {
      try {
        const data = JSON.parse(ev.data);
        if (!data.type) return;
        const payload = data.payload || {};
        if (payload.text) {
          setMessage(payload.text);
        }
        if (payload.competitionsinstanceid) {
          const id = payload.competitionsinstanceid as number;
          setStage("starting");
          axios
            .post(START_ENDPOINT, { competitionsinstanceid: id })
            .then(() => {
              onCompetitionStart(id);
            })
            .catch((err) => console.error("Ошибка старта состязания", err));
        }
      } catch (e) {
        console.error("Ошибка обработки сообщения WebSocket", e);
      }
    };
    return () => {
      ws.close();
    };
  }, [monsterId, competitionId, onCompetitionStart]);

  const minutes = Math.floor(timer / 60)
    .toString()
    .padStart(2, "0");
  const seconds = (timer % 60).toString().padStart(2, "0");

  return (
    <div className="fixed inset-0 flex items-center justify-center z-[120] bg-black/60">
      <div className="bg-gradient-to-br from-purple-50 to-orange-50 p-[2px] rounded-2xl shadow-2xl w-full max-w-md">
        <div className="bg-white rounded-2xl p-6 text-center space-y-4">
          {stage === "waiting" ? (
            <>
              <h2 className="text-2xl font-bold text-purple-700">
                Ожидание соперников
              </h2>
              <img
                src={GIF_URL}
                alt="Ожидание"
                className="mx-auto rounded-lg shadow-md"
                width={480}
                height={270}
              />
              <div className="text-gray-700">
                Примерное время ожидания соперников
              </div>
              <div className="text-3xl font-mono font-semibold text-purple-700 tracking-widest">
                {minutes}:{seconds}
              </div>
              {message && (
                <div className="px-4 py-2 bg-purple-100 text-purple-800 rounded-lg shadow-inner">
                  {message}
                </div>
              )}
            </>
          ) : (
            <>
              <Spinner size="large" />
              <div className="text-lg font-medium text-purple-800">
                Соревнование почти началось
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default WaitingForOpponentsModal;

