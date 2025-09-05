import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import { API_URLS } from "../constants";
import {
  CompetitionInstance,
  CompetitionInstanceApiResponse,
  CompetitionStep,
  CompetitionMonsterCharacteristics,
  CompetitionMonsterItems,
} from "../types";

interface Props {
  competitionsInstanceId: number;
}

// Вспомогательный компонент для отрисовки шага соревнования с наложением спрайтов
const StepImage: React.FC<{
  step: CompetitionStep;
  monsters: CompetitionMonsterCharacteristics[];
}> = ({ step, monsters }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const loadImage = (src: string): Promise<HTMLImageElement> => {
      return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error("Не удалось загрузить изображение"));
        img.src = src;
      });
    };

    const draw = async () => {
      try {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const bg = await loadImage(step.image);
        canvas.width = bg.naturalWidth;
        canvas.height = bg.naturalHeight;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(bg, 0, 0);

        for (const m of step.monsters) {
          const info = monsters.find(
            (mm) => mm.monsteridforchar === m.monsterid
          );
          if (!info) continue;
          try {
            const sprite = await loadImage(info.monsterimage);
            const scale = m.scale / 100;
            const w = sprite.naturalWidth * scale;
            const h = sprite.naturalHeight * scale;
            const x = (m.xaxis / 100) * canvas.width - w / 2;
            const y = (m.yaxis / 100) * canvas.height - h / 2;
            ctx.drawImage(sprite, x, y, w, h);
          } catch (e) {
            console.warn("Ошибка загрузки спрайта монстра", e);
          }
        }
      } catch (e) {
        console.warn("Ошибка генерации изображения шага", e);
      }
    };

    draw();
  }, [step, monsters]);

  return <canvas ref={canvasRef} className="w-full h-auto" />;
};

