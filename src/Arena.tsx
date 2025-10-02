// src/Arena.tsx - обновленный компонент "Арена" с состязаниями
import React, { useState, useEffect } from "react";
import CompetitionEnergy from "./components/CompetitionEnergy";
import ArenaMonsterSwitcher from "./components/ArenaMonsterSwitcher";
import Competitions from "./components/Competitions";
import CurrentCompetition from "./components/CurrentCompetition";
import CompetitionHistory from "./components/CompetitionHistory";
import VKDesktopFrame from "./components/VKDesktopFrame";

interface ArenaProps {
  userId: number | null;
  isVK?: boolean;
  isVKDesktop?: boolean;
}

const Arena: React.FC<ArenaProps> = ({
  userId,
  isVK = false,
  isVKDesktop = false,
}) => {
  const [selectedMonsterId, setSelectedMonsterId] = useState<number | null>(
    null
  );
  const [currentCompetitionId, setCurrentCompetitionId] =
    useState<number | null>(null);
  const [historyEnabled, setHistoryEnabled] = useState(false);

  // Обработчик смены монстра из ArenaMonsterSwitcher
  const handleMonsterChange = (monsterId: number) => {
    setSelectedMonsterId(monsterId);
  };

  const handleCompetitionStart = (id: number) => {
    setCurrentCompetitionId(id);
  };

  useEffect(() => {
    if (!userId) return;

    const controller = new AbortController();
    fetch(
      `https://competitionhistoryenable.onrender.com/check?userId=${userId}`,
      { signal: controller.signal }
    )
      .then((res) => res.json())
      .then((data) => setHistoryEnabled(Boolean(data.competitionhistoryenable)))
      .catch((err) => {
        console.error("Ошибка загрузки истории состязаний:", err);
      });

    return () => controller.abort();
  }, [userId]);

  if (!userId) return null;

  if (currentCompetitionId) {
    return (
      <CurrentCompetition
        competitionsInstanceId={currentCompetitionId}
        isVKDesktop={isVKDesktop}
      />
    );
  }

  if (isVKDesktop) {
    return (
      <VKDesktopFrame
        contentClassName="flex flex-col space-y-8"
        accent="purple"
      >
        <div className="space-y-6">
          <div className="rounded-3xl border border-blue-200 bg-white/90 p-6 shadow-inner">
            <CompetitionEnergy
              userId={userId}
              isVK={isVK}
              isVKDesktop={isVKDesktop}
            />
          </div>
          <div className="rounded-3xl border border-emerald-200 bg-white/90 p-6 shadow-inner">
            <ArenaMonsterSwitcher
              userId={userId}
              selectedMonsterId={selectedMonsterId}
              onMonsterChange={handleMonsterChange}
            />
          </div>
          {historyEnabled && (
            <div className="rounded-3xl border border-orange-200 bg-white/90 p-6 shadow-inner">
              <CompetitionHistory />
            </div>
          )}
        </div>

        <div className="rounded-3xl border-2 border-orange-200 bg-white/95 p-6 shadow-xl">
          <h2 className="text-3xl font-bold text-orange-700 text-center mb-6">
            Состязания
          </h2>
          <Competitions
            selectedMonsterId={selectedMonsterId}
            userId={userId}
            onCompetitionStart={handleCompetitionStart}
          />
        </div>
      </VKDesktopFrame>
    );
  }

  return (
    <div className="p-4 md:p-8 space-y-6">
      {/* Блок с энергией и переключателем монстров */}
      <div className="flex flex-col gap-4">
        {/* На широких экранах: энергия и переключатель в одной строке */}
        <div className="hidden md:flex md:items-start md:justify-between md:gap-6">
          <div className="flex-shrink-0">
            <CompetitionEnergy userId={userId} isVK={isVK} />
          </div>
          <div className="flex-1 min-w-0">
            <ArenaMonsterSwitcher
              userId={userId}
              selectedMonsterId={selectedMonsterId}
              onMonsterChange={handleMonsterChange}
            />
          </div>
        </div>

        {/* На узких экранах: энергия сверху, переключатель снизу */}
        <div className="md:hidden space-y-4">
          <CompetitionEnergy userId={userId} isVK={isVK} />
          <ArenaMonsterSwitcher
            userId={userId}
            selectedMonsterId={selectedMonsterId}
            onMonsterChange={handleMonsterChange}
          />
        </div>
      </div>

      {historyEnabled && (
        <div className="mt-6">
          <CompetitionHistory />
        </div>
      )}

      {/* Компонент "Состязания" */}
      <div className="mt-6">
        <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-2xl border-2 border-orange-200 shadow-lg p-6">
          <h2 className="text-2xl md:text-3xl font-bold text-orange-800 mb-6 text-center">
            Состязания
          </h2>
          <Competitions
            selectedMonsterId={selectedMonsterId}
            userId={userId}
            onCompetitionStart={handleCompetitionStart}
          />
        </div>
      </div>
    </div>
  );
};

export default Arena;
