import { ReactNode } from "react";

export function IconButton({
  icon,
  onClick,
  className,
  activated,
  title,
}: {
  icon: ReactNode;
  onClick: () => void;
  className?: string;
  activated: boolean;
  title?: string;
}) {
  return (
    <div
      className={`cursor-pointer rounded-sm p-2 hover:bg-gray ${className} ${activated ? "text-indigo-100 bg-indigo-500" : "text-zinc-400"}`}
      onClick={onClick}
      title={title}
    >
      {icon}
    </div>
  );
}
