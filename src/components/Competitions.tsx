// src/components/Competitions.tsx - компонент "Состязания"
import React, { useState, useEffect } from "react";
import axios from "axios";
import WaitingForOpponentsModal from "./WaitingForOpponentsModal";

interface MonsterCompetitionCharacteristic {
  monstercompetitioncharacteristicid: string;
  monstercompetitioncharacteristicimage: string;
  monstercompetitioncharacteristicname: string;
  monstercompetitioncharacteristicamount: number;
}

interface MonsterCompetition {
  monstercompetitionid: string;
  monstercompetitionname: string;
  monstercompetitionimage: string;
  monstercompetitionenergyprice: number;
  monstercompetitionparticipantsnumber: number;
  activity: boolean;
  monstercompetitioncharacteristics: MonsterCompetitionCharacteristic[];
  inactivity?: string;
}

interface CompetitionsResponse {
  monstercompetitions: MonsterCompetition[];
}

interface CompetitionsProps {
  selectedMonsterId: number | null;
  userId: number | null;
  onCompetitionStart?: (id: number) => void;
}

const Competitions: React.FC<CompetitionsProps> = ({
  selectedMonsterId,
  userId,
  onCompetitionStart,
}) => {
  const [competitions, setCompetitions] = useState<MonsterCompetition[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [selectedCompetitionId, setSelectedCompetitionId] = useState<string | null>(
    null
  );

  // Функция загрузки состязаний
  const loadCompetitions = async (monsterId: number) => {
    setLoading(true);
    setError("");

    try {
      const response = await axios.post<CompetitionsResponse>(
        "https://functions.yandexcloud.net/d4eal266kagbsgd7r853",
        { monsterId }
      );

      setCompetitions(response.data.monstercompetitions || []);
    } catch (err) {
      console.error("Ошибка при загрузке состязаний:", err);
      setError("Ошибка при загрузке состязаний");
    } finally {
      setLoading(false);
    }
  };

  // Загрузка при изменении выбранного монстра
  useEffect(() => {
    if (selectedMonsterId) {
      loadCompetitions(selectedMonsterId);
    }
  }, [selectedMonsterId]);

  // Обработчик клика по активному состязанию
  const handleCompetitionClick = (competition: MonsterCompetition) => {
    if (competition.activity) {
      setSelectedCompetitionId(competition.monstercompetitionid);
    }
  };

  if (loading) {
    return (
      <div className="w-full flex items-center justify-center py-16">
        <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 text-red-700 p-4 rounded-lg border border-red-300 mb-4">
        {error}
      </div>
    );
  }

  if (competitions.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-orange-400 text-4xl mb-4">🏆</div>
        <div className="text-orange-700 text-lg font-medium mb-2">
          Нет доступных состязаний
        </div>
        <div className="text-orange-600 text-sm">
          Состязания станут доступны когда ваш монстр достигнет нужных
          характеристик
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {competitions.map((competition) => (
        <div
          key={competition.monstercompetitionid}
          className={`
            relative rounded-2xl border-2 shadow-lg overflow-hidden transition-all duration-300
            ${
              competition.activity
                ? "cursor-pointer hover:shadow-xl hover:scale-[1.02] border-orange-300 bg-gradient-to-br from-orange-50 to-amber-50"
                : "opacity-60 border-gray-300 bg-gradient-to-br from-gray-50 to-gray-100 cursor-help"
            }
          `}
          onClick={() => handleCompetitionClick(competition)}
          title={!competition.activity ? competition.inactivity : undefined}
        >
          {/* Изображение состязания */}
          <div className="relative h-48 md:h-64 overflow-hidden">
            <img
              src={competition.monstercompetitionimage}
              alt={competition.monstercompetitionname}
              className="w-full h-full object-cover"
              onError={(e) => {
                console.error(
                  `Ошибка загрузки изображения: ${competition.monstercompetitionimage}`
                );
                e.currentTarget.src =
                  "https://storage.yandexcloud.net/svm/img/placeholder-competition.png";
              }}
            />

            {/* Наименование состязания поверх изображения */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
              <h3 className="text-white text-2xl md:text-3xl font-bold text-center drop-shadow-lg">
                {competition.monstercompetitionname}
              </h3>
            </div>
          </div>

          {/* Информационная панель */}
          <div className="p-4 space-y-4">
            {/* Стоимость энергии и количество участников */}
            <div className="flex justify-center items-center gap-6">
              {/* Стоимость энергии */}
              <div className="flex items-center gap-2 bg-blue-100 rounded-lg px-3 py-2">
                <img
                  src="https://storage.yandexcloud.net/svm/img/usercompetitionenergy.png"
                  alt="Энергия"
                  className="w-6 h-7"
                  style={{ aspectRatio: "9/10" }}
                />
                <span className="font-semibold text-blue-800">
                  {competition.monstercompetitionenergyprice}
                </span>
              </div>

              {/* Количество участников */}
              <div className="flex items-center gap-2 bg-purple-100 rounded-lg px-3 py-2">
                <img
                  src="https://storage.yandexcloud.net/svm/img/participants.png"
                  alt="Участники"
                  className="w-8 h-5"
                  style={{ aspectRatio: "50/31" }}
                />
                <span className="font-semibold text-purple-800">
                  {competition.monstercompetitionparticipantsnumber}
                </span>
              </div>
            </div>

            {/* Требования к характеристикам */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-gray-700 text-center">
                Требования к характеристикам:
              </h4>
              <div className="flex flex-wrap justify-center gap-2">
                {competition.monstercompetitioncharacteristics.map((char) => (
                  <div
                    key={char.monstercompetitioncharacteristicid}
                    className="flex items-center gap-1 bg-white rounded-lg px-2 py-1 border border-gray-200 shadow-sm"
                    title={
                      competition.activity
                        ? char.monstercompetitioncharacteristicname
                        : undefined
                    }
                  >
                    <img
                      src={char.monstercompetitioncharacteristicimage}
                      alt={char.monstercompetitioncharacteristicname}
                      className="w-5 h-5"
                    />
                    <span className="text-sm font-medium text-gray-800">
                      {char.monstercompetitioncharacteristicamount}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Индикатор активности */}
            {competition.activity ? (
              <div className="flex justify-center">
                <div className="bg-green-100 text-green-800 px-4 py-2 rounded-full text-sm font-medium">
                  ✓ Доступно
                </div>
              </div>
            ) : (
              <div className="flex justify-center">
                <div className="bg-gray-100 text-gray-600 px-4 py-2 rounded-full text-sm font-medium">
                  Требования не выполнены
                </div>
              </div>
            )}
          </div>
        </div>
      ))}
      {selectedCompetitionId && selectedMonsterId && (
        <WaitingForOpponentsModal
          monsterId={selectedMonsterId}
          competitionId={selectedCompetitionId}
          onCompetitionStart={(id) => {
            setSelectedCompetitionId(null);
            if (onCompetitionStart) {
              onCompetitionStart(id);
            }
          }}
        />
      )}
    </div>
  );
};

export default Competitions;
