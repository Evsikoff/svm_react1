// src/components/CurrentCompetition.tsx
import React, { useState, useEffect } from "react";
import axios from "axios";
import VKDesktopFrame from "./VKDesktopFrame";

// Типы данных
interface PrizeItem {
  prizeitemid: number;
  prizeitemname: string;
  prizeitemimage: string;
  prizeitemdescr: string;
}

interface MonsterInStep {
  monsterid: number;
  xaxis: number;
  yaxis: number;
  scale: number;
  formulatext: string;
  points: number;
  winner: boolean;
}

interface CompetitionStep {
  sequence: number;
  name: string;
  description: string;
  image: string;
  monsters: MonsterInStep[];
}

interface ItemInfo {
  inventoryid: number;
  inventoryname: string;
  inventoryimage: string;
  inventorydescription: string;
  activity: string;
}

interface MonsterItem {
  monsteridforitem: number;
  items: ItemInfo[];
}

interface CharacteristicInfo {
  characteristicid: number;
  name: string;
  icon: string;
  value: number;
}

interface MonsterCharacteristics {
  monsteridforchar: number;
  monstername: string;
  monsterimage: string;
  characteristics: CharacteristicInfo[];
}

interface CompetitionData {
  text: string;
  competitionsinstance: {
    competitionsinstanceid: number;
    prizeitem: PrizeItem;
    competitionsinstancessteps: CompetitionStep[];
    monstercharacteristics: MonsterCharacteristics[];
    monsteritems: MonsterItem[];
    monsterswinners: { monsterwinnerid: number }[];
  };
}

interface Props {
  competitionsInstanceId: number;
  isVKDesktop?: boolean;
}

