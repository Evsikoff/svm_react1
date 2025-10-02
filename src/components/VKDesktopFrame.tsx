import React from "react";

type Accent = "purple" | "amber" | "emerald" | "blue";

const ACCENT_CLASS_MAP: Record<Accent, string> = {
  purple: "from-purple-500 to-orange-500",
  amber: "from-amber-500 to-orange-400",
  emerald: "from-emerald-500 to-teal-500",
  blue: "from-sky-500 to-blue-600",
};

interface Props {
  title: string;
  accent?: Accent;
  children: React.ReactNode;
  contentClassName?: string;
}

const VKDesktopFrame: React.FC<Props> = ({
  title,
  accent = "purple",
  children,
  contentClassName = "",
}) => {
  const accentGradient = ACCENT_CLASS_MAP[accent];

  return (
    <div className="vk-desktop-screen">
      <div className="vk-desktop-screen__frame">
        <div
          className={`vk-desktop-screen__header bg-gradient-to-r ${accentGradient}`}
        >
          {title}
        </div>
        <div className={`vk-desktop-screen__content ${contentClassName}`}>
          {children}
        </div>
      </div>
    </div>
  );
};

export default VKDesktopFrame;
