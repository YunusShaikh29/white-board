interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  theme: "rgb(24,24,27)" | "rgb(255,255,255)";
}

export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  theme,
}: ConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className={`fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md p-6 rounded-lg shadow-lg z-50 ${
        theme === "rgb(24,24,27)" ? "bg-zinc-900" : "bg-white"
      }`}>
        <h2 className={`text-xl font-semibold mb-4 ${
          theme === "rgb(24,24,27)" ? "text-white" : "text-gray-900"
        }`}>
          {title}
        </h2>
        <p className={`mb-6 ${
          theme === "rgb(24,24,27)" ? "text-gray-300" : "text-gray-600"
        }`}>
          {message}
        </p>
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              theme === "rgb(24,24,27)"
                ? "bg-zinc-800 text-gray-300 hover:bg-zinc-700"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            Cancel
          </button>
          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className="px-4 py-2 rounded-lg font-medium bg-red-500 text-white hover:bg-red-600 transition-colors"
          >
            Delete
          </button>
        </div>
      </div>
    </>
  );
}