// Бейдж противников с характеристиками и предметами
const Opponents: React.FC<{
  monsters: CompetitionMonsterCharacteristics[];
  items: CompetitionMonsterItems[];
}> = ({ monsters, items }) => {
  return (
    <div className="flex flex-wrap justify-center gap-6 mb-6">
      {monsters.map((m) => {
        const its = items.find((i) => i.monsteridforitem === m.monsteridforchar);
        return (
          <div
            key={m.monsteridforchar}
            className="bg-white rounded-xl shadow p-4 w-64 flex flex-col items-center"
          >
            <img
              src={m.monsterimage}
              alt={m.monstername}
              className="w-24 h-24 object-contain mb-2"
            />
            <div className="font-bold mb-2 text-center">{m.monstername}</div>
            <div className="flex flex-wrap justify-center gap-2 mb-2">
              {m.characteristics.map((c) => (
                <div
                  key={c.characteristicid}
                  className="flex items-center gap-1"
                  title={c.name}
                >
                  <img src={c.icon} alt={c.name} className="w-4 h-4" />
                  <span className="text-sm">{c.value}</span>
                </div>
              ))}
            </div>
            {its && (
              <div className="flex flex-wrap justify-center gap-1">
                {its.items.map((it) => (
                  <img
                    key={it.inventoryid}
                    src={it.inventoryimage}
                    alt={it.inventoryname}
                    title={`${it.inventoryname}: ${it.inventorydescription}`}
                    className={`w-6 h-6 ${
                      it.activity === true || it.activity === "true"
                        ? ""
                        : "opacity-40"
                    }`}
                  />
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

// Табло общих результатов
const Scoreboard: React.FC<{
  monsters: CompetitionMonsterCharacteristics[];
  steps: CompetitionStep[];
  opened: Set<number>;
}> = ({ monsters, steps, opened }) => {
  return (
    <div className="flex flex-wrap justify-center gap-4 mb-6">
      {monsters.map((m) => {
        let score = 0;
        steps.forEach((s, idx) => {
          if (!opened.has(idx)) return;
          const sm = s.monsters.find((mon) => mon.monsterid === m.monsteridforchar);
          if (sm && sm.winner) score++;
        });
        return (
          <div
            key={m.monsteridforchar}
            className="bg-black text-white rounded-lg px-4 py-2 flex items-center gap-2"
          >
            <span className="font-semibold">{m.monstername}</span>
            <span className="text-yellow-400 text-xl font-bold">{score}</span>
          </div>
        );
      })}
    </div>
  );
};

const CurrentCompetition: React.FC<Props> = ({ competitionsInstanceId }) => {
  const [data, setData] = useState<CompetitionInstance | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [currentStep, setCurrentStep] = useState(0);
  const [openedSteps, setOpenedSteps] = useState<Set<number>>(new Set([0]));
  const [showAward, setShowAward] = useState(false);

  useEffect(() => {
    axios
      .post<CompetitionInstanceApiResponse>(API_URLS.competitioninstance, {
        competitionsinstanceid: competitionsInstanceId,
      })
      .then((res) => {
        setData(res.data.competitionsinstance);
      })
      .catch(() => setError("Ошибка загрузки состязания"))
      .finally(() => setLoading(false));
  }, [competitionsInstanceId]);

  if (loading) {
    return (
      <div className="p-8 text-center">
        <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        Загрузка состязания...
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-8 text-center text-red-600">{error || "Нет данных"}</div>
    );
  }

  const steps = [...data.competitionsinstancessteps].sort(
    (a, b) => a.sequence - b.sequence
  );

  const step = steps[currentStep];

  const handleTabClick = (idx: number) => {
    if (openedSteps.has(idx)) {
      setCurrentStep(idx);
    }
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      const next = currentStep + 1;
      setCurrentStep(next);
      setOpenedSteps(new Set([...Array.from(openedSteps), next]));
    } else {
      setShowAward(true);
    }
  };

  return (
    <div className="p-4 space-y-6">
      <h2 className="text-2xl font-bold text-center">Текущее состязание</h2>

      {/* Соперники */}
      <Opponents monsters={data.monstercharacteristics} items={data.monsteritems} />

      {/* Общий счет */}
      <Scoreboard
        monsters={data.monstercharacteristics}
        steps={steps}
        opened={openedSteps}
      />

      {/* Шаги состязания */}
      <div className="flex gap-4">
        {/* Tabs */}
        <div className="flex flex-col gap-2">
          {steps.map((s, idx) => (
            <button
              key={s.sequence}
              onClick={() => handleTabClick(idx)}
              disabled={!openedSteps.has(idx)}
              className={`px-3 py-2 rounded-lg border text-sm font-medium ${
                currentStep === idx
                  ? "bg-orange-500 text-white"
                  : "bg-gray-200 text-gray-700"
              } ${openedSteps.has(idx) ? "" : "opacity-50 cursor-not-allowed"}`}
            >
              {s.sequence}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 space-y-4">
          <h3 className="text-xl font-semibold">{step.name}</h3>
          <StepImage step={step} monsters={data.monstercharacteristics} />
          <p className="text-gray-700">{step.description}</p>

          <div className="space-y-2">
            {step.monsters.map((m) => {
              const isWinner = m.winner;
              return (
                <div
                  key={m.monsterid}
                  className={`flex items-center justify-between p-2 rounded-lg border ${
                    isWinner ? "bg-green-100 text-green-800" : "bg-white"
                  }`}
                >
                  <div className="text-sm">{m.formulatext}</div>
                  <div className="font-bold">{m.points}</div>
                </div>
              );
            })}
          </div>

          <div className="pt-2 text-center">
            <button
              onClick={handleNext}
              className="px-4 py-2 bg-orange-500 text-white rounded-lg"
            >
              {currentStep < steps.length - 1
                ? "Продолжить"
                : "Награждение победителей"}
            </button>
          </div>
        </div>
      </div>

      {/* Награждение победителей */}
      {showAward && (
        <div className="mt-6 bg-yellow-50 rounded-xl p-4 border border-yellow-200">
          <h3 className="text-xl font-bold mb-4 text-center">
            Награждение победителей
          </h3>
          <div className="flex flex-col md:flex-row items-center justify-center gap-4">
            <div className="text-center">
              <img
                src={data.prizeitem.prizeitemimage}
                alt={data.prizeitem.prizeitemname}
                className="w-24 h-24 object-contain mx-auto mb-2"
              />
              <div className="font-semibold">{data.prizeitem.prizeitemname}</div>
              <div className="text-sm text-gray-700">
                {data.prizeitem.prizeitemdescr}
              </div>
            </div>
            <div className="text-3xl">→</div>
            <div className="flex gap-4">
              {data.monsterswinners.map((w) => {
                const info = data.monstercharacteristics.find(
                  (m) => m.monsteridforchar === w.monsterwinnerid
                );
                if (!info) return null;
                return (
                  <div
                    key={w.monsterwinnerid}
                    className="text-center"
                  >
                    <img
                      src={info.monsterimage}
                      alt={info.monstername}
                      className="w-24 h-24 object-contain mx-auto mb-2"
                    />
                    <div className="font-medium">{info.monstername}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CurrentCompetition;

