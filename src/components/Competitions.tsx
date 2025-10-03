// src/components/Competitions.tsx
import React, { useState, useEffect, useCallback } from "react";
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
  isVKDesktop?: boolean;
}

const Competitions: React.FC<CompetitionsProps> = ({
  selectedMonsterId,
  userId,
  onCompetitionStart,
  isVKDesktop = false,
}) => {
  // Размеры для VKDesktop режима (уменьшены еще больше)
  const largeBadgePaddingY = isVKDesktop ? "0.25rem" : undefined;
  const smallBadgePaddingY = isVKDesktop ? "0.125rem" : undefined;
  const largeBadgePaddingX = isVKDesktop ? "0.5rem" : undefined;
  const smallBadgePaddingX = isVKDesktop ? "0.375rem" : undefined;

  const energyIconSize = isVKDesktop
    ? { width: "0.875rem", height: "1rem" }
    : undefined;
  const participantsIconSize = isVKDesktop
    ? { width: "1.125rem", height: "0.7rem" }
    : undefined;
  const characteristicIconSize = isVKDesktop
    ? { width: "0.75rem", height: "0.75rem" }
    : undefined;

  // Размеры текста для VKDesktop
  const largeBadgeTextSize = isVKDesktop ? "text-xs" : "text-base";
  const smallBadgeTextSize = isVKDesktop ? "text-[10px]" : "text-sm";
  const titleTextSize = isVKDesktop
    ? "text-xl md:text-2xl"
    : "text-2xl md:text-3xl";
  const gapSize = isVKDesktop ? "gap-3" : "gap-6";
  const smallGapSize = isVKDesktop ? "gap-1" : "gap-2";

  const [competitions, setCompetitions] = useState<MonsterCompetition[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [selectedCompetitionId, setSelectedCompetitionId] = useState<
    string | null
  >(null);

  const loadCompetitions = async (monsterId: number) => {
    setLoading(true);
    setError("");

    const MAX_RETRIES = 2;

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        const response = await axios.post<CompetitionsResponse>(
          "https://functions.yandexcloud.net/d4eal266kagbsgd7r853",
          { monsterId },
          { timeout: 5000 }
        );

        setCompetitions(response.data.monstercompetitions || []);
        setLoading(false);
        return;
      } catch (err) {
        const isTimeout =
          axios.isAxiosError(err) && err.code === "ECONNABORTED";

        if (isTimeout && attempt < MAX_RETRIES) {
          continue;
        }

        console.error("Ошибка при загрузке состязаний:", err);
        setError("Ошибка при загрузке состязаний");
        setLoading(false);
        return;
      }
    }
  };

  useEffect(() => {
    if (selectedMonsterId) {
      loadCompetitions(selectedMonsterId);
    }
  }, [selectedMonsterId]);

  const handleCompetitionClick = (competition: MonsterCompetition) => {
    if (competition.activity) {
      setSelectedCompetitionId(competition.monstercompetitionid);
    }
  };

  const handleCompetitionStart = useCallback(
    (id: number) => {
      setSelectedCompetitionId(null);
      if (onCompetitionStart) {
        onCompetitionStart(id);
      }
    },
    [onCompetitionStart]
  );

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
          <div
            className={`relative ${
              isVKDesktop ? "h-40 md:h-48" : "h-48 md:h-64"
            } overflow-hidden`}
          >
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
              <h3
                className={`text-white ${titleTextSize} font-bold text-center drop-shadow-lg`}
              >
                {competition.monstercompetitionname}
              </h3>
            </div>
          </div>

          {/* Информационная панель */}
          <div className={`p-4 space-y-${isVKDesktop ? "3" : "4"}`}>
            {/* Стоимость энергии и количество участников */}
            <div className={`flex justify-center items-center ${gapSize}`}>
              {/* Стоимость энергии */}
              <div
                className={`flex items-center ${smallGapSize} bg-blue-100 rounded-lg`}
                style={{
                  paddingTop: largeBadgePaddingY,
                  paddingBottom: largeBadgePaddingY,
                  paddingLeft: largeBadgePaddingX,
                  paddingRight: largeBadgePaddingX,
                }}
              >
                <img
                  src="https://storage.yandexcloud.net/svm/img/usercompetitionenergy.png"
                  alt="Энергия"
                  className={isVKDesktop ? "w-4 h-[18px]" : "w-6 h-7"}
                  style={{
                    aspectRatio: "9/10",
                    ...energyIconSize,
                  }}
                />
                <span
                  className={`font-semibold text-blue-800 ${largeBadgeTextSize}`}
                >
                  {competition.monstercompetitionenergyprice}
                </span>
              </div>

              {/* Количество участников */}
              <div
                className={`flex items-center ${smallGapSize} bg-purple-100 rounded-lg`}
                style={{
                  paddingTop: largeBadgePaddingY,
                  paddingBottom: largeBadgePaddingY,
                  paddingLeft: largeBadgePaddingX,
                  paddingRight: largeBadgePaddingX,
                }}
              >
                <img
                  src="https://storage.yandexcloud.net/svm/img/participants.png"
                  alt="Участники"
                  className={isVKDesktop ? "w-[18px] h-[11px]" : "w-8 h-5"}
                  style={{
                    aspectRatio: "50/31",
                    ...participantsIconSize,
                  }}
                />
                <span
                  className={`font-semibold text-purple-800 ${largeBadgeTextSize}`}
                >
                  {competition.monstercompetitionparticipantsnumber}
                </span>
              </div>
            </div>

            {/* Требования к характеристикам */}
            <div className={`space-y-${isVKDesktop ? "1.5" : "2"}`}>
              <h4
                className={`${smallBadgeTextSize} font-medium text-gray-700 text-center`}
              >
                Требования к характеристикам:
              </h4>
              <div className={`flex flex-wrap justify-center ${smallGapSize}`}>
                {competition.monstercompetitioncharacteristics.map((char) => (
                  <div
                    key={char.monstercompetitioncharacteristicid}
                    className={`flex items-center gap-1 bg-white rounded-lg border border-gray-200 shadow-sm`}
                    title={
                      competition.activity
                        ? char.monstercompetitioncharacteristicname
                        : undefined
                    }
                    style={{
                      paddingTop: smallBadgePaddingY,
                      paddingBottom: smallBadgePaddingY,
                      paddingLeft: smallBadgePaddingX,
                      paddingRight: smallBadgePaddingX,
                    }}
                  >
                    <img
                      src={char.monstercompetitioncharacteristicimage}
                      alt={char.monstercompetitioncharacteristicname}
                      className={isVKDesktop ? "w-3 h-3" : "w-5 h-5"}
                      style={characteristicIconSize}
                    />
                    <span
                      className={`${smallBadgeTextSize} font-medium text-gray-800`}
                    >
                      {char.monstercompetitioncharacteristicamount}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Индикатор активности */}
            {competition.activity ? (
              <div className="flex justify-center">
                <div
                  className={`bg-green-100 text-green-800 rounded-full ${smallBadgeTextSize} font-medium`}
                  style={{
                    paddingTop: smallBadgePaddingY,
                    paddingBottom: smallBadgePaddingY,
                    paddingLeft: largeBadgePaddingX,
                    paddingRight: largeBadgePaddingX,
                  }}
                >
                  ✓ Доступно
                </div>
              </div>
            ) : (
              <div className="flex justify-center">
                <div
                  className={`bg-gray-100 text-gray-600 rounded-full ${smallBadgeTextSize} font-medium`}
                  style={{
                    paddingTop: smallBadgePaddingY,
                    paddingBottom: smallBadgePaddingY,
                    paddingLeft: largeBadgePaddingX,
                    paddingRight: largeBadgePaddingX,
                  }}
                >
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
          onCompetitionStart={handleCompetitionStart}
        />
      )}
    </div>
  );
};

export default Competitions;