const CurrentCompetition: React.FC<Props> = ({
  competitionsInstanceId,
  isVKDesktop = false,
}) => {
  const [data, setData] = useState<CompetitionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [viewedSteps, setViewedSteps] = useState<Set<number>>(new Set([0]));
  const [showPrizeModal, setShowPrizeModal] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        const response = await axios.post<CompetitionData>(
          "https://functions.yandexcloud.net/d4euroa2kfgg47hna4f0",
          { competitionsinstanceid: competitionsInstanceId }
        );
        setData(response.data);
      } catch (err) {
        console.error("Ошибка загрузки данных состязания:", err);
        setError("Ошибка загрузки данных состязания");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [competitionsInstanceId]);

  const calculateScores = (): Record<number, number> => {
    if (!data) return {};

    const scores: Record<number, number> = {};
    const steps = data.competitionsinstance.competitionsinstancessteps;

    for (const step of steps) {
      if (viewedSteps.has(step.sequence - 1)) {
        for (const monster of step.monsters) {
          if (monster.winner) {
            scores[monster.monsterid] = (scores[monster.monsterid] || 0) + 1;
          }
        }
      }
    }

    return scores;
  };

  const handleNextStep = () => {
    if (!data) return;
    const nextIndex = currentStepIndex + 1;
    setCurrentStepIndex(nextIndex);
    setViewedSteps((prev) => new Set([...prev, nextIndex]));
  };

  const handleTabClick = (index: number) => {
    if (viewedSteps.has(index)) {
      setCurrentStepIndex(index);
    }
  };

  const handleClose = () => {
    window.location.reload();
  };

  if (loading) {
    const spinner = (
      <div className="flex items-center justify-center h-full py-20">
        <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );

    if (isVKDesktop) {
      return (
        <VKDesktopFrame title="Соревнование" accent="blue">
          {spinner}
        </VKDesktopFrame>
      );
    }

    return (
      <div className="flex items-center justify-center h-screen">
        <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !data) {
    const errorContent = (
      <div className="text-center space-y-4">
        <div className="text-red-500 text-xl">{error || "Ошибка загрузки"}</div>
        <button
          onClick={handleClose}
          className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600"
        >
          Вернуться в Арену
        </button>
      </div>
    );

    if (isVKDesktop) {
      return (
        <VKDesktopFrame title="Соревнование" accent="blue">
          {errorContent}
        </VKDesktopFrame>
      );
    }

    return <div className="p-8 text-center">{errorContent}</div>;
  }

  const steps = data.competitionsinstance.competitionsinstancessteps;
  const currentStep = steps[currentStepIndex];
  const scores = calculateScores();
  const isLastStep = currentStepIndex === steps.length - 1;
  const isDesktopView = isVKDesktop;

  const containerClass = isDesktopView ? "space-y-8" : "max-w-7xl mx-auto";
  const opponentsSectionClass = isDesktopView ? "mb-8" : "mb-6";
  const opponentsCardClass = isDesktopView
    ? "bg-white/95 rounded-3xl border-2 border-blue-200 shadow-xl p-6"
    : "bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl border-2 border-purple-200 shadow-lg p-4";
  const scoreboardCardClass = isDesktopView
    ? "bg-white/95 rounded-3xl border-2 border-emerald-200 shadow-xl p-6"
    : "bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl border-2 border-green-200 shadow-lg p-4";
  const stepsWrapperClass = isDesktopView
    ? "bg-white/95 rounded-3xl shadow-xl overflow-hidden border border-purple-200"
    : "bg-white rounded-2xl shadow-lg overflow-hidden";
  const tabsColumnClass = isDesktopView
    ? "w-24 bg-gradient-to-b from-slate-100 to-slate-200 border-r border-purple-100"
    : "w-20 bg-gray-100 border-r border-gray-200";
  const contentPaddingClass = isDesktopView ? "flex-1 p-8" : "flex-1 p-6";
  const actionButtonClass = isDesktopView
    ? "px-7 py-3 rounded-xl font-semibold shadow-lg transition-colors"
    : "px-6 py-3 rounded-lg font-semibold shadow-lg transition-colors";
  const prizeModalContainerClass = isDesktopView
    ? "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-6"
    : "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4";
  const prizeModalContentClass = isDesktopView
    ? "bg-white rounded-3xl shadow-2xl p-8 max-w-3xl w-full"
    : "bg-white rounded-2xl shadow-2xl p-6 max-w-2xl w-full";

  const renderContent = () => (
    <div className={containerClass}>
      <div className={opponentsSectionClass}>
        <div className={opponentsCardClass}>
          <div className="flex flex-wrap gap-4 justify-center">
            {data.competitionsinstance.monstercharacteristics.map((monster) => {
              const items = data.competitionsinstance.monsteritems.find(
                (mi) => mi.monsteridforitem === monster.monsteridforchar
              );

              return (
                <div
                  key={monster.monsteridforchar}
                  className={`relative bg-gradient-to-br from-violet-100 via-purple-50 to-pink-100 ${
                    isDesktopView
                      ? "rounded-3xl p-6 shadow-xl border-2 border-purple-200"
                      : "rounded-xl p-4 shadow-lg border-2 border-purple-200"
                  } hover:shadow-2xl transition-all duration-300 min-w-[280px] max-w-[360px] overflow-hidden`}
                >
                  <div className="absolute -top-10 -right-10 w-32 h-32 bg-gradient-to-br from-purple-300/20 to-pink-300/20 rounded-full blur-2xl" />

                  <h3 className="relative text-lg font-bold bg-gradient-to-r from-purple-700 to-pink-600 bg-clip-text text-transparent text-center mb-4">
                    {monster.monstername}
                  </h3>

                  <div className="relative flex justify-center mb-4">
                    <div className="grid grid-cols-3 gap-2">
                      {monster.characteristics.slice(0, 6).map((char) => (
                        <div
                          key={char.characteristicid}
                          className="flex flex-col items-center bg-white/70 backdrop-blur-sm rounded-lg px-3 py-2 border border-purple-200 hover:bg-white/90 transition-all duration-200 group"
                          title={char.name}
                        >
                          <img
                            src={char.icon}
                            alt={char.name}
                            className="w-6 h-6 mb-1 group-hover:scale-110 transition-transform"
                          />
                          <span className="text-sm font-bold text-purple-700">
                            {char.value}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {items && items.items.length > 0 && (
                    <div className="relative pt-3 border-t-2 border-purple-200/50">
                      <div className="flex flex-wrap gap-2 justify-center">
                        {items.items.map((item) => (
                          <div
                            key={item.inventoryid}
                            className={`relative group ${
                              item.activity === "false" ? "opacity-50" : ""
                            }`}
                            title={`${item.inventoryname}: ${item.inventorydescription}`}
                          >
                            <div className="bg-white/60 backdrop-blur-sm rounded-lg p-1.5 border border-purple-200 hover:bg-white/80 transition-all duration-200">
                              <img
                                src={item.inventoryimage}
                                alt={item.inventoryname}
                                className="w-8 h-8 object-contain group-hover:scale-110 transition-transform"
                              />
                            </div>
                            {item.activity === "true" && (
                              <div className="absolute -top-1 -right-1 w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className={isDesktopView ? "mb-8" : "mb-6"}>
        <div className={scoreboardCardClass}>
          <div className="flex justify-center gap-8">
            {data.competitionsinstance.monstercharacteristics.map((monster) => (
              <div
                key={monster.monsteridforchar}
                className={
                  isDesktopView
                    ? "bg-white rounded-2xl px-8 py-5 shadow-lg border-2 border-green-300"
                    : "bg-white rounded-xl px-8 py-4 shadow-md border-2 border-green-300"
                }
              >
                <div className="text-center">
                  <div className="text-sm text-gray-600 mb-1">
                    {monster.monstername}
                  </div>
                  <div className="text-4xl font-bold text-green-600">
                    {scores[monster.monsteridforchar] || 0}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className={stepsWrapperClass}>
        <div className="flex">
          <div className={tabsColumnClass}>
            {steps.map((step, index) => (
              <button
                key={step.sequence}
                className={`w-full px-3 py-4 text-sm font-medium transition-colors ${
                  currentStepIndex === index
                    ? "bg-purple-500 text-white"
                    : viewedSteps.has(index)
                    ? "bg-white text-gray-700 hover:bg-gray-50"
                    : "bg-gray-200 text-gray-400 cursor-not-allowed"
                }`}
                onClick={() => handleTabClick(index)}
                disabled={!viewedSteps.has(index)}
              >
                {step.sequence}
              </button>
            ))}
          </div>

          <div className={contentPaddingClass}>
            {currentStep && (
              <>
                <h3 className="text-2xl font-bold text-gray-800 mb-2">
                  {currentStep.name}
                </h3>
                <p className="text-gray-600 mb-4">{currentStep.description}</p>

                <div className="mb-6 flex justify-center">
                  <div className="relative max-w-2xl w-full">
                    <div
                      className="relative w-full rounded-lg shadow-md overflow-visible"
                      style={{ backgroundColor: "#f3f4f6" }}
                    >
                      <img
                        src={currentStep.image}
                        alt={currentStep.name}
                        className="w-full h-auto block"
                        style={{ maxWidth: "100%" }}
                      />

                      {currentStep.monsters.map((monster) => {
                        const monsterInfo =
                          data.competitionsinstance.monstercharacteristics.find(
                            (m) => m.monsteridforchar === monster.monsterid
                          );
                        if (!monsterInfo) return null;

                        const spriteSize = monster.scale;

                        return (
                          <img
                            key={monster.monsterid}
                            src={monsterInfo.monsterimage}
                            alt={monsterInfo?.monstername ?? ""}
                            className="absolute"
                            style={{
                              left: `${monster.xaxis}%`,
                              top: `${monster.yaxis}%`,
                              width: `${spriteSize}%`,
                              height: "auto",
                              transform: "translate(-50%, -50%)",
                              zIndex: 10,
                              maxWidth: "150px",
                            }}
                          />
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  {currentStep.monsters.map((monster) => {
                    const monsterInfo =
                      data.competitionsinstance.monstercharacteristics.find(
                        (m) => m.monsteridforchar === monster.monsterid
                      );

                    return (
                      <div
                        key={monster.monsterid}
                        className={`p-4 rounded-lg border-2 transition-all duration-300 ${
                          monster.winner
                            ? "border-green-400 bg-gradient-to-r from-green-50 to-emerald-50 shadow-md"
                            : "border-gray-300 bg-gradient-to-r from-gray-50 to-slate-50"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div
                              className={`font-bold text-lg ${
                                monster.winner ? "text-green-800" : "text-gray-800"
                              }`}
                            >
                              {monsterInfo?.monstername}
                            </div>
                            <div
                              className={`text-sm mt-1 ${
                                monster.winner ? "text-green-700" : "text-gray-600"
                              }`}
                            >
                              {monster.formulatext}
                            </div>
                          </div>
                          <div className="text-right ml-4">
                            <div
                              className={`text-3xl font-bold ${
                                monster.winner
                                  ? "text-transparent bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text"
                                  : "text-gray-600"
                              }`}
                            >
                              {monster.points}
                            </div>
                            {monster.winner && (
                              <div className="flex items-center justify-end gap-1 mt-1">
                                <span className="text-green-600 text-sm font-medium">Победа</span>
                                <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                                  <path
                                    fillRule="evenodd"
                                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                    clipRule="evenodd"
                                  />
                                </svg>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-6 flex justify-center">
                  {isLastStep ? (
                    <button
                      onClick={() => setShowPrizeModal(true)}
                      className={`${actionButtonClass} bg-gradient-to-r from-yellow-400 to-yellow-600 text-white`}
                    >
                      Награждение победителей
                    </button>
                  ) : (
                    <button
                      onClick={handleNextStep}
                      className={`${actionButtonClass} bg-purple-500 text-white hover:bg-purple-600`}
                    >
                      Продолжить
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {showPrizeModal && (
        <div className={prizeModalContainerClass}>
          <div className={prizeModalContentClass}>
            <h2 className="text-2xl font-bold text-center mb-6 text-purple-800">
              Награждение победителей
            </h2>

            <div className="flex flex-col items-center">
              <div className="mb-6">
                <div className="bg-gradient-to-br from-yellow-50 to-amber-50 rounded-xl p-6 border-2 border-yellow-300 shadow-lg">
                  <img
                    src={data.competitionsinstance.prizeitem.prizeitemimage}
                    alt={data.competitionsinstance.prizeitem.prizeitemname}
                    className="w-24 h-24 mx-auto mb-4 object-contain"
                  />
                  <h3 className="text-xl font-bold text-amber-800 text-center mb-2">
                    {data.competitionsinstance.prizeitem.prizeitemname}
                  </h3>
                  <p className="text-amber-700 text-center">
                    {data.competitionsinstance.prizeitem.prizeitemdescr}
                  </p>
                </div>
              </div>

              <div className="text-4xl text-purple-500 mb-4">↓</div>

              <div className="flex flex-wrap gap-4 justify-center">
                {data.competitionsinstance.monsterswinners.map((winner) => {
                  const monsterInfo =
                    data.competitionsinstance.monstercharacteristics.find(
                      (m) => m.monsteridforchar === winner.monsterwinnerid
                    );

                  return (
                    <div
                      key={winner.monsterwinnerid}
                      className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-4 border-2 border-purple-300 shadow-md"
                    >
                      <img
                        src={monsterInfo?.monsterimage}
                        alt={monsterInfo?.monstername}
                        className="w-20 h-20 mx-auto mb-2 object-contain"
                      />
                      <div className="text-center font-semibold text-purple-800">
                        {monsterInfo?.monstername}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="mt-6 flex justify-center">
              <button
                onClick={handleClose}
                className={`${actionButtonClass} bg-purple-500 text-white hover:bg-purple-600`}
              >
                Закрыть
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  if (isDesktopView) {
    return (
      <VKDesktopFrame title="Соревнование" accent="blue">
        {renderContent()}
      </VKDesktopFrame>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-200 to-orange-200 p-4">
      {renderContent()}
    </div>
  );
};

export default CurrentCompetition;
