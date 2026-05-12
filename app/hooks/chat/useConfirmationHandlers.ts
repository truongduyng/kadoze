import { useState } from "react";

// Stub — goal/todo confirmation cards removed
export const useConfirmationHandlers = () => {
  const [pendingConfirmations, setPendingConfirmations] = useState<any[]>([]);
  const handleConfirm = async () => {};
  const handleCancelConfirmation = () => {};
  return { pendingConfirmations, setPendingConfirmations, handleConfirm, handleCancelConfirmation };
};
