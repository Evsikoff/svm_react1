import React, { useRef, useEffect } from "react";
import { AutoFitTextProps } from "../types";

// Автоматическое поджатие текста: сначала в одну строку,
// если дошли до минимума и всё равно не влезло — включаем переносы.
const AutoFitText: React.FC<AutoFitTextProps> = ({
  children,
  min = 10,
  max = 16,
  className,
}) => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Сброс стилей
    el.style.whiteSpace = "nowrap";
    el.style.overflow = "hidden";
    el.style.fontSize = `${max}px`;
    el.style.lineHeight = "1.1";
    el.style.display = "block";
    el.style.width = "100%";

    // Этап 1: ужимаем в одну строку
    let font = max;
    while (font > min && el.scrollWidth > el.clientWidth) {
      font -= 1;
      el.style.fontSize = `${font}px`;
    }

    // Этап 2: если достигли минимума и текст всё ещё шире контейнера,
    // включаем переносы строк с дефисами
    if (el.scrollWidth > el.clientWidth) {
      el.style.whiteSpace = "normal";
      (el.style as any).overflowWrap = "anywhere";
      (el.style as any).wordBreak = "break-word";
      (el.style as any).hyphens = "auto";
    }
  }, [children, min, max]);

  return (
    <div ref={ref} className={`w-full text-center ${className || ""}`}>
      {children}
    </div>
  );
};

export default AutoFitText;
