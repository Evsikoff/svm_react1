import React from "react";
import { MenuItem } from "../types";
import { IMAGES } from "../constants";

interface DesktopMenuProps {
  menuItems: MenuItem[];
  selectedMenuItem: string | null;
  notificationCount: number;
  onMenuClick: (item: MenuItem) => void;
  onToggleNotifications: () => void;
}

const DesktopMenu: React.FC<DesktopMenuProps> = ({
  menuItems,
  selectedMenuItem,
  notificationCount,
  onMenuClick,
  onToggleNotifications,
}) => {
  return (
    <div className="hidden md:flex items-center bg-purple-600 text-white p-4">
      <div className="flex space-x-4">
        {menuItems.map((item) => (
          <div
            key={item.name}
            className={`flex items-center space-x-2 p-2 cursor-pointer ${
              selectedMenuItem === item.name ? "bg-purple-800" : ""
            }`}
            onClick={() => onMenuClick(item)}
          >
            <img src={item.iconURL} alt={item.name} className="w-8 h-8" />
            <span>{item.name}</span>
          </div>
        ))}
      </div>
      <div className="ml-auto relative">
        <img
          src={IMAGES.bell}
          alt="Notifications"
          className="w-8 h-8 cursor-pointer"
          onClick={onToggleNotifications}
        />
        {notificationCount > 0 && (
          <span className="absolute top-0 right-0 bg-red-500 text-white rounded-full px-2">
            {notificationCount}
          </span>
        )}
      </div>
    </div>
  );
};

export default DesktopMenu;
